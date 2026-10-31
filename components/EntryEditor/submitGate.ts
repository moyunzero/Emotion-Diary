/**
 * Pure Write submit gate (FLOW-02 / D-08).
 * Disabled when mood missing OR when body empty and audio empty;
 * enabled only when mood set AND (body OR audio).
 */

export type WriteSubmitInput = {
  moodLevel: number | null;
  content: string;
  audios: unknown[];
};

export type WriteSubmitDisabledReason = "mood" | "body" | null;

export function getWriteSubmitDisabledReason(
  input: WriteSubmitInput,
): WriteSubmitDisabledReason {
  if (input.moodLevel === null) {
    return "mood";
  }
  if (!input.content.trim() && input.audios.length === 0) {
    return "body";
  }
  return null;
}

export function isWriteSubmitDisabled(input: WriteSubmitInput): boolean {
  return getWriteSubmitDisabledReason(input) !== null;
}
