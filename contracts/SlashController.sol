// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ValidatorRegistry.sol";

/**
 * @title SlashController
 * @notice Central router for slashing misbehaving validators or relayers.
 *         Any authorized caller (IntentRegistry, SettlementManager, gov role)
 *         can execute a slash action.
 */
contract SlashController {
    address public admin;
    ValidatorRegistry public validatorRegistry;

    event Slashed(address indexed validator, uint256 amount, address indexed caller);

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    constructor(address _validatorRegistry) {
        admin = msg.sender;
        validatorRegistry = ValidatorRegistry(_validatorRegistry);
    }

    /**
     * @notice Slash a validator for misbehavior
     * @param validator address to slash
     * @param amount amount to slash
     */
    function slash(address validator, uint256 amount) external onlyAdmin {
        validatorRegistry.slashValidator(validator, amount);
        emit Slashed(validator, amount, msg.sender);
    }

    /**
     * @notice Transfer admin role (optional governance)
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "zero");
        admin = newAdmin;
    }
}
