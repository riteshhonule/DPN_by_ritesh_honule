const ethers = require("ethers");
const addresses = require("../scripts/helper/addresses.json");
const intentABI = require("../artifacts/contracts/IntentRegistry.sol/IntentRegistry.json").abi;

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

const wallet = new ethers.Wallet(
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    provider
);

const intentContract = new ethers.Contract(addresses.intent, intentABI, provider);

console.log("⚙️ Solver Engine started");

intentContract.on("IntentSubmitted", async (id, user, amount) => {
    console.log("🟣 New intent:", id.toString(), "=> computing best route...");

    // fake solver logic: bid always
    const tx = await wallet.sendTransaction({
        to: user,
        value: ethers.utils.parseEther("0.0001")
    });

    console.log("🟢 Solver placed bid TX:", tx.hash);
});
