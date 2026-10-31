/**
 * G-25-3 / G-25-2 — Mic audio session keep-mount + rename-safe chrome gate.
 * Source-scan contract: rename keyboard must not AND-gate collapse interactive chrome.
 */

import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../../../..');
const entryEditorSource = fs.readFileSync(
  path.join(root, 'components/EntryEditor/EntryEditor.tsx'),
  'utf8',
);

describe('micAudioSessionContract (G-25-3 / G-25-2)', () => {
  it('keeps audioSessionMounted latch so AudioRecorder is not keyboard-unmounted', () => {
    expect(entryEditorSource).toMatch(/audioSessionMounted/);
    expect(entryEditorSource).toMatch(
      /if\s*\(\s*audioSessionVisible\s*\)\s*\{\s*setAudioSessionMounted\(\s*true\s*\)/,
    );
    expect(entryEditorSource).toMatch(/audioSessionMounted\s*\?\s*\(/);
    expect(entryEditorSource).toMatch(/<AudioRecorder[\s\S]*?\/>/);
    // Must not conditionally null AudioRecorder solely for keyboard/session hide
    expect(entryEditorSource).not.toMatch(
      /keyboardOpen\s*\?\s*null[\s\S]{0,80}AudioRecorder|AudioRecorder[\s\S]{0,80}keyboardOpen\s*\?\s*null/,
    );
  });

  it('does not collapse interactive Mic chrome on any keyboardOpen while session visible', () => {
    // G-25-3: stale AND-gate forces pointerEvents:none when rename TextInput opens keyboard
    expect(entryEditorSource).not.toMatch(
      /audioSessionVisible\s*&&\s*!keyboardOpen/,
    );
    // Collapse / hide must still gate on visibility (Mic toggle), not keyboard alone
    expect(entryEditorSource).toMatch(
      /!audioSessionVisible|audioSessionVisible\s*\?\s*|contentFocused/,
    );
  });

  it('preserves single clipBinding path (no second RecordingSessionHost / clipHandler)', () => {
    expect(entryEditorSource).toMatch(/clipBinding=/);
    expect(entryEditorSource).not.toMatch(/RecordingSessionHost/);
    expect(entryEditorSource).not.toMatch(/setRecordingClipHandler/);
  });
});
