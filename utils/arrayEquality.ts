export const areOrderedStringArraysEqual = (
  a: string[] | null | undefined,
  b: string[] | null | undefined,
): boolean => {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

/** Fields that affect EntryCard / playback UI — id-only compare hid rename updates. */
type AudioEqualityFields = {
  id: string;
  name?: string;
  syncStatus?: string;
  duration?: number;
  localUri?: string;
  remoteUrl?: string;
};

export const areAudioDataArraysEqual = (
  a: AudioEqualityFields[] | null | undefined,
  b: AudioEqualityFields[] | null | undefined,
): boolean => {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return (
      item.id === other.id &&
      (item.name ?? undefined) === (other.name ?? undefined) &&
      item.syncStatus === other.syncStatus &&
      item.duration === other.duration &&
      item.localUri === other.localUri &&
      (item.remoteUrl ?? undefined) === (other.remoteUrl ?? undefined)
    );
  });
};
