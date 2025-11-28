/**
 * server/indexerApi.js
 * Clean + corrected API mapped exactly to your DB schema
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

// ==========================================================
// DB LOAD
// ==========================================================
const DB_FILE = path.join(__dirname, "../indexer/db.sqlite");
if (!fs.existsSync(DB_FILE)) {
    console.error("❌ ERROR: DB not found at", DB_FILE);
    console.error("➡ Run: node indexer/indexer.js first");
}

const db = new sqlite3.Database(DB_FILE || ":memory:");
const app = express();
app.use(cors());
app.use(express.json());

// ==========================================================
// HEALTH
// ==========================================================
app.get("/health", (req, res) => res.send({ ok: true }));

// ==========================================================
// INTENTS LIST
// ==========================================================
app.get("/intents", (req, res) => {
    const limit = parseInt(req.query.limit || "100");
    const offset = parseInt(req.query.offset || "0");
    const settled = req.query.settled;

    let sql = `SELECT * FROM intents ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    let params = [limit, offset];

    if (typeof settled !== "undefined") {
        sql = `SELECT * FROM intents WHERE settled = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params = [settled === "1" ? 1 : 0, limit, offset];
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).send({ error: err.message });
        res.send(rows);
    });
});

// ==========================================================
// SINGLE INTENT
// ==========================================================
app.get("/intent/:id", (req, res) => {
    db.get(
        `SELECT * FROM intents WHERE id = ?`,
        [req.params.id],
        (err, row) => {
            if (err) return res.status(500).send({ error: err.message });
            if (!row) return res.status(404).send({ error: "not found" });
            res.send(row);
        }
    );
});

// ==========================================================
// VALIDATORS
// ==========================================================
app.get("/validators", (req, res) => {
    db.all(
        `SELECT address, stake, active, registered_at
         FROM validators
         ORDER BY registered_at DESC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).send({ error: err.message });
            res.send(rows);
        }
    );
});

// ==========================================================
// SLASH EVENTS  (REAL TABLE = slash_events)
// ==========================================================
app.get("/slashes", (req, res) => {
    db.all(
        `SELECT who, amount, slashed_at 
         FROM slash_events 
         ORDER BY slashed_at DESC 
         LIMIT 200`,
        [],
        (err, rows) => {
            if (err) return res.status(500).send({ error: err.message });
            res.send(rows);
        }
    );
});

// ==========================================================
// TREASURY TOTAL (treasury_snapshot table)
// ==========================================================
app.get("/treasury/total", (req, res) => {
    db.get(
        `SELECT total FROM treasury_snapshot ORDER BY recorded_at DESC LIMIT 1`,
        [],
        (err, row) => {
            if (err) return res.status(500).send({ error: err.message });
            res.send({ total: row ? row.total : "0" });
        }
    );
});

// ==========================================================
// LIQUIDITY SNAPSHOTS
// ==========================================================
app.get("/liquidity", (req, res) => {
    const pair = req.query.pair;

    if (pair) {
        db.all(
            `SELECT * FROM liquidity_snapshots
             WHERE pair = ?
             ORDER BY snapshot_at DESC LIMIT 50`,
            [pair],
            (err, rows) => {
                if (err) return res.status(500).send({ error: err.message });
                res.send(rows);
            }
        );
    } else {
        db.all(
            `SELECT * FROM liquidity_snapshots
             ORDER BY snapshot_at DESC LIMIT 200`,
            [],
            (err, rows) => {
                if (err) return res.status(500).send({ error: err.message });
                res.send(rows);
            }
        );
    }
});

// ==========================================================
// ROUTE ENDPOINT (mock)
// ==========================================================
app.get("/route/:intentId", (req, res) => {
    db.get(
        `SELECT * FROM intents WHERE id = ?`,
        [req.params.intentId],
        (err, intent) => {
            if (err) return res.status(500).send({ error: err.message });
            if (!intent) return res.status(404).send({ error: "intent not found" });

            const mock = {
                intentId: req.params.intentId,
                route: [
                    { chain: "ethereum", action: "swap", dex: "UniswapV3", pair: "ETH/USDC", outEstimate: "990" },
                    { chain: "polygon", action: "bridge", bridge: "MockBridge", outEstimate: "989" }
                ],
                estimatedOutput: "989",
                gasEstimate: "0.002"
            };

            res.send(mock);
        }
    );
});

// ==========================================================
// SERVER START
// ==========================================================
const PORT = process.env.PORT || 4200;
app.listen(PORT, () => {
    console.log(`📡 Indexer API running at http://127.0.0.1:${PORT}`);
});
