import SwiftUI
import WidgetKit

/// Soft Stack A: weather TOP → growth MIDDLE → brand「心晴」BOTTOM (17-UI-SPEC).
/// systemSmall only; single widgetURL Dashboard deep link (D-06 / D-08).

private let widgetDeepLinkURL = URL(string: "emotiondiary:///")!

struct SoftStackEntry: TimelineEntry {
  let date: Date
  let chrome: SnapshotReader.Chrome
}

struct SoftStackProvider: TimelineProvider {
  func placeholder(in context: Context) -> SoftStackEntry {
    SoftStackEntry(
      date: Date(),
      chrome: .status(weatherBucket: "cloudy", growthStage: "seed", isEmptyGarden: true)
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (SoftStackEntry) -> Void) {
    completion(SoftStackEntry(date: Date(), chrome: SnapshotReader.loadChrome()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SoftStackEntry>) -> Void) {
    let entry = SoftStackEntry(date: Date(), chrome: SnapshotReader.loadChrome())
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

struct EmotionDiaryWidget: Widget {
  let kind = "EmotionDiaryWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: SoftStackProvider()) { entry in
      SoftStackWidgetView(entry: entry)
    }
    .configurationDisplayName(SoftStackCopy.widgetDisplayName)
    .description(SoftStackCopy.widgetDescription)
    .supportedFamilies([.systemSmall])
  }
}

// MARK: - View

struct SoftStackWidgetView: View {
  let entry: SoftStackEntry

  private var prefersChinese: Bool {
    Locale.preferredLanguages.first?.hasPrefix("zh") == true
  }

  var body: some View {
    Group {
      switch entry.chrome {
      case .cleared:
        clearedChrome
      case .status(let weather, let growth, let isEmpty):
        statusChrome(weather: weather, growth: growth, isEmpty: isEmpty)
      }
    }
    .padding(16)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    // Background must use containerBackground (iOS 17+) so it fills under
    // the system chrome; drawing only inside ZStack leaves a white frame.
    .modifier(SoftStackContainerBackground(chrome: entry.chrome))
    .widgetURL(widgetDeepLinkURL)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(accessibilityLabel)
  }

  private var clearedChrome: some View {
    VStack(spacing: 4) {
      Spacer(minLength: 0)
      Text(SoftStackCopy.openAppCTA(prefersChinese: prefersChinese))
        .font(.system(size: 18, weight: .bold, design: .rounded))
        .foregroundStyle(SoftStackColors.brand)
        .multilineTextAlignment(.center)
      Text(SoftStackCopy.clearedHint(prefersChinese: prefersChinese))
        .font(.system(size: 12, weight: .regular))
        .foregroundStyle(SoftStackColors.textSecondary)
        .multilineTextAlignment(.center)
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }

  private func statusChrome(weather: String, growth: String, isEmpty: Bool) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      Image(systemName: SoftStackIcons.sfSymbol(forWeather: weather))
        .font(.system(size: 28, weight: .semibold))
        .foregroundStyle(
          isEmpty
            ? SoftStackColors.weatherEmpty
            : SoftStackColors.weatherActive
        )
        .frame(width: 32, height: 32, alignment: .leading)
        .accessibilityHidden(true)

      Spacer(minLength: 8)

      VStack(alignment: .leading, spacing: 4) {
        Text(SoftStackCopy.growthTitle(growth, prefersChinese: prefersChinese))
          .font(.system(size: 22, weight: .bold, design: .rounded))
          .foregroundStyle(
            isEmpty ? SoftStackColors.textSecondary : SoftStackColors.textPrimary
          )
          .lineLimit(1)
          .minimumScaleFactor(0.85)

        Text(SoftStackCopy.quietSubtitle(isEmpty: isEmpty, prefersChinese: prefersChinese))
          .font(.system(size: 12, weight: .regular))
          .foregroundStyle(SoftStackColors.textSecondary)
          .lineLimit(1)
      }
      .frame(maxWidth: .infinity, alignment: .leading)

      Spacer(minLength: 8)

      Text(SoftStackCopy.brand(prefersChinese: prefersChinese))
        .font(.system(size: 12, weight: .bold, design: .rounded))
        .foregroundStyle(SoftStackColors.brand)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private var accessibilityLabel: String {
    switch entry.chrome {
    case .cleared:
      return SoftStackCopy.openAppCTA(prefersChinese: prefersChinese)
    case .status(let weather, let growth, _):
      let brand = SoftStackCopy.brand(prefersChinese: prefersChinese)
      let w = SoftStackCopy.weatherA11y(weather, prefersChinese: prefersChinese)
      let g = SoftStackCopy.growthTitle(growth, prefersChinese: prefersChinese)
      if prefersChinese {
        return "\(brand)，\(w)，\(g)"
      }
      return "\(brand), \(w), \(g)"
    }
  }
}

// MARK: - Background

struct SoftStackBackground: View {
  let chrome: SnapshotReader.Chrome

  var body: some View {
    switch chrome {
    case .cleared:
      LinearGradient(
        colors: [
          SoftStackColors.clearedTop,
          SoftStackColors.clearedBottom,
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )
    case .status(_, _, let isEmpty) where isEmpty:
      LinearGradient(
        colors: [
          SoftStackColors.emptyTop,
          SoftStackColors.emptyBottom,
        ],
        startPoint: .top,
        endPoint: .bottom
      )
    case .status:
      LinearGradient(
        colors: [
          SoftStackColors.activeTop,
          SoftStackColors.activeMid,
          SoftStackColors.activeBottom,
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )
    }
  }
}

/// Applies edge-to-edge wash; falls back for extension targets below iOS 17.
private struct SoftStackContainerBackground: ViewModifier {
  let chrome: SnapshotReader.Chrome

  func body(content: Content) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      content.containerBackground(for: .widget) {
        SoftStackBackground(chrome: chrome)
      }
    } else {
      content.background {
        SoftStackBackground(chrome: chrome)
      }
    }
  }
}

// MARK: - Tokens (17-UI-SPEC)

private enum SoftStackColors {
  static let activeTop = Color(red: 1.0, green: 0.945, blue: 0.949) // #FFF1F2
  static let activeMid = Color(red: 0.996, green: 0.804, blue: 0.827) // #FECDD3
  static let activeBottom = Color(red: 0.992, green: 0.643, blue: 0.686) // #FDA4AF
  static let emptyTop = Color(red: 0.976, green: 0.980, blue: 0.984) // #F9FAFB
  static let emptyBottom = Color(red: 0.953, green: 0.957, blue: 0.965) // #F3F4F6
  static let clearedTop = Color.white
  static let clearedBottom = Color(red: 0.996, green: 0.804, blue: 0.827).opacity(0.35)
  static let brand = Color(red: 0.882, green: 0.114, blue: 0.282) // #E11D48
  static let weatherActive = Color(red: 0.984, green: 0.443, blue: 0.522) // #FB7185
  static let weatherEmpty = Color(red: 0.420, green: 0.447, blue: 0.502).opacity(0.55)
  static let textPrimary = Color(red: 0.122, green: 0.161, blue: 0.216) // #1F2937
  static let textSecondary = Color(red: 0.420, green: 0.447, blue: 0.502) // #6B7280
}

private enum SoftStackIcons {
  static func sfSymbol(forWeather bucket: String) -> String {
    switch bucket {
    case "sunny": return "sun.max.fill"
    case "cloudy": return "cloud.fill"
    case "rainy": return "cloud.rain.fill"
    case "stormy": return "cloud.bolt.fill"
    default: return "cloud.fill"
    }
  }
}

private enum SoftStackCopy {
  /// Soft Stack bottom brand — zh「心晴」/ en「Xinqing」.
  static func brand(prefersChinese: Bool) -> String {
    prefersChinese ? "心晴" : "Xinqing"
  }

  /// Gallery title/description — extension Localizable.strings (zh-Hans / en).
  static var widgetDisplayName: String {
    NSLocalizedString(
      "widget_display_name",
      tableName: "Localizable",
      bundle: .main,
      value: "心晴",
      comment: "Soft Stack widget gallery display name"
    )
  }

  static var widgetDescription: String {
    NSLocalizedString(
      "widget_description",
      tableName: "Localizable",
      bundle: .main,
      value: "查看花园天气与成长",
      comment: "Soft Stack widget gallery description"
    )
  }

  static func openAppCTA(prefersChinese: Bool) -> String {
    prefersChinese ? "打开心晴" : "Open Xinqing"
  }

  static func clearedHint(prefersChinese: Bool) -> String {
    prefersChinese ? "登录后同步花园天气" : "Sign in to sync garden weather"
  }

  static func quietSubtitle(isEmpty: Bool, prefersChinese: Bool) -> String {
    if isEmpty {
      return prefersChinese ? "安静的花园" : "Quiet garden"
    }
    return prefersChinese ? "心灵花园" : "Garden"
  }

  static func growthTitle(_ stage: String, prefersChinese: Bool) -> String {
    let titles: [String: (zh: String, en: String)] = [
      "seed": ("种子", "Seed"),
      "sprout": ("发芽", "Sprout"),
      "seedling": ("幼苗", "Seedling"),
      "bud": ("花苞", "Bud"),
      "bloom": ("开花", "Bloom"),
    ]
    guard let pair = titles[stage] else { return prefersChinese ? "种子" : "Seed" }
    return prefersChinese ? pair.zh : pair.en
  }

  static func weatherA11y(_ bucket: String, prefersChinese: Bool) -> String {
    let labels: [String: (zh: String, en: String)] = [
      "sunny": ("晴", "Sunny"),
      "cloudy": ("多云", "Cloudy"),
      "rainy": ("雨", "Rainy"),
      "stormy": ("雷雨", "Stormy"),
    ]
    guard let pair = labels[bucket] else { return prefersChinese ? "多云" : "Cloudy" }
    return prefersChinese ? pair.zh : pair.en
  }
}
