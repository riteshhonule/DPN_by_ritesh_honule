const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SolverAuction", function () {
    it("should accept lowest bid", async function () {
        const [owner, solver1, solver2] = await ethers.getSigners();

        const Auction = await ethers.getContractFactory("SolverAuction");
        const auction = await Auction.deploy();
        await auction.deployed();

        // Solver 1 bid
        await auction.connect(solver1).placeBid(0, {
            value: ethers.utils.parseEther("0.002"),
        });

        // Solver 2 places lower bid
        await auction.connect(solver2).placeBid(0, {
            value: ethers.utils.parseEther("0.001"),
        });

        const best = await auction.bestBid(0);
        expect(best.solver).to.equal(solver2.address);

        // Accept bid
        await auction.connect(owner).acceptBid(0);
    });
});
