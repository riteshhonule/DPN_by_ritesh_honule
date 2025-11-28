// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IStakingManager {
    function slash(address who, uint256 amount) external payable;
}

contract ValidatorRegistry {
    struct Validator {
        address owner;
        uint256 stake;
        bool active;
        uint256 withdrawAvailableAt;
    }

    address public admin;
    IStakingManager public stakingManager;

    mapping(address => Validator) public validators;
    address[] public validatorList;

    event ValidatorRegistered(address indexed who, uint256 stake);
    event ValidatorActivated(address indexed who);
    event ValidatorDeactivated(address indexed who);
    event ValidatorSlashed(address indexed who, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    constructor(address _stakingManager) {
        admin = msg.sender;
        stakingManager = IStakingManager(_stakingManager);
    }

    function register() external payable {
        require(validators[msg.sender].owner == address(0), "already registered");
        require(msg.value > 0, "stake required");

        validators[msg.sender] = Validator({
            owner: msg.sender,
            stake: msg.value,
            active: true,
            withdrawAvailableAt: 0
        });

        validatorList.push(msg.sender);

        emit ValidatorRegistered(msg.sender, msg.value);
        emit ValidatorActivated(msg.sender);
    }

    function topUp() external payable {
        require(validators[msg.sender].owner != address(0), "not registered");
        validators[msg.sender].stake += msg.value;
    }

    function requestDeactivate() external {
        Validator storage v = validators[msg.sender];

        require(v.owner == msg.sender, "not owner");
        require(v.active, "already inactive");

        v.active = false;
        v.withdrawAvailableAt = block.timestamp + 10;

        emit ValidatorDeactivated(msg.sender);
    }

    function withdraw() external {
        Validator storage v = validators[msg.sender];

        require(v.owner == msg.sender, "not owner");
        require(!v.active, "must be deactivated");
        require(block.timestamp >= v.withdrawAvailableAt, "lockup");

        uint256 amount = v.stake;
        v.stake = 0;

        payable(msg.sender).transfer(amount);
    }

    /**
     * @notice Withdraw a partial amount of stake (preserves remaining stake)
     * @dev Keeps the original withdraw() for full withdrawals for backwards compatibility
     */
    function withdraw(uint256 amount) external {
        Validator storage v = validators[msg.sender];

        require(v.owner == msg.sender, "not owner");
        require(!v.active, "must be deactivated");
        require(block.timestamp >= v.withdrawAvailableAt, "lockup");
        require(amount > 0, "amount>0");
        require(amount <= v.stake, "insufficient stake");

        v.stake -= amount;

        payable(msg.sender).transfer(amount);
    }

    /**
     * @notice Slash a validator and forward the ETH to StakingManager
     */
    function slashValidator(address who, uint256 amount) external onlyAdmin {
        Validator storage v = validators[who];
        require(v.owner != address(0), "no such validator");

        if (amount > v.stake) {
            amount = v.stake;
        }

        v.stake -= amount;

        // Forward ETH to StakingManager → which forwards to Treasury
        stakingManager.slash{value: amount}(who, amount);

        emit ValidatorSlashed(who, amount);
    }

    function listValidators() external view returns (address[] memory) {
        return validatorList;
    }

    function getValidator(address who) external view returns (Validator memory) {
        return validators[who];
    }
}
