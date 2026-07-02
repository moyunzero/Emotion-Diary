/**
 * Ritual share card preview (resolve / burn). User-initiated only — no auto navigation (D-05).
 */

import { AppScreenShell } from "@/components/AppScreenShell";
import { INSIGHTS_COLORS } from "@/components/Insights/constants";
import { ShareCardBurnContent } from "@/components/share/ShareCardBurnContent";
import { ShareCardResolveContent } from "@/components/share/ShareCardResolveContent";
import { ShareCardShell } from "@/components/share/ShareCardShell";
import { useResponsiveStyles } from "@/hooks/useResponsiveStyles";
import {
  buildBurnShareCardModel,
  buildResolveShareCardModel,
  type ShareCardVariant,
} from "@/shared/share/buildShareCardModel";
import { captureViewToPng } from "@/shared/share/captureViewToPng";
import {
  ensurePrivacyAck,
  persistPrivacyAck,
} from "@/shared/share/privacyAck";
import { saveShareCardImage } from "@/shared/share/saveShareCardImage";
import { createStackScreenHeaderStyle } from "@/styles/stackScreenHeader";
import { useAppStore } from "@/store/useAppStore";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type View as RNView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RITUAL_VARIANTS = ["resolve", "burn"] as const;
type RitualVariant = (typeof RITUAL_VARIANTS)[number];

function parseRitualVariant(raw: string | string[] | undefined): RitualVariant | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "resolve" || value === "burn") {
    return value;
  }
  return null;
}

