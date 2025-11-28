// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PreconfirmValidator {
    mapping(address => bool) public isValidator;

    event ValidatorAdded(address validator);
    event ValidatorRemoved(address validator);
    event Preconfirmed(uint256 intentId, address validator);

    function addValidator(address v) external {
        isValidator[v] = true;
        emit ValidatorAdded(v);
    }

    function removeValidator(address v) external {
        isValidator[v] = false;
        emit ValidatorRemoved(v);
    }

    function preconfirm(uint256 intentId) external {
        require(isValidator[msg.sender], "not validator");

        emit Preconfirmed(intentId, msg.sender);
    }
}
