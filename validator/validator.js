const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.RPC_URL || "http://127.0.0.1:8545"
    );

    // Validator uses 3rd account from Hardhat
    const wallet = provider.getSigner(2);

    const addresses = JSON.parse(fs.readFileSync("scripts/helper/addresses.json"));

    const abi = ["event IntentSubmitted(uint256 indexed id, address indexed user, uint256 amount)"];
    const contract = new ethers.Contract(addresses.intent, abi, provider);

    console.log("🛡 Validator running — waiting for intents...");

    contract.on("IntentSubmitted", async (id, user, amount) => {
        console.log(
            `🟩 Validator preconfirmed intent ${id.toString()} from ${user} amount=${amount.toString()}`
        );

        // For demo: No on-chain signature; just a printed pre-confirmation.
    });
}

main();
