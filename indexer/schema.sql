-- ================================
-- INTENTS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS intents (
  id INTEGER PRIMARY KEY,          -- integer, matches contract uint256
  user TEXT,
  fromToken TEXT,
  toToken TEXT,
  amount TEXT,
  chainTo INTEGER,
  expiry INTEGER,
  settled INTEGER DEFAULT 0,
  settled_by TEXT,
  created_at TEXT,
  settled_at TEXT
);

-- ================================
-- TREASURY TABLES
-- ================================

-- 🔥 Updated: now includes 'who' (sender of ETH)
CREATE TABLE IF NOT EXISTS treasury_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  who TEXT,                        -- NEW: matches TreasuryDeposited(from, amount)
  amount TEXT,
  recorded_at TEXT
);

-- 🔥 Updated: used for FeeRecorded(newTotalFees)
CREATE TABLE IF NOT EXISTS treasury_snapshot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total TEXT,
  recorded_at TEXT
);

-- ================================
-- VALIDATORS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS validators (
  address TEXT PRIMARY KEY,       -- matches validator address
  stake TEXT,
  active INTEGER DEFAULT 1,
  registered_at TEXT
);

-- ================================
-- SLASH EVENTS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS slash_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  who TEXT,
  amount TEXT,
  slashed_at TEXT
);

-- ================================
-- LIQUIDITY SNAPSHOTS
-- ================================
CREATE TABLE IF NOT EXISTS liquidity_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair TEXT,
  chain TEXT,
  reserve0 TEXT,
  reserve1 TEXT,
  snapshot_at TEXT
);
