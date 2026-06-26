/*
# AI Social Analytics Pipeline — Database Schema

## Overview
Schema for the "Phân tích mạng xã hội AI & Công nghệ" (Twitter + Reddit) analytics pipeline dashboard.
Single-tenant app (no auth required) — anon key can read and write all tables.

## New Tables

### pipeline_runs
Tracks each pipeline step execution with status and timing.
- id: uuid primary key
- step_name: name of the pipeline step (collect, hdfs, sqoop, flume, hbase, hive, pig, oozie)
- status: pending | running | completed | error
- started_at / completed_at: timing
- log_output: full log text
- data_stats: JSONB with row counts and file sizes

### pipeline_logs
Individual log entries for real-time streaming display.
- id: uuid primary key
- run_id: foreign key to pipeline_runs
- level: info | warn | error | success
- message: log message text
- created_at: timestamp

### analytics_results
Stores pre-computed analytics results as JSONB for fast dashboard rendering.
One row per analysis type.
- id: uuid primary key
- analysis_type: keyword_stats | top_hashtags | reddit_engagement | daily_trend | sentiment
- data: JSONB array of result rows
- computed_at: when this was last computed
- record_count: how many rows in data
- source_rows: how many source rows were analyzed

### system_config
Key-value store for current system configuration.
- key: config key
- value: config value text
- updated_at: timestamp

## Security
- All tables have RLS enabled.
- Policies allow anon + authenticated full CRUD (single-tenant, shared data).
*/

-- Pipeline runs table
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','error')),
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  log_output text DEFAULT '',
  data_stats jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pipeline_runs" ON pipeline_runs;
CREATE POLICY "anon_select_pipeline_runs" ON pipeline_runs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pipeline_runs" ON pipeline_runs;
CREATE POLICY "anon_insert_pipeline_runs" ON pipeline_runs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pipeline_runs" ON pipeline_runs;
CREATE POLICY "anon_update_pipeline_runs" ON pipeline_runs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pipeline_runs" ON pipeline_runs;
CREATE POLICY "anon_delete_pipeline_runs" ON pipeline_runs FOR DELETE TO anon, authenticated USING (true);

-- Pipeline logs table
CREATE TABLE IF NOT EXISTS pipeline_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info','warn','error','success')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pipeline_logs" ON pipeline_logs;
CREATE POLICY "anon_select_pipeline_logs" ON pipeline_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pipeline_logs" ON pipeline_logs;
CREATE POLICY "anon_insert_pipeline_logs" ON pipeline_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pipeline_logs" ON pipeline_logs;
CREATE POLICY "anon_update_pipeline_logs" ON pipeline_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pipeline_logs" ON pipeline_logs;
CREATE POLICY "anon_delete_pipeline_logs" ON pipeline_logs FOR DELETE TO anon, authenticated USING (true);

-- Analytics results table
CREATE TABLE IF NOT EXISTS analytics_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type text UNIQUE NOT NULL,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at timestamptz DEFAULT now(),
  record_count integer DEFAULT 0,
  source_rows integer DEFAULT 0
);

ALTER TABLE analytics_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_analytics" ON analytics_results;
CREATE POLICY "anon_select_analytics" ON analytics_results FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_analytics" ON analytics_results;
CREATE POLICY "anon_insert_analytics" ON analytics_results FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_analytics" ON analytics_results;
CREATE POLICY "anon_update_analytics" ON analytics_results FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_analytics" ON analytics_results;
CREATE POLICY "anon_delete_analytics" ON analytics_results FOR DELETE TO anon, authenticated USING (true);

-- System config table
CREATE TABLE IF NOT EXISTS system_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_config" ON system_config;
CREATE POLICY "anon_select_config" ON system_config FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_config" ON system_config;
CREATE POLICY "anon_insert_config" ON system_config FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_config" ON system_config;
CREATE POLICY "anon_update_config" ON system_config FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_config" ON system_config;
CREATE POLICY "anon_delete_config" ON system_config FOR DELETE TO anon, authenticated USING (true);

-- Seed default config
INSERT INTO system_config (key, value) VALUES
  ('db_mode', 'mysql'),
  ('data_source', 'synthetic'),
  ('web_port', '5000'),
  ('hdfs_replication', '3'),
  ('hdfs_block_size_mb', '128'),
  ('oozie_schedule', '0 19 * * *'),
  ('keywords', 'ChatGPT,GPT-4,Gemini,Claude AI,Llama,Stable Diffusion,Midjourney,OpenAI,AI safety,machine learning')
ON CONFLICT (key) DO NOTHING;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_step ON pipeline_runs(step_name);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_run_id ON pipeline_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_created ON pipeline_logs(created_at);
