-- 002 软删：列名必须与 PostgREST upsert 的 JSON 键一致（与 moodlevel / resolvedat / burnedat 同为无下划线）
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS deletedat bigint;

COMMENT ON COLUMN public.entries.deletedat IS
  'Soft-delete timestamp in ms; null = not deleted. Client MoodEntry.deletedAt.';
