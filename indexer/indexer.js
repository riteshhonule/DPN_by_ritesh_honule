// /**
//  * indexer/indexer.js
//  * Real-time indexing for intents + treasury + validators + liquidity snapshots
//  */

// const path = require("path");
// const fs = require("fs");
// const ethers = require("ethers");
// const sqlite3 = require("sqlite3").verbose();

// // ------------------------------------------------------
// // LOAD ADDRESSES
// // ------------------------------------------------------
// const ADDRESSES_PATH = path.join(__dirname, "../scripts/helper/addresses.json");
// if (!fs.existsSync(ADDRESSES_PATH)) {
//   console.error("❌ Missing addresses.json at scripts/helper/addresses.json");
//   process.exit(1);
// }
// const addresses = require(ADDRESSES_PATH);

// // ------------------------------------------------------
// // LOAD ABIS
// // ------------------------------------------------------
// const intentArtifact = require(path.join(
//   __dirname,
//   "../artifacts/contracts/IntentRegistry.sol/IntentRegistry.json"
// ));

// const treasuryArtifact = require(path.join(
//   __dirname,
//   "../artifacts/contracts/Treasury.sol/Treasury.json"
// ));

// const validatorArtifactPath = path.join(
//   __dirname,
//   "../artifacts/contracts/ValidatorRegistry.sol/ValidatorRegistry.json"
// );

// // ------------------------------------------------------
// // SQLITE SETUP
// // ------------------------------------------------------
// const DB_FILE = path.join(__dirname, "db.sqlite");
// if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "");

// const db = new sqlite3.Database(DB_FILE);

// // Load schema
// const schemaPath = path.join(__dirname, "schema.sql");
// if (!fs.existsSync(schemaPath)) {
//   console.error("❌ Missing schema.sql in indexer/");
//   process.exit(1);
// }

// const schema = fs.readFileSync(schemaPath, "utf8");
// db.exec(schema, (err) => {
//   if (err) console.error("DB schema error:", err);
//   else console.log("📦 DB ready:", DB_FILE);
// });

// // ------------------------------------------------------
// // PROVIDER
// // ------------------------------------------------------
// const provider = new ethers.providers.JsonRpcProvider(
//   process.env.RPC_URL || "http://127.0.0.1:8545"
// );

// // ------------------------------------------------------
// // CONTRACTS
// // ------------------------------------------------------
// const intentContract = new ethers.Contract(
//   addresses.intent,
//   intentArtifact.abi,
//   provider
// );

// const treasuryContract = new ethers.Contract(
//   addresses.treasury,
//   treasuryArtifact.abi,
//   provider
// );

// let validatorContract = null;
// if (fs.existsSync(validatorArtifactPath) && addresses.validatorRegistry) {
//   const validatorArtifact = require(validatorArtifactPath);
//   validatorContract = new ethers.Contract(
//     addresses.validatorRegistry,
//     validatorArtifact.abi,
//     provider
//   );
// }

// // ------------------------------------------------------
// // DB HELPERS
// // ------------------------------------------------------
// function insertIntentRow(
//   id,
//   user,
//   fromToken,
//   toToken,
//   amount,
//   chainTo,
//   expiry,
//   settled
// ) {
//   db.run(
//     `
//     INSERT OR REPLACE INTO intents
//       (id, user, fromToken, toToken, amount, chainTo, expiry, settled, created_at)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
//     `,
//     [
//       id,
//       user,
//       fromToken,
//       toToken,
//       amount.toString(),
//       chainTo,
//       expiry,
//       settled ? 1 : 0,
//     ],
//     (err) => err && console.error("insertIntentRow err:", err)
//   );
// }

// function markIntentSettled(id, solver) {
//   db.run(
//     `
//     UPDATE intents
//     SET settled = 1, settled_by = ?, settled_at = datetime('now')
//     WHERE id = ?
//   `,
//     [solver, id],
//     (err) => err && console.error("markIntentSettled err:", err)
//   );
// }

