/**
 * liquidityCollector.js
 * - periodically take "snapshots" of liquidity and store into indexer DB
 * - modular collectors for each DEX/chain can be added
 */

const ethers = require("ethers");

const MOCK_PAIRS = [
  { name: "ETH/USDC", chain: "ethereum", pool: "mock" },
  { name: "USDC/DAI", chain: "polygon", pool: "mock" },
];

function start(db, provider) {
  console.log("Liquidity collector starting (mock)...");

  async function snapshot() {
    try {
      // Replace with real calls to on-chain pairs / aggregated RPCs
      const ts = new Date().toISOString();
      for (const p of MOCK_PAIRS) {
        // create a fake number based on time for demo
        const reserve0 = Math.floor(Math.random() * 1000000);
        const reserve1 = Math.floor(Math.random() * 1000000);
        db.run(
          `INSERT INTO liquidity_snapshots(pair, chain, reserve0, reserve1, snapshot_at) VALUES(?,?,?,?,datetime('now'))`,
          [p.name, p.chain, reserve0, reserve1]
        );
      }
      // keep only last N rows if you want; for demo we'll keep all
    } catch (err) {
      console.error("liquidity snapshot error:", err);
    }
  }

  // run immediately, then repeat
  snapshot();
  setInterval(snapshot, 15000);

  return { stop: () => {} };
}

module.exports = { start };
