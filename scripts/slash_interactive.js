// // scripts/slash_interactive.js
// const hre = require("hardhat");
// const fs = require("fs");
// const path = require("path");
// const readline = require("readline");

// // Ask CLI helper
// async function ask(question) {
//     const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
//     return new Promise(resolve => rl.question(question, ans => {
//         rl.close();
//         resolve(ans.trim());
//     }));
// }

// async function main() {
//     console.log("===========================================");
//     console.log(" 🔨 DPN SLASH CONTROLLER (INTERACTIVE MODE)");
//     console.log("===========================================\n");

//     // Load addresses.json
//     const addrPath = path.join(__dirname, "helper", "addresses.json");
//     if (!fs.existsSync(addrPath)) {
//         throw new Error("❌ Missing scripts/helper/addresses.json");
//     }
//     const addresses = JSON.parse(fs.readFileSync(addrPath, "utf8"));

//     if (!addresses.validatorRegistry) {
//         throw new Error("❌ ValidatorRegistry address missing in addresses.json");
//     }

//     const registryAddr = addresses.validatorRegistry;
//     const [admin] = await hre.ethers.getSigners();

//     console.log("👤 Admin (must be contract admin):", admin.address);
//     console.log("🔗 ValidatorRegistry:", registryAddr);

//     const registry = await hre.ethers.getContractAt("ValidatorRegistry", registryAddr, admin);

//     console.log("\n📡 Fetching validators...\n");

//     // Load validator list
//     let list = await registry.listValidators();
//     if (!list || list.length === 0) {
//         console.log("❌ No validators registered yet.");
//         return;
//     }

//     const validators = [];
//     for (let i = 0; i < list.length; i++) {
//         const addr = list[i];
//         const v = await registry.getValidator(addr);
//         validators.push({ index: i, address: addr, data: v });
//     }

//     console.log("Available Validators:");
//     validators.forEach(v => {
//         console.log(
//             ` [${v.index}] ${v.address}\n` +
//             `     stake: ${hre.ethers.utils.formatEther(v.data.stake)} ETH\n` +
//             `     active: ${v.data.active}\n`
//         );
//     });

//     // Choose validator
//     const index = await ask("👉 Enter validator index to slash: ");
//     const idx = parseInt(index);

//     if (isNaN(idx) || idx < 0 || idx >= validators.length) {
//         console.log("❌ Invalid index.");
//         return;
//     }

//     const chosen = validators[idx];
//     const validatorAddr = chosen.address;

//     console.log(`\n🎯 Selected validator: ${validatorAddr}`);
//     console.log(
//         `Stake: ${hre.ethers.utils.formatEther(chosen.data.stake)} ETH | Active: ${chosen.data.active}\n`
//     );

//     // Amount to slash
//     const amountStr = await ask("💰 Enter amount to slash (in ETH): ");
//     if (!amountStr || Number(amountStr) <= 0) {
//         console.log("❌ Invalid amount.");
//         return;
//     }
//     const amountWei = hre.ethers.utils.parseEther(amountStr);

//     // Confirm
//     const confirm = await ask(`Confirm slash ${amountStr} ETH from ${validatorAddr}? (yes/no): `);
//     if (confirm.toLowerCase() !== "yes") {
//         console.log("Cancelled.");
//         return;
//     }

//     console.log("\n⛏ Executing slash...");

//     try {
//         // Call the updated slashValidator function
//         const tx = await registry.slashValidator(validatorAddr, amountWei, {
//             gasLimit: 500000
//         });

//         const rcpt = await tx.wait();

//         console.log("\n✅ SUCCESS — Validator Slashed!");
//         console.log("TX Hash:", rcpt.transactionHash);

//     } catch (err) {
//         console.error("\n❌ Slash failed:", err.message || err.toString());

