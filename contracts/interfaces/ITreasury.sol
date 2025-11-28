// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITreasury {
    function recordFee(uint256 amount) external;
    function totalFees() external view returns (uint256);
}
