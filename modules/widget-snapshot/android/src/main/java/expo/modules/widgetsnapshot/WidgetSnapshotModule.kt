package expo.modules.widgetsnapshot

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * QUAL-03: one JSON string in MODE_PRIVATE SharedPreferences.
 * Key / prefs file must match WidgetSnapshotProvider and shared/widget/sink.ts.
 * Never use world-readable / external storage (T-16-07).
 * After write/clear, refresh AppWidget Soft Stack so logout cannot leave stale chrome (D-10).
 */
class WidgetSnapshotModule : Module() {
  companion object {
    /** Shared with WidgetSnapshotProvider.SNAPSHOT_KEY */
    const val SNAPSHOT_KEY = "widget_snapshot_v1"
    /** Shared with WidgetSnapshotProvider.PREFS_SUFFIX */
    const val PREFS_SUFFIX = ".widget_snapshot"
    private const val PROVIDER_CLASS =
      "expo.modules.widgetsnapshot.WidgetSnapshotProvider"
  }

  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  private fun getPreferences(): SharedPreferences {
    return context.getSharedPreferences(
      context.packageName + PREFS_SUFFIX,
      Context.MODE_PRIVATE,
    )
  }

  /** Broadcast ACTION_APPWIDGET_UPDATE so WidgetSnapshotProvider rebuilds RemoteViews. */
  private fun notifyAppWidgets() {
    runCatching {
      val ctx = context
      val manager = AppWidgetManager.getInstance(ctx)
      val provider = ComponentName(ctx, PROVIDER_CLASS)
      val ids = manager.getAppWidgetIds(provider)
      if (ids.isEmpty()) return
      ctx.sendBroadcast(
        Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
          component = provider
          putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        },
      )
    }
  }

  override fun definition() = ModuleDefinition {
    Name("WidgetSnapshot")

    AsyncFunction("writeSnapshot") { json: String ->
      val committed = getPreferences().edit().putString(SNAPSHOT_KEY, json).commit()
      if (!committed) {
        throw Exception("widget_snapshot write commit failed")
      }
      // D-10: AppWidgetManager.ACTION_APPWIDGET_UPDATE → WidgetSnapshotProvider.onUpdate
      notifyAppWidgets()
    }

    AsyncFunction("clearSnapshot") {
      val committed = getPreferences().edit().remove(SNAPSHOT_KEY).commit()
      if (!committed) {
        throw Exception("widget_snapshot clear commit failed")
      }
      // D-10: AppWidgetManager.ACTION_APPWIDGET_UPDATE → WidgetSnapshotProvider.onUpdate
      notifyAppWidgets()
    }

    AsyncFunction("readSnapshot") {
      getPreferences().getString(SNAPSHOT_KEY, null)
    }
  }
}
