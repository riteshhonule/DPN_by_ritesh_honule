// scripts/deploy.js (FULL UPDATED VERSION)
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeJSON(target, data) {
    ensureDir(path.dirname(target));
    fs.writeFileSync(target, JSON.stringify(data, null, 2));
    console.log("📁 Saved:", target);
}

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("\n=======================================");
    console.log(" 🚀 FULL SYSTEM DEPLOY (Treasury + SM + VR + Intent)");
    console.log("=======================================\n");

    console.log("👤 Deployer:", deployer.address);
    console.log("💰 Balance:", (await deployer.getBalance()).toString(), "\n");

    // ---------------------------------------------------------------------
    // 1️⃣ Treasury
    // ---------------------------------------------------------------------
    console.log("📌 Deploying Treasury...");
    const Treasury = await hre.ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(deployer.address);
    await treasury.deployed();
    console.log("   ➤ Treasury:", treasury.address);

    // ---------------------------------------------------------------------
    // 2️⃣ StakingManager
    // ---------------------------------------------------------------------
    console.log("\n📌 Deploying StakingManager...");
    const StakingManager = await hre.ethers.getContractFactory("StakingManager");
    const staking = await StakingManager.deploy(treasury.address);
    await staking.deployed();
    console.log("   ➤ StakingManager:", staking.address);

    // ---------------------------------------------------------------------
    // 3️⃣ ValidatorRegistry
    // ---------------------------------------------------------------------
    console.log("\n📌 Deploying ValidatorRegistry...");
    const ValidatorRegistry = await hre.ethers.getContractFactory("ValidatorRegistry");
    const registry = await ValidatorRegistry.deploy(staking.address);
    await registry.deployed();
    console.log("   ➤ ValidatorRegistry:", registry.address);

    // ---------------------------------------------------------------------
    // 4️⃣ IntentRegistry
    // ---------------------------------------------------------------------
    console.log("\n📌 Deploying IntentRegistry...");
    const IntentRegistry = await hre.ethers.getContractFactory("IntentRegistry");
    const intent = await IntentRegistry.deploy(treasury.address);
    await intent.deployed();
    console.log("   ➤ IntentRegistry:", intent.address);

    // ---------------------------------------------------------------------
    // 5️⃣ SolverAuction (optional)
    // ---------------------------------------------------------------------
    console.log("\n📌 Deploying SolverAuction...");
    const SolverAuction = await hre.ethers.getContractFactory("SolverAuction");
    const auction = await SolverAuction.deploy();
    await auction.deployed();
    console.log("   ➤ SolverAuction:", auction.address);

    // ---------------------------------------------------------------------
    // BUILD ADDRESSES OBJECT
    // ---------------------------------------------------------------------
    const addresses = {
        treasury: treasury.address,
        stakingManager: staking.address,
        validatorRegistry: registry.address,
        intent: intent.address,
        auction: auction.address
    };

    console.log("\n=======================================");
    console.log(" ✅ DEPLOY COMPLETE");
    console.log("=======================================");
    console.log(addresses);
    console.log("");

    // ---------------------------------------------------------------------
    // WRITE ADDRESSES TO ALL LOCATIONS
    // ---------------------------------------------------------------------
    writeJSON(
        path.join(__dirname, "helper", "addresses.json"),
        addresses
    );

    writeJSON(
        path.join(__dirname, "..", "frontend", "src", "abi", "addresses.json"),
        addresses
    );

    writeJSON(
        path.join(__dirname, "..", "indexer", "scripts", "helper", "addresses.json"),
        addresses
    );

    // ---------------------------------------------------------------------
    // COPY ABIs TO FRONTEND
    // ---------------------------------------------------------------------
    console.log("\n📦 Copying ABIs to frontend/src/abi/...");

    const abiDir = path.join(__dirname, "..", "frontend", "src", "abi");
    ensureDir(abiDir);

    const abiSources = {
        "IntentRegistry.json": path.join(__dirname, "..", "artifacts/contracts/IntentRegistry.sol/IntentRegistry.json"),
        "Treasury.json": path.join(__dirname, "..", "artifacts/contracts/Treasury.sol/Treasury.json"),
        "StakingManager.json": path.join(__dirname, "..", "artifacts/contracts/StakingManager.sol/StakingManager.json"),
        "ValidatorRegistry.json": path.join(__dirname, "..", "artifacts/contracts/ValidatorRegistry.sol/ValidatorRegistry.json"),
        "SolverAuction.json": path.join(__dirname, "..", "artifacts/contracts/SolverAuction.sol/SolverAuction.json")
    };

    for (const [name, src] of Object.entries(abiSources)) {
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(abiDir, name));
            console.log("   ✔ Copied", name);
        } else {
            console.warn("   ⚠ ABI not found:", src);
        }
    }

    console.log("\n🎉 Deployment + ABI sync completed.\n");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
