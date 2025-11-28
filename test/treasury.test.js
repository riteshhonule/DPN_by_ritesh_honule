const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Treasury", function () {
    it("should record and accumulate fees", async function () {
        const [owner] = await ethers.getSigners();

        const Treasury = await ethers.getContractFactory("Treasury");
        const treasury = await Treasury.deploy(owner.address);
        await treasury.deployed();

        await treasury.recordFee(100);
        await treasury.recordFee(200);

        const total = await treasury.totalFees();
        expect(total.toNumber()).to.equal(300);
    });
});
