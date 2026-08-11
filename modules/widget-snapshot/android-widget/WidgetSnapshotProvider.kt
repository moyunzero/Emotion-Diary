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
        weatherA11y(context, chrome.weatherBucket),
      )

      val growthTitle = growthTitle(context, chrome.growthStage)
      views.setTextViewText(R.id.widget_growth, growthTitle)
      views.setTextColor(
        R.id.widget_growth,
        context.getColor(
          if (chrome.isEmptyGarden) R.color.widget_text_secondary else R.color.widget_text_primary,
        ),
      )

      views.setTextViewText(
        R.id.widget_subtitle,
        context.getString(
          if (chrome.isEmptyGarden) R.string.widget_subtitle_empty
          else R.string.widget_subtitle_active,
        ),
      )
      views.setTextViewText(R.id.widget_brand, context.getString(R.string.widget_brand))

      val weatherLabel = weatherA11y(context, chrome.weatherBucket)
      val brand = context.getString(R.string.widget_brand)
      views.setContentDescription(
        R.id.widget_root,
        "$brand, $weatherLabel, $growthTitle",
      )
    }

    private fun weatherDrawable(bucket: String): Int = when (bucket) {
      "sunny" -> R.drawable.ic_weather_sunny
      "cloudy" -> R.drawable.ic_weather_cloudy
      "rainy" -> R.drawable.ic_weather_rainy
      "stormy" -> R.drawable.ic_weather_stormy
      else -> R.drawable.ic_weather_cloudy
    }

    private fun weatherA11y(context: Context, bucket: String): String {
      val res = when (bucket) {
        "sunny" -> R.string.widget_weather_sunny
        "cloudy" -> R.string.widget_weather_cloudy
        "rainy" -> R.string.widget_weather_rainy
        "stormy" -> R.string.widget_weather_stormy
        else -> R.string.widget_weather_cloudy
      }
      return context.getString(res)
    }

    private fun growthTitle(context: Context, stage: String): String {
      val res = when (stage) {
        "seed" -> R.string.widget_stage_seed
        "sprout" -> R.string.widget_stage_sprout
        "seedling" -> R.string.widget_stage_seedling
        "bud" -> R.string.widget_stage_bud
        "bloom" -> R.string.widget_stage_bloom
        else -> R.string.widget_stage_seed
      }
      return context.getString(res)
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
