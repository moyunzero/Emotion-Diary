/**
 * Wave 0 RED — Write submit gate (FLOW-02 / D-08)
 * Disabled when mood missing OR when body empty and audio empty;
 * enabled only when mood set AND (body OR audio);
 * reason keys distinguish mood vs body/audio.
 * GREEN in Plan 02. Runtime require so missing module fails the test (not TS2307).
 */

type WriteSubmitInput = {
  moodLevel: number | null;
  content: string;
  audios: unknown[];
};

type WriteSubmitDisabledReason = 'mood' | 'body' | null;

type SubmitGateModule = {
  isWriteSubmitDisabled: (input: WriteSubmitInput) => boolean;
  getWriteSubmitDisabledReason: (
    input: WriteSubmitInput,
  ) => WriteSubmitDisabledReason;
};

function loadSubmitGate(): SubmitGateModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../../../components/EntryEditor/submitGate') as SubmitGateModule;
}

describe('submitGate (FLOW-02 / D-08)', () => {
  it('disables when mood is missing', () => {
    const { isWriteSubmitDisabled, getWriteSubmitDisabledReason } =
      loadSubmitGate();
    const input: WriteSubmitInput = {
      moodLevel: null,
      content: 'hello',
      audios: [],
    };
    expect(isWriteSubmitDisabled(input)).toBe(true);
    expect(getWriteSubmitDisabledReason(input)).toBe('mood');
  });

  it('disables when mood set but body and audio empty', () => {
    const { isWriteSubmitDisabled, getWriteSubmitDisabledReason } =
      loadSubmitGate();
    const input: WriteSubmitInput = {
      moodLevel: 2,
      content: '   ',
      audios: [],
    };
    expect(isWriteSubmitDisabled(input)).toBe(true);
    expect(getWriteSubmitDisabledReason(input)).toBe('body');
  });

  it('enables when mood set and body present', () => {
    const { isWriteSubmitDisabled, getWriteSubmitDisabledReason } =
      loadSubmitGate();
    const input: WriteSubmitInput = {
      moodLevel: 3,
      content: 'kept a moment',
      audios: [],
    };
    expect(isWriteSubmitDisabled(input)).toBe(false);
    expect(getWriteSubmitDisabledReason(input)).toBeNull();
  });

  it('enables when mood set and audio present (body empty)', () => {
    const { isWriteSubmitDisabled, getWriteSubmitDisabledReason } =
      loadSubmitGate();
    const input: WriteSubmitInput = {
      moodLevel: 1,
      content: '',
      audios: [{ id: 'a1' }],
    };
    expect(isWriteSubmitDisabled(input)).toBe(false);
    expect(getWriteSubmitDisabledReason(input)).toBeNull();
  });
});