//         // Debug: static call for revert reason
//         try {
//             await registry.callStatic.slashValidator(validatorAddr, amountWei, {
//                 gasLimit: 500000
//             });
//         } catch (re) {
//             console.error("⚠️ Revert reason (callStatic):", re.message || re.toString());
//         }
//     }

//     console.log("\nDone.");
// }

// main().catch(err => {
//     console.error(err);
//     process.exit(1);
// });






// scripts/slash_interactive.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// CLI input helper
async function ask(q) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(res => rl.question(q, ans => {
        rl.close();
        res(ans.trim());
    }));
}

async function main() {
    console.log("===========================================");
    console.log(" 🔨 VALIDATOR SLASHING CONSOLE");
    console.log("===========================================\n");

    // Load staking_addresses.json if available, otherwise fall back to scripts/helper/addresses.json
    const addrPath = path.join(__dirname, "helper", "staking_addresses.json");
    let addresses = null;
    if (fs.existsSync(addrPath)) {
        addresses = JSON.parse(fs.readFileSync(addrPath, "utf8"));
    } else {
        const fallback = path.join(__dirname, "helper", "addresses.json");
        if (!fs.existsSync(fallback)) {
            throw new Error("❌ Missing helper/staking_addresses.json and fallback helper/addresses.json");
        }
        console.warn("⚠️ staking_addresses.json not found; falling back to scripts/helper/addresses.json");
        addresses = JSON.parse(fs.readFileSync(fallback, "utf8"));
    }

    const regAddr = addresses.validatorRegistry;
    const [admin] = await hre.ethers.getSigners();

    console.log("👤 Admin:", admin.address);
    console.log("🔗 ValidatorRegistry:", regAddr);

    const registry = await hre.ethers.getContractAt("ValidatorRegistry", regAddr, admin);

    console.log("\n📡 Fetching validators...\n");

    let list = await registry.listValidators();

    if (list.length === 0) {
        console.log("❌ No validators registered.");
        return;
    }

    const validators = [];
    for (let i = 0; i < list.length; i++) {
        const addr = list[i];
        const v = await registry.getValidator(addr);
        validators.push({ index: i, address: addr, data: v });
    }

    console.log("Available Validators:");
    validators.forEach(v => {
        console.log(
            ` [${v.index}] ${v.address}\n` +
            `     stake: ${hre.ethers.utils.formatEther(v.data.stake)} ETH\n` +
            `     active: ${v.data.active}\n`
        );
    });

    // Choose validator
    const ans = await ask("👉 Enter validator index to slash: ");
    const idx = Number(ans);

    if (isNaN(idx) || idx < 0 || idx >= validators.length) {
        console.log("❌ Invalid index.");
        return;
    }

    const val = validators[idx];

    console.log(`\n🎯 Selected: ${val.address}`);
    console.log(`Stake: ${hre.ethers.utils.formatEther(val.data.stake)} ETH\n`);

    const amtStr = await ask("💰 Enter slash amount (ETH): ");
    if (!amtStr || Number(amtStr) <= 0) {
        console.log("❌ Invalid amount.");
        return;
    }

    const amtWei = hre.ethers.utils.parseEther(amtStr);

    const confirm = await ask(`Confirm slashing ${amtStr} ETH? (yes/no): `);
    if (confirm.toLowerCase() !== "yes") {
        console.log("Cancelled.");
        return;
    }

    console.log("\n⛏ Executing slash...");

    try {
        const tx = await registry.slashValidator(val.address, amtWei, {
            gasLimit: 600000
        });
        const rcpt = await tx.wait();

        console.log("\n✅ SUCCESS — Validator Slashed!");
        console.log("TX:", rcpt.transactionHash);

    } catch (err) {
        console.error("\n❌ Slash failed:", err.message || err);

        try {
            await registry.callStatic.slashValidator(val.address, amtWei);
        } catch (inner) {
            console.error("⚠️ Revert reason:", inner.message || inner);
        }
    }

    console.log("\nDone.\n");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
