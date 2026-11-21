const {
  patchAppDelegate,
  WINDOW_BLOCK,
  MARKER,
} = require('../../plugins/with-scene-lifecycle');

const STOCK_APP_DELEGATE = `import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

${WINDOW_BLOCK}
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

describe('with-scene-lifecycle patchAppDelegate', () => {
  it('removes the AppDelegate window block and appends SceneDelegate', () => {
    const patched = patchAppDelegate(STOCK_APP_DELEGATE);

    expect(patched).toContain(MARKER);
    expect(patched).toContain('class SceneDelegate: UIResponder, UIWindowSceneDelegate');
    expect(patched).toContain('factory.startReactNative(');
    expect(patched).toContain('The window is made by SceneDelegate');
    expect(patched).not.toContain('UIWindow(frame: UIScreen.main.bounds)');
    expect(patched).toContain('UIWindow(windowScene: windowScene)');
  });

  it('is idempotent when the marker is already present', () => {
    const once = patchAppDelegate(STOCK_APP_DELEGATE);
    const twice = patchAppDelegate(once);
    expect(twice).toBe(once);
  });

  it('throws when the stock window block is missing', () => {
    expect(() => patchAppDelegate('public class AppDelegate {}\n')).toThrow(
      /window block/,
    );
  });

  it('forwards cold-start and warm URL opens through AppDelegate', () => {
    const patched = patchAppDelegate(STOCK_APP_DELEGATE);
    expect(patched).toContain('connectionOptions.urlContexts.first?.url');
    expect(patched).toContain('appDelegate.application(UIApplication.shared, open: url');
    expect(patched).toContain('func scene(_ scene: UIScene, openURLContexts');
  });
});
