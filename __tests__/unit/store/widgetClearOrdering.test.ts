/**
 * Logout / SecureStore-fail sign-out must clear Soft Stack before remote signOut.
 */

import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../../..');

describe('widget snapshot clear ordering on account transition', () => {
  it('user.logout / deleteAccount / account-switch clear before signOut or set(user)', () => {
    const src = fs.readFileSync(
      path.join(root, 'store/modules/user.ts'),
      'utf8',
    );

    const logoutIdx = src.indexOf('logout: async ()');
    const deleteIdx = src.indexOf('deleteAccount: async ()');
    expect(logoutIdx).toBeGreaterThan(-1);

    const logoutBlock = src.slice(logoutIdx, deleteIdx);
    const clearMain = logoutBlock.indexOf(
      'await enqueueClearWidgetSnapshot("logout clear")',
    );
    const signOutMain = logoutBlock.indexOf('await supabase.auth.signOut()');
    expect(clearMain).toBeGreaterThan(-1);
    expect(signOutMain).toBeGreaterThan(clearMain);

    const catchClear = logoutBlock.indexOf(
      'await enqueueClearWidgetSnapshot("logout clear (catch)")',
    );
    const catchSetUser = logoutBlock.indexOf('set({ user: null })', catchClear);
    expect(catchClear).toBeGreaterThan(-1);
    expect(catchSetUser).toBeGreaterThan(catchClear);

    const noUserClear = logoutBlock.indexOf(
      'await enqueueClearWidgetSnapshot("logout clear (no user)")',
    );
    const noUserSet = logoutBlock.indexOf('set({ user: null })', noUserClear);
    expect(noUserClear).toBeGreaterThan(-1);
    expect(noUserSet).toBeGreaterThan(noUserClear);

    const deleteBlock = src.slice(deleteIdx);
    const deleteClear = deleteBlock.indexOf(
      'await enqueueClearWidgetSnapshot("deleteAccount clear")',
    );
    const deleteSignOut = deleteBlock.indexOf(
      'await supabase.auth.signOut()',
    );
    expect(deleteClear).toBeGreaterThan(-1);
    expect(deleteSignOut).toBeGreaterThan(deleteClear);

    const switchClear = src.indexOf(
      'await enqueueClearWidgetSnapshot("account switch clear")',
    );
    const switchSetUser = src.indexOf('set({ user: userData })', switchClear);
    expect(switchClear).toBeGreaterThan(-1);
    expect(switchSetUser).toBeGreaterThan(switchClear);
  });

  it('useAppStore SecureStore-fail handler clears before signOut', () => {
    const src = fs.readFileSync(
      path.join(root, 'store/useAppStore.ts'),
      'utf8',
    );
    const handlerIdx = src.indexOf(
      'registerSecureStorePersistFailureHandler(() =>',
    );
    expect(handlerIdx).toBeGreaterThan(-1);
    const block = src.slice(handlerIdx, handlerIdx + 1500);
    const clearIdx = block.indexOf('enqueueClearWidgetSnapshot');
    const signOutIdx = block.indexOf('supabase.auth.signOut()');
    expect(clearIdx).toBeGreaterThan(-1);
    expect(signOutIdx).toBeGreaterThan(clearIdx);
    expect(block).toContain(
      'clearWidgetSnapshot after SecureStore persist failure',
    );
  });
});
