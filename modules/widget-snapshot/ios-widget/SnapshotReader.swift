import Foundation

/// Reads Phase 16 whitelist snapshot from App Group UserDefaults only.
/// Constants must match `shared/widget/sink.ts` and `WidgetSnapshotModule.swift`.
enum SnapshotReader {
  static let appGroupId = "group.com.moyunzero.emotiondiary"
  static let snapshotKey = "widget_snapshot_v1"
  static let schemaVersion = 1

  private static let weatherBuckets: Set<String> = [
    "sunny", "cloudy", "rainy", "stormy",
  ]
  private static let growthStages: Set<String> = [
    "seed", "sprout", "seedling", "bud", "bloom",
  ]

  /// Soft Stack chrome model for WidgetKit (mirrors `mapSnapshotToChrome`).
  enum Chrome {
    case cleared
    case status(
      weatherBucket: String,
      growthStage: String,
      isEmptyGarden: Bool
    )
  }

  /// Missing / empty / invalid JSON → cleared (D-10).
  /// Valid whitelist including empty garden → status (D-09).
  static func loadChrome() -> Chrome {
    guard let defaults = UserDefaults(suiteName: appGroupId) else {
      return .cleared
    }
    guard let raw = defaults.string(forKey: snapshotKey), !raw.isEmpty else {
      return .cleared
    }
    guard let data = raw.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      return .cleared
    }
    return mapToChrome(json)
  }

  static func mapToChrome(_ candidate: [String: Any]) -> Chrome {
    guard let version = numericInt(candidate["schemaVersion"]), version == schemaVersion else {
      return .cleared
    }
    guard numericInt(candidate["updatedAt"]) != nil else {
      return .cleared
    }
    guard let entryCount = numericInt(candidate["entryCountActive"]) else {
      return .cleared
    }
    if entryCount < 0 {
      return .cleared
    }
    guard let weather = candidate["weatherBucket"] as? String,
          weatherBuckets.contains(weather)
    else {
      return .cleared
    }
    guard let growth = candidate["growthStage"] as? String,
          growthStages.contains(growth)
    else {
      return .cleared
    }
    return .status(
      weatherBucket: weather,
      growthStage: growth,
      isEmptyGarden: entryCount == 0
    )
  }

  /// Accept only finite, exact integers in Int range. Reject Bool NSNumber, fractions, overflow.
  static func numericInt(_ value: Any?) -> Int? {
    if value == nil { return nil }
    if value is Bool { return nil }

    if let n = value as? Int {
      return n
    }

    if let n = value as? Double {
      return exactInt(from: n)
    }

    if let n = value as? Float {
      return exactInt(from: Double(n))
    }

    if let n = value as? NSNumber {
      // Bool bridges to NSNumber — reject CFBoolean.
      if CFGetTypeID(n as CFTypeRef) == CFBooleanGetTypeID() {
        return nil
      }
      return exactInt(from: n.doubleValue)
    }

    return nil
  }

  private static func exactInt(from double: Double) -> Int? {
    guard double.isFinite else { return nil }
    guard double.rounded(.towardZero) == double else { return nil }
    guard double >= Double(Int.min), double <= Double(Int.max) else { return nil }
    return Int(double)
  }
}
