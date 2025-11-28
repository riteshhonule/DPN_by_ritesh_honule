const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

// ------------------------------
// LOAD CONTRACT + RELAYER CONFIG
// ------------------------------
const addresses = require("../scripts/helper/addresses.json");
const intentAbi = require("../artifacts/contracts/IntentRegistry.sol/IntentRegistry.json").abi;

// Hardhat relayer private key (Account #0)
const RELAYER_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const RPC_URL = "http://127.0.0.1:8545";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const relayerWallet = new ethers.Wallet(RELAYER_KEY, provider);

const intentContract = new ethers.Contract(
  addresses.intent,
  intentAbi,
  relayerWallet
);

// ------------------------------
//  HEALTH CHECK ROUTE
// ------------------------------
app.get("/", (req, res) => {
  res.json({
    status: "Relayer OK",
    network: RPC_URL,
    relayer: relayerWallet.address,
    contract: addresses.intent,
  });
});

// ------------------------------
//      GASLESS META TX RELAY
// ------------------------------
app.post("/relay_submit", async (req, res) => {
  try {
    console.log("\n🔥 Incoming gasless intent:", req.body);

    const {
      user,
      fromToken,
      toToken,
      amount,
      chainTo,
      expiry,
      nonce,
      signature,
    } = req.body;

    // Validate fields
    if (!user || !amount || !signature) {
      return res.status(400).json({
        error: "Missing required fields (user, amount, signature).",
      });
    }

    // Configure relayer fee
    const relayerFee = ethers.utils.parseEther("0.001");

    console.log("🚀 Sending meta-tx on behalf of:", user);

    // Execute relay submit
    const tx = await intentContract.relaySubmitIntent(
      user,
      fromToken,
      toToken,
      amount,
      chainTo,
      expiry,
      nonce,
      signature,
      { value: relayerFee }
    );

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ Gasless Intent Submitted!");
    console.log("   TX Hash:", receipt.transactionHash);

    return res.json({
      success: true,
      message: "Gasless intent submitted successfully",
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      relayer: relayerWallet.address,
      feePaid: relayerFee.toString(),
    });
  } catch (err) {
    console.error("❌ Relayer Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
      details: err.reason || null,
    });
  }
});

// ------------------------------
//        START RELAYER
// ------------------------------
app.listen(4000, () => {
  console.log("🚀 Relayer is running at http://127.0.0.1:4000");
  console.log("Relayer Address:", relayerWallet.address);
  console.log("Connected Contract:", addresses.intent);
});
