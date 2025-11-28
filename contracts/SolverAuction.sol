// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SolverAuction {
    struct Bid {
        address solver;
        uint256 price;
    }

    mapping(uint256 => Bid) public bestBid;

    event BidPlaced(uint256 indexed intentId, address solver, uint256 price);
    event BidWon(uint256 indexed intentId, address solver, uint256 price);

    function placeBid(uint256 intentId) external payable {
        uint256 price = msg.value;

        Bid storage b = bestBid[intentId];
        if (b.price == 0 || price < b.price) {
            bestBid[intentId] = Bid(msg.sender, price);
            emit BidPlaced(intentId, msg.sender, price);
        }
    }

    function acceptBid(uint256 intentId) external {
        Bid memory b = bestBid[intentId];
        require(b.solver != address(0), "no bid");

        emit BidWon(intentId, b.solver, b.price);
    }
}
