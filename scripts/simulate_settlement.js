const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const addresses = JSON.parse(fs.readFileSync("scripts/helper/addresses.json"));

    const Intent = await hre.ethers.getContractFactory("IntentRegistry");
    const intent = Intent.attach(addresses.intent);

    const [owner] = await hre.ethers.getSigners();

    const tx = await intent.connect(owner).markSettled(0);
    await tx.wait();

    console.log("Intent #0 marked as settled");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
