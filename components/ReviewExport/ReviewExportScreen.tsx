/**
 * Mood review export: preset selection, capturable canvas, optional AI closing line, save PNG to Photos.
 * Privacy and permissions confirmed via Alert and AsyncStorage on first save.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Linking,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { useResponsiveStyles } from '../../hooks/useResponsiveStyles';
import { getEffectiveFirstEntryDateForCompanion } from '../../services/companionDaysService';
import { formatLocaleDate } from '../../shared/formatting';
import { type ReviewExportPreset } from '../../shared/time-range';
import { forceCancelRecording } from '../../shared/audio/recordingCoordinator';
import { useAppStore } from '../../store/useAppStore';
import {
  generateReviewExportClosingLine,
  getDefaultReviewExportClosingLine,
  isGroqConfigured,
} from '../../utils/aiService';
import { computeReviewExportDerivedState } from '../../utils/reviewExportDerived';
import { AppScreenShell } from '../AppScreenShell';
import { INSIGHTS_COLORS } from '../Insights/constants';
import { createStackScreenHeaderStyle } from '../../styles/stackScreenHeader';
import { ReviewExportCanvas, type ReviewExportAiStatus } from './ReviewExportCanvas';
import { buildReviewExportResponsiveLayout } from './reviewExportResponsiveLayout';
import {
  REVIEW_EXPORT_CAPTURE_MAX_WIDTH,
  REVIEW_EXPORT_CAPTURE_QUALITY,
} from '../../constants/performance';

const PRIVACY_ACK_KEY = 'review_export_privacy_ack_v1';

const PRESET_VALUES: ReviewExportPreset[] = [
  'this_week',
  'last_week',
  'this_month',
  'last_month',
];

function parseInitialPreset(raw: string | undefined): ReviewExportPreset {
  if (raw && PRESET_VALUES.includes(raw as ReviewExportPreset)) {
    return raw as ReviewExportPreset;
  }
  return 'this_month';
}

export const ReviewExportScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation('review');
  const { t: tCommon } = useTranslation('common');
  const { t: tSystem } = useTranslation('system');
  const { preset: presetParam } = useLocalSearchParams<{ preset?: string }>();
  const effectiveLocale = useAppStore((s) => s.effectiveLocale);

  useFocusEffect(
    useCallback(() => {
      return () => {
        useAppStore.getState().stopAudio();
        void forceCancelRecording();
      };
    }, []),
  );

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const responsive = useResponsiveStyles();
  const responsiveLayout = useMemo(
    () => buildReviewExportResponsiveLayout(responsive),
    [responsive],
  );
  const entries = useAppStore((s) => s.entries);
  const user = useAppStore((s) => s.user);
  const userFirstEntryDate = useAppStore((s) => s.user?.firstEntryDate);
  const firstEntryDate = useMemo(
    () => getEffectiveFirstEntryDateForCompanion(userFirstEntryDate, entries),
    [userFirstEntryDate, entries],
  );

  const PRESETS = useMemo(
    () => PRESET_VALUES.map((key) => ({ key, label: t(`presets.${key}`) })),
    [t],
  );

  const [preset, setPreset] = useState<ReviewExportPreset>(() =>
    parseInitialPreset(presetParam),
  );
  const [now] = useState(() => new Date());
  const [isBusy, setIsBusy] = useState(false);

  const derived = useMemo(
    () =>
      computeReviewExportDerivedState(
        entries,
        firstEntryDate,
        preset,
        now,
        effectiveLocale,
      ),
    [entries, firstEntryDate, preset, now, effectiveLocale],
  );
  const summary = derived.closingSummary;
  const exportRangeA11yLabel = useMemo(
    () =>
      t('a11y.exportRange', {
        start: formatLocaleDate(summary.periodStartMs, effectiveLocale),
        end: formatLocaleDate(summary.periodEndMs, effectiveLocale),
      }),
    [summary.periodEndMs, summary.periodStartMs, effectiveLocale, t],
  );

  const [closingLine, setClosingLine] = useState(() =>
    getDefaultReviewExportClosingLine(summary, effectiveLocale),
  );

  const [aiStatus, setAiStatus] = useState<ReviewExportAiStatus>('idle');
  const closingRequestIdRef = useRef(0);

  const captureRootRef = useRef<View>(null);

  useEffect(() => {
    const defaultLine = getDefaultReviewExportClosingLine(summary, effectiveLocale);
    const id = ++closingRequestIdRef.current;

    if (!isGroqConfigured()) {
      setClosingLine(defaultLine);
      setAiStatus('fallback');
      return;
    }

    setClosingLine(defaultLine);
    setAiStatus('loading');

    generateReviewExportClosingLine(summary, user?.id, user?.name, effectiveLocale)
      .then((text) => {
        if (id !== closingRequestIdRef.current) return;
        setClosingLine(text);
        setAiStatus('ready');
      })
      .catch((error) => {
        console.error('Review export closing line failed:', error);
        setAiStatus('fallback');
      });
  }, [summary, user?.id, user?.name, effectiveLocale]);

  const captureReviewPngUri = useCallback(async (): Promise<string> => {
    // Wait for interactions to finish before capture; failures bubble to onPressSave.
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => resolve());
    });
    const target = captureRootRef.current;
    if (!target) {
      throw new Error('Capture area not ready');
    }

    const layout = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        target.measure((_x, _y, width, height) => {
          if (width <= 0 || height <= 0) {
            reject(new Error('Invalid capture dimensions'));
            return;
          }
          resolve({ width, height });
        });
      },
    );

    const pixelWidth = Math.round(layout.width * PixelRatio.get());
    const captureWidth = Math.min(
      pixelWidth,
      REVIEW_EXPORT_CAPTURE_MAX_WIDTH,
    );

    const uri = await captureRef(target, {
      format: 'png',
      quality: REVIEW_EXPORT_CAPTURE_QUALITY,
      result: 'tmpfile',
      width: captureWidth,
    });
    if (!uri || typeof uri !== 'string') {
      throw new Error('Capture failed, please try again');
    }
    return uri;
  }, []);

  const performCaptureAndSave = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        t('alerts.webUnsupported.title'),
        t('alerts.webUnsupported.message'),
      );
      return;
    }
    const uri = await captureReviewPngUri();
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t('alerts.permission.title'),
        t('alerts.permission.message'),
        [
          { text: tCommon('actions.cancel'), style: 'cancel' },
          {
            text: tSystem('audio.permission.openSettings'),
            onPress: () => {
              Linking.openSettings().catch((error) => {
                console.error('Open settings failed:', error);
              });
            },
          },
        ],
      );
      return;
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      t('alerts.saveSuccess.title'),
      t('alerts.saveSuccess.message'),
    );
  }, [captureReviewPngUri, t, tCommon, tSystem]);

  const onPressSave = useCallback(async () => {
    if (isBusy) return;

    const go = async (setAck: boolean) => {
      setIsBusy(true);
      try {
        if (setAck) {
          await AsyncStorage.setItem(PRIVACY_ACK_KEY, 'true');
        }
        await performCaptureAndSave();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        Alert.alert(t('alerts.saveFail.title'), msg);
      } finally {
        setIsBusy(false);
      }
    };

    const ack = await AsyncStorage.getItem(PRIVACY_ACK_KEY);
    if (ack === 'true') {
      await go(false);
      return;
    }

    Alert.alert(
      t('alerts.privacy.title'),
      t('alerts.privacy.message'),
      [
        {
          text: t('actions.continue'),
          onPress: () => {
            go(true).catch((error) => {
              console.error('Save failed:', error);
            });
          },
        },
      ],
    );
  }, [isBusy, performCaptureAndSave, t]);

  return (
    <AppScreenShell
      edges={['top', 'left', 'right']}
      title={t('screen.title')}
      onBack={() => router.back()}
      titleColor={INSIGHTS_COLORS.text}
      titleFontFamily="Lato_700Bold"
      titleFontSize={responsiveLayout.headerTitleFontSize}
      headerStyle={{
        ...createStackScreenHeaderStyle(width, height),
        paddingTop: responsiveLayout.headerPaddingTop,
        paddingBottom: responsiveLayout.headerPaddingBottom,
      }}
      footer={
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: responsiveLayout.footerHorizontalPadding,
              paddingTop: responsiveLayout.footerTopPadding,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <Pressable
            style={[
              styles.saveBtn,
              {
                paddingVertical: responsiveLayout.saveButtonVerticalPadding,
                borderRadius: responsiveLayout.saveButtonRadius,
                minHeight: responsiveLayout.saveButtonMinHeight,
              },
              isBusy && styles.saveBtnDisabled,
            ]}
            onPress={() => {
              onPressSave().catch((error) => {
                console.error('Save failed:', error);
              });
            }}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.saveBtnText, { fontSize: responsiveLayout.saveButtonTextFontSize }]}>
                {t('actions.saveToAlbum')}
              </Text>
            )}
          </Pressable>
        </View>
      }
    >
      <View style={styles.middleColumn}>
      <View
        style={[
          styles.presetRow,
          {
            paddingHorizontal: responsiveLayout.presetHorizontalPadding,
            paddingBottom: responsiveLayout.presetBottomPadding,
          },
        ]}
      >
        {PRESETS.map((p) => {
          const selected = preset === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => setPreset(p.key)}
              style={[
                styles.chip,
                {
                  paddingHorizontal: responsiveLayout.chipHorizontalPadding,
                  paddingVertical: responsiveLayout.chipVerticalPadding,
                  borderRadius: responsiveLayout.chipRadius,
                },
                selected && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { fontSize: responsiveLayout.chipTextFontSize },
                  selected && styles.chipTextSelected,
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: responsiveLayout.scrollHorizontalPadding,
            paddingBottom: responsiveLayout.scrollBottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          ref={captureRootRef}
          collapsable={false}
          style={[styles.captureWrap, { borderRadius: responsiveLayout.captureRadius }]}
          accessible
          accessibilityLabel={exportRangeA11yLabel}
        >
          <ReviewExportCanvas
            derived={derived}
            closingLine={closingLine}
            aiStatus={aiStatus}
          />
        </View>
      </ScrollView>
      </View>
    </AppScreenShell>
  );
};

const styles = StyleSheet.create({
  middleColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    flexShrink: 0,
    gap: 8,
  },
  chip: {
    backgroundColor: INSIGHTS_COLORS.cardBg,
    borderWidth: 1,
    borderColor: INSIGHTS_COLORS.primary + '40',
  },
  chipSelected: {
    backgroundColor: INSIGHTS_COLORS.primary + '25',
    borderColor: INSIGHTS_COLORS.accent,
  },
  chipText: {
    fontFamily: 'Lato_400Regular',
    color: INSIGHTS_COLORS.textSecondary,
  },
  chipTextSelected: {
    color: INSIGHTS_COLORS.accent,
    fontFamily: 'Lato_700Bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
  },
  captureWrap: {
    overflow: 'hidden',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: INSIGHTS_COLORS.primary + '30',
  },
  saveBtn: {
    backgroundColor: INSIGHTS_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
