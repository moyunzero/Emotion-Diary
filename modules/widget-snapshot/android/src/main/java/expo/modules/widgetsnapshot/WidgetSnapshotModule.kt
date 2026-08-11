package expo.modules.widgetsnapshot

import android.content.Context
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * QUAL-03: one JSON string in MODE_PRIVATE SharedPreferences.
 * Key must match shared/widget/sink.ts WIDGET_SNAPSHOT_KEY.
 * Never use world-readable / external storage (T-16-07).
 */
class WidgetSnapshotModule : Module() {
  companion object {
    private const val SNAPSHOT_KEY = "widget_snapshot_v1"
  }

  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  private fun getPreferences(): SharedPreferences {
    return context.getSharedPreferences(
      context.packageName + ".widget_snapshot",
      Context.MODE_PRIVATE,
    )
  }

  override fun definition() = ModuleDefinition {
    Name("WidgetSnapshot")

    AsyncFunction("writeSnapshot") { json: String ->
      getPreferences().edit().putString(SNAPSHOT_KEY, json).commit()
    }

    AsyncFunction("clearSnapshot") {
      getPreferences().edit().remove(SNAPSHOT_KEY).commit()
    }

    AsyncFunction("readSnapshot") {
      getPreferences().getString(SNAPSHOT_KEY, null)
    }
  }
}
