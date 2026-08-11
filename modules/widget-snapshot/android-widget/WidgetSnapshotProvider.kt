package expo.modules.widgetsnapshot

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * Soft Stack A AppWidget (~2×2): weather TOP → growth MIDDLE → brand「心晴」BOTTOM.
 * Reads the same MODE_PRIVATE prefs as [WidgetSnapshotModule] (D-12). Never isolate in a separate process.
 * Sources live under android-widget/; Plan 17-04 merges into the host app.
 */
class WidgetSnapshotProvider : AppWidgetProvider() {

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    for (id in appWidgetIds) {
      appWidgetManager.updateAppWidget(id, buildRemoteViews(context))
    }
  }

  companion object {
    /** Must match WidgetSnapshotModule / shared/widget/sink.ts. */
    const val SNAPSHOT_KEY = "widget_snapshot_v1"
    const val PREFS_SUFFIX = ".widget_snapshot"
    const val SCHEMA_VERSION = 1
    const val DEEP_LINK_URL = "emotiondiary:///"

    private val WEATHER_BUCKETS = setOf("sunny", "cloudy", "rainy", "stormy")
    private val GROWTH_STAGES = setOf("seed", "sprout", "seedling", "bud", "bloom")

    fun requestUpdate(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, WidgetSnapshotProvider::class.java)
      val ids = manager.getAppWidgetIds(component)
      if (ids.isEmpty()) return
      val intent = Intent(context, WidgetSnapshotProvider::class.java).apply {
        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      }
      context.sendBroadcast(intent)
    }

    fun buildRemoteViews(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.widget_snapshot_small)
      bindClick(context, views)
      when (val chrome = loadChrome(context)) {
        is Chrome.Cleared -> bindCleared(context, views)
        is Chrome.Status -> bindStatus(context, views, chrome)
      }
      return views
    }

    private fun prefsName(packageName: String): String = packageName + PREFS_SUFFIX

    private fun loadChrome(context: Context): Chrome {
      val prefs = context.getSharedPreferences(
        prefsName(context.packageName),
        Context.MODE_PRIVATE,
      )
      val raw = prefs.getString(SNAPSHOT_KEY, null)
      if (raw.isNullOrEmpty()) return Chrome.Cleared
      return try {
        mapToChrome(JSONObject(raw))
      } catch (_: Exception) {
        Chrome.Cleared
      }
    }

    private fun mapToChrome(json: JSONObject): Chrome {
      if (json.optInt("schemaVersion", -1) != SCHEMA_VERSION) return Chrome.Cleared
      if (!json.has("updatedAt") || json.isNull("updatedAt")) return Chrome.Cleared
      if (!json.has("entryCountActive") || json.isNull("entryCountActive")) return Chrome.Cleared
      val weather = json.optString("weatherBucket", "")
      val growth = json.optString("growthStage", "")
      if (weather !in WEATHER_BUCKETS || growth !in GROWTH_STAGES) return Chrome.Cleared
      val entryCount = json.optInt("entryCountActive", -1)
      if (entryCount < 0) return Chrome.Cleared
      return Chrome.Status(
        weatherBucket = weather,
        growthStage = growth,
        isEmptyGarden = entryCount == 0,
      )
    }

    private fun bindClick(context: Context, views: RemoteViews) {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(DEEP_LINK_URL)).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        setPackage(context.packageName)
      }
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      val pending = PendingIntent.getActivity(context, 0, intent, flags)
      views.setOnClickPendingIntent(R.id.widget_root, pending)
    }

    private fun bindCleared(context: Context, views: RemoteViews) {
      views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_bg_cleared)
      views.setViewVisibility(R.id.widget_status_stack, View.GONE)
      views.setViewVisibility(R.id.widget_cleared_stack, View.VISIBLE)
      views.setTextViewText(
        R.id.widget_cleared_cta,
        context.getString(R.string.widget_open_cta),
      )
      views.setTextViewText(
        R.id.widget_cleared_hint,
        context.getString(R.string.widget_cleared_hint),
      )
      views.setContentDescription(
        R.id.widget_root,
        context.getString(R.string.widget_open_cta),
      )
    }

    private fun bindStatus(context: Context, views: RemoteViews, chrome: Chrome.Status) {
      val zh = prefersChinese(context)
      val bg = if (chrome.isEmptyGarden) R.drawable.widget_bg_empty else R.drawable.widget_bg_active
      views.setInt(R.id.widget_root, "setBackgroundResource", bg)
      views.setViewVisibility(R.id.widget_status_stack, View.VISIBLE)
      views.setViewVisibility(R.id.widget_cleared_stack, View.GONE)

      views.setImageViewResource(R.id.widget_weather, weatherDrawable(chrome.weatherBucket))
      views.setInt(
        R.id.widget_weather,
        "setImageAlpha",
        if (chrome.isEmptyGarden) 140 else 255,
      )
      views.setContentDescription(
        R.id.widget_weather,
        weatherA11y(context, chrome.weatherBucket, zh),
      )

      val growthTitle = growthTitle(context, chrome.growthStage, zh)
      views.setTextViewText(R.id.widget_growth, growthTitle)
      views.setTextColor(
        R.id.widget_growth,
        context.getColor(
          if (chrome.isEmptyGarden) R.color.widget_text_secondary else R.color.widget_text_primary,
        ),
      )

      views.setTextViewText(
        R.id.widget_subtitle,
        if (chrome.isEmptyGarden) {
          if (zh) context.getString(R.string.widget_subtitle_empty_zh)
          else context.getString(R.string.widget_subtitle_empty_en)
        } else {
          if (zh) context.getString(R.string.widget_subtitle_active_zh)
          else context.getString(R.string.widget_subtitle_active_en)
        },
      )
      views.setTextViewText(R.id.widget_brand, context.getString(R.string.widget_brand))

      val weatherLabel = weatherA11y(context, chrome.weatherBucket, zh)
      val a11y = if (zh) {
        "${context.getString(R.string.widget_brand)}，$weatherLabel，$growthTitle"
      } else {
        "Xinqing, $weatherLabel, $growthTitle"
      }
      views.setContentDescription(R.id.widget_root, a11y)
    }

    private fun weatherDrawable(bucket: String): Int = when (bucket) {
      "sunny" -> R.drawable.ic_weather_sunny
      "cloudy" -> R.drawable.ic_weather_cloudy
      "rainy" -> R.drawable.ic_weather_rainy
      "stormy" -> R.drawable.ic_weather_stormy
      else -> R.drawable.ic_weather_cloudy
    }

    private fun weatherA11y(context: Context, bucket: String, zh: Boolean): String {
      val res = when (bucket) {
        "sunny" -> if (zh) R.string.widget_weather_sunny_zh else R.string.widget_weather_sunny_en
        "cloudy" -> if (zh) R.string.widget_weather_cloudy_zh else R.string.widget_weather_cloudy_en
        "rainy" -> if (zh) R.string.widget_weather_rainy_zh else R.string.widget_weather_rainy_en
        "stormy" -> if (zh) R.string.widget_weather_stormy_zh else R.string.widget_weather_stormy_en
        else -> if (zh) R.string.widget_weather_cloudy_zh else R.string.widget_weather_cloudy_en
      }
      return context.getString(res)
    }

    private fun growthTitle(context: Context, stage: String, zh: Boolean): String {
      val res = when (stage) {
        "seed" -> if (zh) R.string.widget_stage_seed_zh else R.string.widget_stage_seed_en
        "sprout" -> if (zh) R.string.widget_stage_sprout_zh else R.string.widget_stage_sprout_en
        "seedling" -> if (zh) R.string.widget_stage_seedling_zh else R.string.widget_stage_seedling_en
        "bud" -> if (zh) R.string.widget_stage_bud_zh else R.string.widget_stage_bud_en
        "bloom" -> if (zh) R.string.widget_stage_bloom_zh else R.string.widget_stage_bloom_en
        else -> if (zh) R.string.widget_stage_seed_zh else R.string.widget_stage_seed_en
      }
      return context.getString(res)
    }

    private fun prefersChinese(context: Context): Boolean {
      val locale = context.resources.configuration.locales[0]
      return locale.language.startsWith("zh")
    }
  }

  private sealed class Chrome {
    data object Cleared : Chrome()
    data class Status(
      val weatherBucket: String,
      val growthStage: String,
      val isEmptyGarden: Boolean,
    ) : Chrome()
  }
}
