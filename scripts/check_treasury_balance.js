const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const addresses = JSON.parse(fs.readFileSync("scripts/helper/addresses.json"));

    const Treasury = await hre.ethers.getContractFactory("Treasury");
    const treasury = Treasury.attach(addresses.treasury);

    const total = await treasury.totalFees();
    console.log("Treasury totalFees:", total.toString());
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
