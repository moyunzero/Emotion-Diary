/**
 * G-25-3 — AudioPreview rename: displayName seed, blur/cancel never onRename,
 * Check/Submit-only persist, edit chrome outside play Pressable.
 */

import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../../../..');
const previewSource = fs.readFileSync(
  path.join(root, 'components/AudioRecorder/AudioPreview.tsx'),
  'utf8',
);

describe('audioPreviewRenameContract (G-25-3)', () => {
  it('seeds editedName from displayName when entering edit', () => {
    // Pencil (or title) enter-edit must seed from visible label, not only audio.name
    expect(previewSource).toMatch(/setEditedName\(\s*displayName\s*\)/);
    expect(previewSource).toMatch(/setIsEditing\(\s*true\s*\)/);
  });

  it('never calls onRename from blur or cancel paths', () => {
    // onBlur must not invoke onRename (seeded 「录制于 …」 is non-empty)
    const blurIdx = previewSource.search(/onBlur\s*=/);
    if (blurIdx >= 0) {
      const win = previewSource.slice(Math.max(0, blurIdx - 200), blurIdx + 400);
      expect(win).not.toMatch(/onRename/);
      // Blur handler must not be the persist/save path
      expect(win).not.toMatch(/handleSaveEdit|handlePersistRename|persistRename/);
    }

    // Cancel must exit without onRename
    const cancelMatch = previewSource.match(
      /handleCancelEdit\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\s*\}/,
    );
    expect(cancelMatch).not.toBeNull();
    expect(cancelMatch![0]).not.toMatch(/onRename/);
  });

  it('persists onRename only via Check / onSubmitEditing when trim non-empty', () => {
    expect(previewSource).toMatch(/onSubmitEditing/);
    expect(previewSource).toMatch(/onRename\s*\(/);
    // Persist gate: trim non-empty before onRename
    expect(previewSource).toMatch(
      /if\s*\(\s*(?:editedName|trim(?:med)?Name|next)\.trim\(\)\s*\)[\s\S]{0,120}onRename/,
    );
    // Must not wire onBlur to the same persist handler as Check
    expect(previewSource).not.toMatch(/onBlur=\{handleSaveEdit\}/);
    expect(previewSource).not.toMatch(/onBlur=\{[^}]*onRename/);
  });

  it('keeps edit TextInput and actions outside the play Pressable', () => {
    // Play Pressable that calls handlePlayPause must not wrap TextInput / edit actions
    const playPressable = previewSource.match(
      /<Pressable[^>]*onPress=\{handlePlayPause\}[^>]*>[\s\S]*?<\/Pressable>/,
    );
    expect(playPressable).not.toBeNull();
    expect(playPressable![0]).not.toMatch(/TextInput/);
    expect(playPressable![0]).not.toMatch(/handleSaveEdit|handleCancelEdit/);
    // Edit chrome still present in component
    expect(previewSource).toMatch(/TextInput/);
    expect(previewSource).toMatch(/handleSaveEdit|persistRename|handlePersist/);
  });
});
