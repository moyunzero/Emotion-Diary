import ExpoModulesCore
import WidgetKit

/// QUAL-03: single JSON string under App Group UserDefaults.
/// Suite + key must match shared/widget/sink.ts (WIDGET_SNAPSHOT_*).
/// Privacy Manifest reason for UserDefaults: 1C8F.1 (see PrivacyInfo.xcprivacy / README).
/// After write/clear, reload WidgetKit timelines so Soft Stack chrome stays in sync (D-10 / D-16).
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
      // Flush so the widget extension process can read immediately (sim + App Group).
      defaults.synchronize()
      WidgetCenter.shared.reloadAllTimelines()
    }

    AsyncFunction("clearSnapshot") { () in
      guard let defaults = self.suiteDefaults else {
        throw Exception(
          name: "ERR_APP_GROUP",
          description: "App Group UserDefaults unavailable for \(Self.appGroupId)"
        )
      }
      defaults.removeObject(forKey: Self.snapshotKey)
      defaults.synchronize()
      WidgetCenter.shared.reloadAllTimelines()
    }

    AsyncFunction("readSnapshot") { () -> String? in
      guard let defaults = self.suiteDefaults else {
        return nil
      }
      return defaults.string(forKey: Self.snapshotKey)
    }
  }
}
