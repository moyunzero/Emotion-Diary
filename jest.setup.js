// Jest setup file for React Native testing

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {},
  },
}));

// Mock expo-image（Jest 不转译 expo-modules-core；用 RN Image 即可跑测）
jest.mock("expo-image", () => {
  const { Image } = require("react-native");
  return {
    __esModule: true,
    Image,
  };
});

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => {
  const View = require("react-native/Libraries/Components/View/View");
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock @shopify/react-native-skia
jest.mock("@shopify/react-native-skia", () => ({
  Skia: {
    Image: {
      MakeImageFromEncoded: jest.fn(),
    },
    Paint: jest.fn(),
    Path: jest.fn(),
    Canvas: jest.fn(),
  },
  Canvas: "Canvas",
  Path: "Path",
  SkImage: "SkImage",
  useImage: jest.fn(),
  useFont: jest.fn(),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: "Link",
  Stack: "Stack",
  Tabs: "Tabs",
  usePathname: jest.fn(() => "/"),
}));

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(),
        })),
        order: jest.fn(),
      })),
      insert: jest.fn(() => ({ select: jest.fn() })),
      update: jest.fn(() => ({ eq: jest.fn() })),
      delete: jest.fn(() => ({ eq: jest.fn() })),
    })),
  })),
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock expo-audio
jest.mock("expo-audio", () => ({
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  AudioStatus: {
    isLoaded: true,
    isPlaying: false,
    isBuffering: false,
    duration: 0,
    currentTime: 0,
  },
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seek: jest.fn(),
    dispose: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
  useAudioPlayer: jest.fn(),
  useAudioPlayerStatus: jest.fn(),
  requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getRecordingPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}));

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    success: "success",
    warning: "warning",
    error: "error",
  },
}));

// Mock expo-modules-core (required by expo-haptics and expo-audio)
jest.mock("expo-modules-core", () => ({
  EventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
  NativeModulesProxy: {},
  requireNativeModule: jest.fn(),
  requireOptionalNativeModule: jest.fn(),
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  cacheDirectory: "/mock-cache/",
  documentDirectory: "/mock-documents/",
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  createDownloadResumable: jest.fn(),
}));

// Mock expo-file-system/legacy
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "/mock-cache/",
  documentDirectory: "/mock-documents/",
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  createDownloadResumable: jest.fn(),
}));
