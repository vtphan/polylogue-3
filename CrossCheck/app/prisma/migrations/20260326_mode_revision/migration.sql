-- Add hinted field to annotations
ALTER TABLE "annotations" ADD COLUMN "hinted" BOOLEAN NOT NULL DEFAULT false;

-- Migrate "spot" → "classify" with detect_only categorization
UPDATE "groups"
SET config = config || '{"categorization": "detect_only"}'
WHERE config->>'difficulty_mode' = 'spot';

UPDATE "groups"
SET config = jsonb_set(config, '{difficulty_mode}', '"classify"')
WHERE config->>'difficulty_mode' = 'spot';

-- Migrate "full" → "explain"
UPDATE "groups"
SET config = jsonb_set(config, '{difficulty_mode}', '"explain"')
WHERE config->>'difficulty_mode' = 'full';

-- Same for session-level config (backward compat fallback)
UPDATE "sessions"
SET config = jsonb_set(config, '{difficulty_mode}', '"classify"')
WHERE config->>'difficulty_mode' = 'spot';

UPDATE "sessions"
SET config = jsonb_set(config, '{difficulty_mode}', '"explain"')
WHERE config->>'difficulty_mode' = 'full';
