const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const addresses = JSON.parse(fs.readFileSync("scripts/helper/addresses.json"));

    const Auction = await hre.ethers.getContractFactory("SolverAuction");
    const auction = Auction.attach(addresses.auction);

    const tx = await auction.acceptBid(0);
    await tx.wait();

    console.log("Bid accepted for intent #0");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
