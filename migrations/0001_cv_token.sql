-- Section 6 token store. PLAN section 6.1.
CREATE TABLE IF NOT EXISTS cv_token (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash  BLOB    NOT NULL UNIQUE,  -- sha256; the raw token is never stored
  email       TEXT    NOT NULL,         -- lowercased at insert; SQLite has no CITEXT
  issued_at   INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  redeemed_at INTEGER,
  src_net     TEXT,                     -- truncated to /24 before insert
  revoked     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS cv_token_email  ON cv_token (email, issued_at);
CREATE INDEX IF NOT EXISTS cv_token_net    ON cv_token (src_net, issued_at);
CREATE INDEX IF NOT EXISTS cv_token_expiry ON cv_token (expires_at) WHERE redeemed_at IS NULL;
