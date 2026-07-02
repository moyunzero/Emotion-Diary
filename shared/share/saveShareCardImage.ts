import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { Alert, Linking, Platform } from "react-native";
import { logger } from "../../utils/logger";

export type SaveShareCardCopy = {
  permissionTitle: string;
  permissionMessage: string;
  cancelLabel: string;
  openSettingsLabel: string;
  successTitle: string;
  successMessage: string;
};

function triggerWebDownload(dataUri: string): void {
  const timestamp = Date.now();
  const filename = `xinqingmo-share-${timestamp}.png`;
  const anchor = document.createElement("a");
  anchor.href = dataUri;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Saves a captured share card PNG. Native: photo library; Web: anchor download.
 * Does not invoke Share.share (D-16).
 */
export async function saveShareCardImage(
  uri: string,
  copy: SaveShareCardCopy,
): Promise<void> {
  if (Platform.OS === "web") {
    triggerWebDownload(uri);
    return;
  }

  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(copy.permissionTitle, copy.permissionMessage, [
      { text: copy.cancelLabel, style: "cancel" },
      {
        text: copy.openSettingsLabel,
        onPress: () => {
          Linking.openSettings().catch((error) => {
            logger.error("saveShareCardImage", "Open settings failed", error);
          });
        },
      },
    ]);
    throw new Error("Media library permission denied");
  }

  await MediaLibrary.saveToLibraryAsync(uri);
  if (Platform.OS === "ios") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  Alert.alert(copy.successTitle, copy.successMessage);
}