// function insertTreasuryEvent(who, amount) {
//   db.run(
//     `
//       INSERT INTO treasury_events(who, amount, recorded_at)
//       VALUES (?, ?, datetime('now'))
//     `,
//     [who, amount.toString()],
//     (err) => err && console.error("treasury_events err:", err)
//   );
// }

// function insertTreasurySnapshot(total) {
//   db.run(
//     `
//       INSERT INTO treasury_snapshot(total, recorded_at)
//       VALUES (?, datetime('now'))
//     `,
//     [total.toString()],
//     (err) => err && console.error("treasury_snapshot err:", err)
//   );
// }

// // ------------------------------------------------------
// // EVENT LISTENERS
// // ------------------------------------------------------

// console.log("🔗 Indexer connected — waiting for events...");

// //
// // INTENT SUBMITTED
// //
// intentContract.on("IntentSubmitted", (id, user, amount) => {
//   (async () => {
//     try {
//       const idNum = Number(id);

//       console.log("📥 IntentSubmitted:", idNum, user);

//       const it = await intentContract.getIntent(idNum);

//       insertIntentRow(
//         idNum,
//         it.user,
//         it.fromToken,
//         it.toToken,
//         it.amount,
//         it.chainTo,
//         it.expiry,
//         it.settled
//       );
//     } catch (err) {
//       console.error("IntentSubmitted handler failed:", err);
//     }
//   })();
// });

// //
// // INTENT SETTLED
// //
// intentContract.on("IntentSettled", (id, solver) => {
//   const idNum = Number(id);
//   console.log("✔ IntentSettled:", idNum, "solver:", solver);
//   markIntentSettled(idNum, solver);
// });

// //
// // TREASURY EVENT LISTENERS (NEW)
// //
// treasuryContract.on("TreasuryDeposited", (from, amount) => {
//   console.log("💰 TreasuryDeposited:", from, amount.toString());
//   insertTreasuryEvent(from, amount);
// });

// treasuryContract.on("FeeRecorded", (total) => {
//   console.log("📊 FeeRecorded: total =", total.toString());
//   insertTreasurySnapshot(total);
// });

// //
// // VALIDATOR REGISTRY EVENTS
// //
// if (validatorContract) {
//   validatorContract.on("ValidatorRegistered", (who, stake) => {
//     console.log("🟢 Validator registered:", who);

//     db.run(
//       `
//       INSERT OR REPLACE INTO validators(address, stake, active, registered_at)
//       VALUES (?, ?, 1, datetime('now'))
//       `,
//       [who, stake.toString()],
//       (err) => err && console.error("validators insert err:", err)
//     );
//   });

//   validatorContract.on("ValidatorSlashed", (who, amount) => {
//     console.log("⚠️ Validator slashed:", who, amount.toString());

//     db.run(
//       `
//       INSERT INTO slash_events(who, amount, slashed_at)
//       VALUES (?, ?, datetime('now'))
//       `,
//       [who, amount.toString()],
//       (err) => err && console.error("slash_events insert err:", err)
//     );
//   });

//   validatorContract.on("ValidatorDeactivated", (who) => {
//     console.log("🔷 Validator deactivated:", who);

//     db.run(
//       `
//       UPDATE validators SET active = 0 WHERE address = ?
//       `,
//       [who],
//       (err) => err && console.error("update validators err:", err)
//     );
//   });
// }

// // ------------------------------------------------------
// // LIQUIDITY COLLECTOR (OPTIONAL)
// // ------------------------------------------------------
// const liquidPath = path.join(__dirname, "liquidityCollector.js");
// if (fs.existsSync(liquidPath)) {
//   const liquidityCollector = require(liquidPath);
//   liquidityCollector.start(db, provider);
// } else {
//   console.log("ℹ No liquidityCollector.js found. Skipping liquidity indexing.");
// }

// // ------------------------------------------------------
// // API SERVER
// // ------------------------------------------------------
// const express = require("express");
// const cors = require("cors");

// const api = express();
// api.use(cors());

// api.get("/slashes", (req, res) => {
//   db.all(
//     `SELECT who, amount, slashed_at FROM slash_events ORDER BY id DESC LIMIT 100`,
//     [],
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: err.message });
//       res.json(rows || []);
//     }
//   );
// });

