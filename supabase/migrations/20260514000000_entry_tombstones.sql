-- B-3：显式「从云端删除某条回忆」的墓碑表。syncToCloud 仅根据此表删除 entries，
-- 不再用「云端有、本地无」做差集删除，避免误删可恢复的云端备份（H3 完整版）。
-- 普通 deleteEntry 不会写入本表，云端备份保留。

CREATE TABLE IF NOT EXISTS public.entry_tombstones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entry_tombstones_user_entry_unique UNIQUE (user_id, entry_id)
);

CREATE INDEX IF NOT EXISTS entry_tombstones_user_id_idx
  ON public.entry_tombstones (user_id);

COMMENT ON TABLE public.entry_tombstones IS
  'Marks entry ids the user chose to purge from cloud; syncToCloud deletes matching rows in public.entries.';

ALTER TABLE public.entry_tombstones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entry_tombstones_select_own"
  ON public.entry_tombstones
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "entry_tombstones_insert_own"
  ON public.entry_tombstones
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "entry_tombstones_delete_own"
  ON public.entry_tombstones
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
