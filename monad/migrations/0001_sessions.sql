CREATE TABLE challenges_sessions (
 id TEXT PRIMARY KEY, runner TEXT NOT NULL, challenge_id TEXT NOT NULL,
 nonce TEXT NOT NULL, started_at INTEGER NOT NULL, finished_at INTEGER,
 proof TEXT, signature TEXT, distance_m INTEGER, duration_sec INTEGER
);
CREATE INDEX session_runner ON challenges_sessions(runner);
