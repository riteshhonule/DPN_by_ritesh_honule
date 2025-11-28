// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Treasury.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract IntentRegistry is EIP712 {
    using ECDSA for bytes32;

    struct Intent {
        address user;
        address fromToken;
        address toToken;
        uint256 amount;
        uint256 chainTo;
        uint256 expiry;
        bool settled;
    }

    Treasury public immutable treasury;
    uint256 public nextId;
    mapping(uint256 => Intent) public intents;

    mapping(address => uint256) public nonces;

    event IntentSubmitted(uint256 indexed id, address indexed user, uint256 amount);
    event IntentSettled(uint256 indexed id, address solver);

    bytes32 private constant INTENT_TYPEHASH =
        keccak256(
            "Intent(address user,address fromToken,address toToken,uint256 amount,uint256 chainTo,uint256 expiry,uint256 nonce)"
        );

    constructor(address payable _treasury) EIP712("IntentRegistry", "1") {
        treasury = Treasury(_treasury);
    }

    function submitIntent(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 chainTo,
        uint256 expiry
    ) external payable returns (uint256) {
        uint256 id = nextId++;

        intents[id] = Intent(msg.sender, fromToken, toToken, amount, chainTo, expiry, false);

        if (msg.value > 0) {
            // use call to forward all gas to Treasury.receive() so it can do storage writes
            (bool ok, ) = address(treasury).call{value: msg.value}("");
            require(ok, "treasury transfer failed");
        }

        emit IntentSubmitted(id, msg.sender, amount);
        return id;
    }

    function relaySubmitIntent(
        address user,
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 chainTo,
        uint256 expiry,
        uint256 nonce,
        bytes calldata signature
    ) external payable returns (uint256) {
        bytes32 structHash = keccak256(
            abi.encode(
                INTENT_TYPEHASH,
                user,
                fromToken,
                toToken,
                amount,
                chainTo,
                expiry,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        require(ECDSA.recover(digest, signature) == user, "Invalid signature");
        require(nonce == nonces[user], "Invalid nonce");

        nonces[user]++;

        uint256 id = nextId++;
        intents[id] = Intent(user, fromToken, toToken, amount, chainTo, expiry, false);

        if (msg.value > 0) {
            (bool ok, ) = address(treasury).call{value: msg.value}("");
            require(ok, "treasury transfer failed");
        }

        emit IntentSubmitted(id, user, amount);
        return id;
    }

    function markSettled(uint256 id) external {
        Intent storage it = intents[id];
        require(!it.settled, "already settled");

        it.settled = true;
        emit IntentSettled(id, msg.sender);
    }
}
