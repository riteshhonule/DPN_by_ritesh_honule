const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IntentRegistry", function () {
    it("should submit intent and mark settled", async function () {
        const [owner, user] = await ethers.getSigners();

        const Treasury = await ethers.getContractFactory("Treasury");
        const treasury = await Treasury.deploy(owner.address);
        await treasury.deployed();

        const Intent = await ethers.getContractFactory("IntentRegistry");
        const intent = await Intent.deploy(treasury.address);
        await intent.deployed();

        // Submit intent
        const tx = await intent
            .connect(user)
            .submitIntent(
                "0x0",
                "0x0",
                ethers.utils.parseEther("1"),
                1,
                0,
                { value: ethers.utils.parseEther("0.001") }
            );
        await tx.wait();

        // Check treasury fees
        const fee = await treasury.totalFees();
        expect(fee.toString()).to.equal(ethers.utils.parseEther("0.001").toString());

        // Mark settled
        await intent.markSettled(0);
        const stored = await intent.getIntent(0);
        expect(stored.settled).to.equal(true);
    });
});