export const ShareCardPreviewScreen: React.FC = () => {
  const router = useRouter();
  const { variant: variantParam } = useLocalSearchParams<{ variant?: string }>();
  const variant = parseRitualVariant(variantParam);

  const { t } = useTranslation("share");
  const { t: tCommon } = useTranslation("common");
  const { t: tSystem } = useTranslation("system");
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const responsive = useResponsiveStyles();

  const entries = useAppStore((s) => s.entries);
  const weatherCondition = useAppStore((s) => s.weather.condition);
  const effectiveLocale = useAppStore((s) => s.effectiveLocale);

  const [snippetEnabled, setSnippetEnabled] = useState(false);
  const [snippet, setSnippet] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const captureRootRef = useRef<RNView>(null);

  useEffect(() => {
    if (variantParam !== undefined && variant === null) {
      router.back();
    }
  }, [variant, variantParam, router]);

  const footerDateMs = useMemo(() => Date.now(), []);

  const model = useMemo(() => {
    if (!variant) {
      return buildResolveShareCardModel({
        entries,
        weatherCondition,
        effectiveLocale,
        footerDateMs,
      });
    }

    const snippetValue = snippetEnabled ? snippet : undefined;

    if (variant === "burn") {
      return buildBurnShareCardModel({
        effectiveLocale,
        footerDateMs,
        userSnippet: snippetValue,
      });
    }

    return buildResolveShareCardModel({
      entries,
      weatherCondition,
      effectiveLocale,
      footerDateMs,
      userSnippet: snippetValue,
    });
  }, [
    variant,
    entries,
    weatherCondition,
    effectiveLocale,
    footerDateMs,
    snippetEnabled,
    snippet,
  ]);

  const shellVariant: ShareCardVariant = variant ?? "resolve";
  const screenTitle =
    variant === "burn" ? t("preview.titleBurn") : t("preview.titleResolve");

  const saveLabel =
    Platform.OS === "web" ? t("actions.download") : t("actions.saveToAlbum");

  const onPressSave = useCallback(async () => {
    if (isBusy || !variant) return;

    await ensurePrivacyAck(
      async (setAck) => {
        setIsBusy(true);
        try {
          if (setAck) {
            await persistPrivacyAck();
          }
          const target = captureRootRef.current;
          if (!target) {
            throw new Error(t("alerts.saveFail.message"));
          }
          const uri = await captureViewToPng(target);
          await saveShareCardImage(uri, {
            permissionTitle: t("alerts.privacy.title"),
            permissionMessage: t("alerts.privacy.message"),
            cancelLabel: tCommon("actions.cancel"),
            openSettingsLabel: tSystem("audio.permission.openSettings"),
            successTitle:
              Platform.OS === "web"
                ? t("alerts.downloadSuccess.title")
                : t("alerts.downloadSuccess.title"),
            successMessage:
              Platform.OS === "web"
                ? t("alerts.downloadSuccess.message")
                : t("alerts.downloadSuccess.message"),
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (msg !== "Media library permission denied") {
            Alert.alert(t("alerts.saveFail.title"), msg);
          }
        } finally {
          setIsBusy(false);
        }
      },
      {
        title: t("alerts.privacy.title"),
        message: t("alerts.privacy.message"),
        continueLabel: t("actions.continue"),
      },
    );
  }, [isBusy, variant, t, tCommon, tSystem]);

  if (!variant) {
    return null;
  }

  return (
    <AppScreenShell
      edges={["top", "left", "right"]}
      title={screenTitle}
      onBack={() => router.back()}
      titleColor={INSIGHTS_COLORS.text}
      titleFontFamily="Lato_700Bold"
      headerStyle={createStackScreenHeaderStyle(width, height)}
      footer={
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              paddingHorizontal: responsive.padding.horizontal,
            },
          ]}
        >
          <Pressable
            testID="share-card-save-button"
            style={[styles.saveBtn, isBusy && styles.saveBtnDisabled]}
            onPress={() => {
              void onPressSave();
            }}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{saveLabel}</Text>
            )}
          </Pressable>
        </View>
      }
    >
      <View style={styles.root} testID="share-card-preview-root">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: responsive.padding.horizontal },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optInRow}>
            <Text style={styles.optInLabel}>{t("optIn.label")}</Text>
            <Switch
              testID="share-card-snippet-toggle"
              value={snippetEnabled}
              onValueChange={setSnippetEnabled}
              trackColor={{
                false: INSIGHTS_COLORS.textSecondary + "40",
                true: INSIGHTS_COLORS.accent + "80",
              }}
              thumbColor={snippetEnabled ? INSIGHTS_COLORS.accent : "#f4f3f4"}
            />
          </View>

          {snippetEnabled ? (
            <>
              <TextInput
                testID="share-card-snippet-input"
                style={styles.snippetInput}
                value={snippet}
                onChangeText={setSnippet}
                placeholder={t("optIn.placeholder")}
                placeholderTextColor={INSIGHTS_COLORS.textSecondary}
                maxLength={80}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.snippetHint}>{t("optIn.hint")}</Text>
            </>
          ) : (
            <Text style={styles.snippetOff}>{t("optIn.off")}</Text>
          )}

          <View ref={captureRootRef} collapsable={false} style={styles.captureWrap}>
            <ShareCardShell variant={shellVariant} model={model}>
              {variant === "burn" ? (
                <ShareCardBurnContent model={model} />
              ) : (
                <ShareCardResolveContent model={model} />
              )}
            </ShareCardShell>
          </View>
        </ScrollView>
      </View>
    </AppScreenShell>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  optInRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  optInLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: INSIGHTS_COLORS.text,
  },
  snippetInput: {
    borderWidth: 1,
    borderColor: INSIGHTS_COLORS.primary + "40",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: INSIGHTS_COLORS.text,
    minHeight: 72,
    textAlignVertical: "top",
  },
  snippetHint: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Lato_400Regular",
    color: INSIGHTS_COLORS.textSecondary,
  },
  snippetOff: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    color: INSIGHTS_COLORS.textSecondary,
  },
  captureWrap: {
    alignItems: "center",
    marginTop: 8,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: INSIGHTS_COLORS.primary + "30",
    paddingTop: 12,
  },
  saveBtn: {
    backgroundColor: INSIGHTS_COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontFamily: "Lato_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
