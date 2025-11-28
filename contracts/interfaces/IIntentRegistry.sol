// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IIntentRegistry {
    function submitIntent(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 chainTo,
        uint256 expiry
    ) external payable returns (uint256);

    function markSettled(uint256 id) external;
}