// const API_PORT = process.env.INDEXER_PORT || 4200;
// api.listen(API_PORT, () => {
//   console.log(`📡 Indexer API running at http://127.0.0.1:${API_PORT}`);
// });

// // ------------------------------------------------------
// // SHUTDOWN
// // ------------------------------------------------------
// process.on("SIGINT", () => {
//   console.log("🛑 Indexer shutting down.");
//   db.close();
//   process.exit(0);
// });


















/**
 * indexer/indexer.js
 * Real-time indexing for intents + treasury + validators + liquidity snapshots
 */

const path = require("path");
const fs = require("fs");
const ethers = require("ethers");
const sqlite3 = require("sqlite3").verbose();

// ------------------------------------------------------
// LOAD ADDRESSES
// ------------------------------------------------------
const ADDRESSES_PATH = path.join(__dirname, "../scripts/helper/addresses.json");
if (!fs.existsSync(ADDRESSES_PATH)) {
  console.error("❌ Missing addresses.json at scripts/helper/addresses.json");
  process.exit(1);
}
const addresses = require(ADDRESSES_PATH);

// ------------------------------------------------------
// LOAD ABIS
// ------------------------------------------------------
const intentArtifact = require(path.join(
  __dirname,
  "../artifacts/contracts/IntentRegistry.sol/IntentRegistry.json"
));

const treasuryArtifact = require(path.join(
  __dirname,
  "../artifacts/contracts/Treasury.sol/Treasury.json"
));

const validatorArtifactPath = path.join(
  __dirname,
  "../artifacts/contracts/ValidatorRegistry.sol/ValidatorRegistry.json"
);

// ------------------------------------------------------
// SQLITE SETUP
// ------------------------------------------------------
const DB_FILE = path.join(__dirname, "db.sqlite");
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "");

const db = new sqlite3.Database(DB_FILE);

// Load schema
const schemaPath = path.join(__dirname, "schema.sql");
if (!fs.existsSync(schemaPath)) {
  console.error("❌ Missing schema.sql in indexer/");
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema, (err) => {
  if (err) console.error("DB schema error:", err);
  else console.log("📦 DB ready:", DB_FILE);
});

// ------------------------------------------------------
// PROVIDER
// ------------------------------------------------------
const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL || "http://127.0.0.1:8545"
);

// ------------------------------------------------------
// CONTRACTS
// ------------------------------------------------------
const intentContract = new ethers.Contract(
  addresses.intent,
  intentArtifact.abi,
  provider
);

const treasuryContract = new ethers.Contract(
  addresses.treasury,
  treasuryArtifact.abi,
  provider
);

let validatorContract = null;
if (fs.existsSync(validatorArtifactPath) && addresses.validatorRegistry) {
  const validatorArtifact = require(validatorArtifactPath);
  validatorContract = new ethers.Contract(
    addresses.validatorRegistry,
    validatorArtifact.abi,
    provider
  );
}

