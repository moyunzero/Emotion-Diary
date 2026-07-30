-- Client revision (SYNC-01 / D-04): bigint ms mapped from MoodEntry.updatedAt.
-- Do NOT overload Postgres row-metadata timestamptz `updated_at` — that column stays untouched.
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS updatedat bigint;

COMMENT ON COLUMN public.entries.updatedat IS
  'Client revision timestamp in ms; MoodEntry.updatedAt. Not the Postgres timestamptz row-metadata column updated_at.';

-- Optional backfill: rows without revision inherit diary event timestamp (D-03 server-side).
UPDATE public.entries
SET updatedat = timestamp
WHERE updatedat IS NULL;
