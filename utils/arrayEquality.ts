export const areOrderedStringArraysEqual = (
  a: string[] | null | undefined,
  b: string[] | null | undefined,
): boolean => {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

export const areAudioDataArraysEqual = (
  a: { id: string }[] | null | undefined,
  b: { id: string }[] | null | undefined,
): boolean => {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item.id === b[index].id);
};
