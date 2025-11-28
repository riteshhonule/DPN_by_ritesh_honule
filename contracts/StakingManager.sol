// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract StakingManager {
    address public admin;
    address payable public treasury;

    mapping(address => uint256) public slashed;

    event Slashed(address indexed who, uint256 amount);
    event TreasuryPaid(uint256 amount);

    constructor(address payable _treasury) {
        admin = msg.sender;
        treasury = _treasury;
    }

    /**
     * @notice Called by ValidatorRegistry to slash a validator
     *         and forward the slashed ETH to the Treasury.
     */
    function slash(address who, uint256 amount) external payable {
        slashed[who] += amount;

        // Forward ETH to Treasury
        if (msg.value > 0) {
            (bool ok, ) = treasury.call{value: msg.value}("");
            require(ok, "treasury transfer failed");
            emit TreasuryPaid(msg.value); // for indexer tracking
        }

        emit Slashed(who, amount);
    }

    receive() external payable {
        // Accept ETH if needed (but unused)
    }
}
