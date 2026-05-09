-- Task #143: System Health & Monitoring Dashboard
-- Adds the health_snapshots table for 30-day metric sparklines.

CREATE TABLE IF NOT EXISTS "health_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cpu_percent" real NOT NULL,
  "mem_used_mb" real NOT NULL,
  "mem_total_mb" real NOT NULL,
  "disk_used_gb" real NOT NULL,
  "disk_total_gb" real NOT NULL,
  "db_size_mb" real NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "health_snapshots_created_at_idx" ON "health_snapshots" ("created_at");
