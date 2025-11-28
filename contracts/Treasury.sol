// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Treasury {
    address public immutable owner;
    uint256 public totalFees;

    // 🔥 New Events
    event TreasuryDeposited(address indexed from, uint256 amount);
    event FeeRecorded(uint256 newTotalFees);

    constructor(address _owner) {
        owner = _owner;
    }

    /**
     * @notice Called by StakingManager or any authorized contract
     *         to record protocol fees (without sending ETH)
     */
    function recordFee(uint256 amount) external {
        totalFees += amount;

        emit FeeRecorded(totalFees);
    }

    /**
     * @notice Called whenever ETH is forwarded into Treasury
     *         (slashing, fee forwarding, deposits, etc)
     */
    receive() external payable {
        totalFees += msg.value;

        emit TreasuryDeposited(msg.sender, msg.value);
        emit FeeRecorded(totalFees);
    }
}
