// scripts/deploy_validator.js
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("👤 Deploying ValidatorRegistry with:", deployer.address);
    console.log("💰 Balance:", (await deployer.getBalance()).toString());

    // For demo, StakingManager = deployer (admin)
    const stakingManager = deployer.address;

    const ValidatorRegistry = await ethers.getContractFactory("ValidatorRegistry");
    const registry = await ValidatorRegistry.deploy(stakingManager);

    await registry.deployed();

    console.log("✅ ValidatorRegistry deployed at:", registry.address);

    // Write to addresses.json
    const addrPath = path.join(__dirname, "helper", "addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addrPath, "utf8"));

    addresses.validatorRegistry = registry.address;

    fs.writeFileSync(addrPath, JSON.stringify(addresses, null, 2));

    console.log("📁 Updated addresses.json with validatorRegistry:", registry.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
