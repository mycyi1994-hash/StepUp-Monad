CREATE TABLE IF NOT EXISTS challenge_start (
  contract TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (contract, challenge_id)
);
