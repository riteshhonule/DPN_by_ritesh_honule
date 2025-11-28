// relayer/relayer_server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { ethers } = require("ethers");

// EXPRESS APP
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Manual CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ADDRESSES + ABI
const addresses = require("../frontend/src/abi/addresses.json");
const IntentABI = require("../frontend/src/abi/IntentRegistry.json");

// PROVIDER + RELAYER WALLET
const RPC_URL = "http://127.0.0.1:8545";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const RELAYER_KEY =
  process.env.RELAYER_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const relayer = new ethers.Wallet(RELAYER_KEY, provider);
console.log("🤖 Relayer:", relayer.address);

const intentContract = new ethers.Contract(
  addresses.intent,
  IntentABI.abi,
  relayer
);

// -------------------------------------------------
// RELAY ENDPOINT
// -------------------------------------------------
app.post("/relay_submit", async (req, res) => {
  try {
    console.log("📥 Relay Payload:", req.body);

    const {
      user,
      fromToken,
      toToken,
      amount,
      chainTo,
      expiry,
      nonce,
      signature,
      fee
    } = req.body;

    const tx = await intentContract.relaySubmitIntent(
      user,
      fromToken,
      toToken,
      amount,
      chainTo,
      expiry,
      nonce,
      signature,
      {
        value: ethers.BigNumber.from(fee),
        gasLimit: 1_000_000
      }
    );

    const receipt = await tx.wait();
    console.log("✅ Submitted Gasless Intent:", receipt.transactionHash);

    return res.json({ txHash: receipt.transactionHash });
  } catch (e) {
    console.error("❌ RELAYER ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
});

app.listen(4000, () => {
  console.log("🚀 Relayer live at http://127.0.0.1:4000");
});
