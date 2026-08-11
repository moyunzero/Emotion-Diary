import ExpoModulesCore

/// QUAL-03: single JSON string under App Group UserDefaults.
/// Suite + key must match shared/widget/sink.ts (WIDGET_SNAPSHOT_*).
/// Privacy Manifest reason for UserDefaults: 1C8F.1 (see PrivacyInfo.xcprivacy / README).
public class WidgetSnapshotModule: Module {
  private static let appGroupId = "group.com.moyunzero.emotiondiary"
  private static let snapshotKey = "widget_snapshot_v1"

  private var suiteDefaults: UserDefaults? {
    UserDefaults(suiteName: Self.appGroupId)
  }

  public func definition() -> ModuleDefinition {
    Name("WidgetSnapshot")

    AsyncFunction("writeSnapshot") { (json: String) in
      guard let defaults = self.suiteDefaults else {
        throw Exception(
          name: "ERR_APP_GROUP",
          description: "App Group UserDefaults unavailable for \(Self.appGroupId)"
        )
      }
      defaults.set(json, forKey: Self.snapshotKey)
    }

    AsyncFunction("clearSnapshot") { () in
      guard let defaults = self.suiteDefaults else {
        throw Exception(
          name: "ERR_APP_GROUP",
          description: "App Group UserDefaults unavailable for \(Self.appGroupId)"
        )
      }
      defaults.removeObject(forKey: Self.snapshotKey)
    }

    AsyncFunction("readSnapshot") { () -> String? in
      guard let defaults = self.suiteDefaults else {
        return nil
      }
      return defaults.string(forKey: Self.snapshotKey)
    }
  }
}
