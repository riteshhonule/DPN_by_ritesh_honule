// scripts/submit_intent.js  (safer version)
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const helperPath = "scripts/helper/addresses.json";
  if (!fs.existsSync(helperPath)) {
    throw new Error(`Missing ${helperPath} — deploy contracts first.`);
  }

  const addresses = JSON.parse(fs.readFileSync(helperPath, "utf8"));
  if (!addresses.intent) throw new Error("addresses.intent missing in addresses.json");

  // quick provider/contract sanity check
  const provider = hre.ethers.provider;
  const code = await provider.getCode(addresses.intent);
  if (!code || code === "0x") {
    throw new Error(`No contract code found at intent address ${addresses.intent}. Redeploy or update addresses.json.`);
  }

  const Intent = await hre.ethers.getContractFactory("IntentRegistry");
  const intent = Intent.attach(addresses.intent);

  const [user] = await hre.ethers.getSigners();
  console.log("Using signer:", user.address);
  console.log("Intent contract:", addresses.intent);

  const fromToken = "0x0000000000000000000000000000000000000000";
  const toToken = "0x0000000000000000000000000000000000000000";
  const amount = hre.ethers.utils.parseEther("1");
  const chainTo = 1;
  const expiry = 0;
  const fee = hre.ethers.utils.parseEther("0.001");

  // Pre-check with callStatic to see if function would revert (helps reveal reason)
  try {
    await intent.connect(user).callStatic.submitIntent(
      fromToken, toToken, amount, chainTo, expiry, { value: fee, gasLimit: 500000 }
    );
    console.log("callStatic succeeded — proceeding to send transaction...");
  } catch (callErr) {
    console.error("callStatic failed (function will revert). Revert reason (if available):");
    console.error(callErr.message || callErr);
    process.exit(1);
  }

  // Send tx
  try {
    const tx = await intent.connect(user).submitIntent(
      fromToken, toToken, amount, chainTo, expiry, { value: fee, gasLimit: 500000 }
    );
    const rcpt = await tx.wait();
    console.log("Intent submitted! Tx Hash:", rcpt.transactionHash);
  } catch (err) {
    console.error("Transaction failed:", err.message || err);
    // attempt static call again without gas override to try to print explicit revert reason
    try {
      await intent.connect(user).callStatic.submitIntent(fromToken, toToken, amount, chainTo, expiry, { value: fee });
    } catch (re) {
      console.error("callStatic revert reason:", re.message || re);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message || e);
  process.exit(1);
});
