const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.RPC_URL || "http://127.0.0.1:8545"
    );

    // Use second Hardhat account as solver
    const wallet = provider.getSigner(1);

    const addresses = JSON.parse(fs.readFileSync("scripts/helper/addresses.json"));

    const intentAbi = [
        "event IntentSubmitted(uint256 indexed id, address indexed user, uint256 amount)"
    ];
    const intent = new ethers.Contract(addresses.intent, intentAbi, provider);

    const auctionAbi = ["function placeBid(uint256) payable"];
    const auction = new ethers.Contract(addresses.auction, auctionAbi, wallet);

    console.log("🔍 Solver started — listening for intents...");

    intent.on("IntentSubmitted", async (id, user, amount) => {
        console.log(
            `🟢 New Intent Detected: ID=${id.toString()} User=${user} Amount=${amount.toString()}`
        );

        try {
            // Solver bond = 0.0005 ETH
            const tx = await auction.placeBid(id, {
                value: ethers.utils.parseEther("0.0005"),
            });
            await tx.wait();

            console.log(`🤖 Solver placed bid for intent ${id.toString()}`);
        } catch (e) {
            console.error("❌ Error placing bid:", e);
        }
    });
}

main();