// ------------------------------------------------------
// DB HELPERS
// ------------------------------------------------------
function insertIntentRow(
  id,
  user,
  fromToken,
  toToken,
  amount,
  chainTo,
  expiry,
  settled
) {
  db.run(
    `
    INSERT OR REPLACE INTO intents
      (id, user, fromToken, toToken, amount, chainTo, expiry, settled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    [
      id,
      user,
      fromToken,
      toToken,
      amount.toString(),
      chainTo,
      expiry,
      settled ? 1 : 0,
    ],
    (err) => err && console.error("insertIntentRow err:", err)
  );
}

function markIntentSettled(id, solver) {
  db.run(
    `
    UPDATE intents
    SET settled = 1, settled_by = ?, settled_at = datetime('now')
    WHERE id = ?
  `,
    [solver, id],
    (err) => err && console.error("markIntentSettled err:", err)
  );
}

function insertTreasuryEvent(who, amount) {
  db.run(
    `
      INSERT INTO treasury_events(who, amount, recorded_at)
      VALUES (?, ?, datetime('now'))
    `,
    [who, amount.toString()],
    (err) => err && console.error("treasury_events err:", err)
  );
}

function insertTreasurySnapshot(total) {
  db.run(
    `
      INSERT INTO treasury_snapshot(total, recorded_at)
      VALUES (?, datetime('now'))
    `,
    [total.toString()],
    (err) => err && console.error("treasury_snapshot err:", err)
  );
}

// ------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------

console.log("🔗 Indexer connected — waiting for events...");

//
// INTENT SUBMITTED
//
intentContract.on("IntentSubmitted", async (id, user, amount) => {
  try {
    // IntentRegistry exposes the public mapping `intents(uint256)` (auto getter)
    // there is no `getIntent` function in the contract ABI.
    const it = await intentContract.intents(id);

    console.log("📥 IntentSubmitted:", id.toString(), user);

    insertIntentRow(
      id.toString(),
      it.user,
      it.fromToken,
      it.toToken,
      it.amount,
      it.chainTo,
      it.expiry,
      it.settled
    );
  } catch (err) {
    console.error("IntentSubmitted fetch intents() failed:", err && err.message ? err.message : err);
  }
});

//
// INTENT SETTLED
//
intentContract.on("IntentSettled", (id, solver) => {
  console.log("✔ IntentSettled:", id.toString(), "solver:", solver);
  markIntentSettled(id.toString(), solver);
});

//
// TREASURY EVENTS
//
treasuryContract.on("TreasuryDeposited", (from, amount) => {
  console.log("💰 TreasuryDeposited:", from, amount.toString());
  insertTreasuryEvent(from, amount);
});

treasuryContract.on("FeeRecorded", (total) => {
  console.log("📊 FeeRecorded:", total.toString());
  insertTreasurySnapshot(total);
});

//
// VALIDATOR EVENTS
//
if (validatorContract) {
  validatorContract.on("ValidatorRegistered", (who, stake) => {
    console.log("🟢 Validator registered:", who);

    db.run(
      `
      INSERT OR REPLACE INTO validators(address, stake, active, registered_at)
      VALUES (?, ?, 1, datetime('now'))
      `,
      [who, stake.toString()],
      (err) => err && console.error("validators insert err:", err)
    );
  });

  validatorContract.on("ValidatorSlashed", (who, amount) => {
    console.log("⚠️ Validator slashed:", who, amount.toString());

    db.run(
      `
      INSERT INTO slash_events(who, amount, slashed_at)
      VALUES (?, ?, datetime('now'))
      `,
      [who, amount.toString()],
      (err) => err && console.error("slash_events insert err:", err)
    );
  });

  validatorContract.on("ValidatorDeactivated", (who) => {
    console.log("🔷 Validator deactivated:", who);

    db.run(
      `
      UPDATE validators SET active = 0 WHERE address = ?
      `,
      [who],
      (err) => err && console.error("update validators err:", err)
    );
  });
}

// ------------------------------------------------------
// API SERVER
// ------------------------------------------------------
const express = require("express");
const cors = require("cors");
const api = express();
api.use(cors());

// Return slash events
api.get("/slashes", (req, res) => {
  db.all(
    `SELECT who, amount, slashed_at FROM slash_events ORDER BY id DESC LIMIT 100`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// 🔥 NEW: Treasury events
api.get("/treasury", (req, res) => {
  db.all(
    `SELECT * FROM treasury_events ORDER BY id DESC LIMIT 50`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// 🔥 NEW: totalFees live endpoint
api.get("/treasury_total", async (req, res) => {
  const total = await treasuryContract.totalFees();
  res.json({ total: total.toString() });
});

const API_PORT = process.env.INDEXER_PORT || 4200;
api.listen(API_PORT, () => {
  console.log(`📡 Indexer API running at http://127.0.0.1:${API_PORT}`);
});

// ------------------------------------------------------
// SHUTDOWN
// ------------------------------------------------------
process.on("SIGINT", () => {
  console.log("🛑 Indexer shutting down.");
  db.close();
  process.exit(0);
});
