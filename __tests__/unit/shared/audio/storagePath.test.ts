/**
 * storagePath.test.ts
 * SEC-02 Wave 0：extractAudiosObjectPath — path / public URL / query / null.
 */

import { extractAudiosObjectPath } from '../../../../shared/audio/storagePath';

describe('extractAudiosObjectPath', () => {
  it('returns bare object path unchanged (strips leading slash)', () => {
    expect(extractAudiosObjectPath('user-1/audio-2.m4a')).toBe(
      'user-1/audio-2.m4a',
    );
    expect(extractAudiosObjectPath('/user-1/audio-2.m4a')).toBe(
      'user-1/audio-2.m4a',
    );
  });

  it('extracts path from public audios URL', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/audios/user-1/audio-2.m4a';
    expect(extractAudiosObjectPath(url)).toBe('user-1/audio-2.m4a');
  });

  it('strips query string from public URL', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/audios/user-1/a.m4a?token=abc&exp=1';
    expect(extractAudiosObjectPath(url)).toBe('user-1/a.m4a');
  });

  it('tolerates sign-marker URLs', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/sign/audios/user-1/a.m4a?token=xyz';
    expect(extractAudiosObjectPath(url)).toBe('user-1/a.m4a');
  });

  it('returns null for unparseable http(s) URLs', () => {
    expect(extractAudiosObjectPath('https://cdn.example.com/other/a.m4a')).toBeNull();
    expect(extractAudiosObjectPath('http://example.com/audios/a.m4a')).toBeNull();
  });

  it('returns null for empty / whitespace', () => {
    expect(extractAudiosObjectPath('')).toBeNull();
    expect(extractAudiosObjectPath('   ')).toBeNull();
  });

  it('decodes percent-encoded path segments', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/audios/user%2Fid/a%20b.m4a';
    expect(extractAudiosObjectPath(url)).toBe('user/id/a b.m4a');
  });
});
