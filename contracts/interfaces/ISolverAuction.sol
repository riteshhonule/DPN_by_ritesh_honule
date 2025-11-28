// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISolverAuction {
    function placeBid(uint256 intentId) external payable;
    function acceptBid(uint256 intentId) external;
}
