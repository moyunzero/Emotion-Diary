/**
 * Mood review export: preset selection, 9:16 share card preview, optional AI closing line, save PNG.
 * Privacy confirmed via shared ensurePrivacyAck on first save.
 */

import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveStyles } from '../../hooks/useResponsiveStyles';
import { getEffectiveFirstEntryDateForCompanion } from '../../services/companionDaysService';
import { formatLocaleDate } from '../../shared/formatting';
import { type ReviewExportPreset } from '../../shared/time-range';
import { forceCancelRecording } from '../../shared/audio/recordingCoordinator';
import { excludeSoftDeletedEntries } from '../../shared/entries/visibility';
import { buildWeekShareCardModel } from '../../shared/share/buildShareCardModel';
import { captureViewToPng } from '../../shared/share/captureViewToPng';
import {
  ensurePrivacyAck,
  persistPrivacyAck,
} from '../../shared/share/privacyAck';
import { saveShareCardImage } from '../../shared/share/saveShareCardImage';
import { useAppStore } from '../../store/useAppStore';
import {
  generateReviewExportClosingLine,
  getDefaultReviewExportClosingLine,
  isGroqConfigured,
} from '../../utils/aiService';
import { computeReviewExportDerivedState } from '../../utils/reviewExportDerived';
import { filterEntriesInRange } from '../../utils/reviewStats';
import { logger } from '../../utils/logger';
import { DESIGN_TOKENS } from '../../constants/colors';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { AppScreenShell } from '../AppScreenShell';
import {
  getInsightsColors,
  type InsightsColors,
} from '../Insights/constants';
import { ShareCardShell } from '../share/ShareCardShell';
import {
  ShareCardWeekContent,
  type ShareCardAiStatus,
} from '../share/ShareCardWeekContent';
import { AppButton } from '../ui/AppButton';
import { createStackScreenHeaderStyle } from '../../styles/stackScreenHeader';
import { buildReviewExportResponsiveLayout } from './reviewExportResponsiveLayout';

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
  const { t: tShare } = useTranslation('share');
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
  const { colors } = useThemeStyles();
  // Screen chrome follows active palette; capture subtree stays light (D-06).
  const chrome = useMemo(() => getInsightsColors(colors), [colors]);
  const chromeStyles = useMemo(() => createChromeStyles(chrome), [chrome]);
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
  const [snippetEnabled, setSnippetEnabled] = useState(false);
  const [snippetText, setSnippetText] = useState('');

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
  const periodStartMs = derived.current.startMs;
  const periodEndMs = derived.current.endMs;
  const periodEntries = useMemo(
    () =>
      filterEntriesInRange(
        excludeSoftDeletedEntries(entries),
        periodStartMs,
        periodEndMs,
      ),
    [entries, periodStartMs, periodEndMs],
  );
  const periodLabel = useMemo(() => t(`presets.${preset}`), [t, preset]);
  const cardTitle = useMemo(
    () => tShare('canvas.periodTitle', { period: periodLabel }),
    [tShare, periodLabel],
  );
  const closingSectionLabel = useMemo(
    () => tShare('canvas.closingLabelPeriod', { period: periodLabel }),
    [tShare, periodLabel],
  );
  const summary = derived.closingSummary;
  const dateRangeLabel = useMemo(
    () =>
      `${formatLocaleDate(derived.current.startMs, effectiveLocale)}${t('canvas.dateRangeSeparator')}${formatLocaleDate(derived.current.endMs, effectiveLocale)}`,
    [derived, effectiveLocale, t],
  );
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

  const [aiStatus, setAiStatus] = useState<ShareCardAiStatus>('idle');
  const closingRequestIdRef = useRef(0);

  const captureRootRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const shareModel = useMemo(
    () =>
      buildWeekShareCardModel({
        derived,
        closingLine,
        effectiveLocale,
        periodEntries,
        userSnippet: snippetEnabled ? snippetText : undefined,
      }),
    [derived, closingLine, effectiveLocale, periodEntries, snippetEnabled, snippetText],
  );

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
        if (id !== closingRequestIdRef.current) return;
        logger.error('ReviewExportScreen', 'Review export closing line failed', error);
        setAiStatus('fallback');
      });
  }, [summary, user?.id, user?.name, effectiveLocale]);

  const saveCopy = useMemo(
    () => ({
      permissionTitle: t('alerts.permission.title'),
      permissionMessage: t('alerts.permission.message'),
      cancelLabel: tCommon('actions.cancel'),
      openSettingsLabel: tSystem('audio.permission.openSettings'),
      successTitle:
        Platform.OS === 'web'
          ? tShare('alerts.downloadSuccess.title')
          : t('alerts.saveSuccess.title'),
      successMessage:
        Platform.OS === 'web'
          ? tShare('alerts.downloadSuccess.message')
          : t('alerts.saveSuccess.message'),
    }),
    [t, tCommon, tShare, tSystem],
  );

  const onPressSave = useCallback(async () => {
    if (isBusy || aiStatus === 'loading') return;

    await ensurePrivacyAck(async (setAck) => {
      setIsBusy(true);
      try {
        if (setAck) {
          await persistPrivacyAck();
        }
        const target = captureRootRef.current;
        if (!target) {
          throw new Error('Capture area not ready');
        }
        const uri = await captureViewToPng(target);
        await saveShareCardImage(uri, saveCopy);
        if (Platform.OS === 'web') {
          Alert.alert(saveCopy.successTitle, saveCopy.successMessage);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === 'Media library permission denied') {
          return;
        }
        Alert.alert(
          tShare('alerts.saveFail.title'),
          msg || tShare('alerts.saveFail.message'),
        );
      } finally {
        setIsBusy(false);
      }
    }, {
      title: tShare('alerts.privacy.title'),
      message: tShare('alerts.privacy.message'),
      continueLabel: tShare('actions.continue'),
      cancelLabel: tCommon('actions.cancel'),
    });
  }, [aiStatus, isBusy, saveCopy, tCommon, tShare]);

  const saveLabel =
    Platform.OS === 'web'
      ? tShare('actions.download')
      : tShare('actions.saveToAlbum');

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const handleSnippetFocus = useCallback(() => {
    // Lift shell via keyboardAware; scroll opt-in field above sticky save footer.
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });
  }, []);

  return (
    <AppScreenShell
      edges={['top', 'left', 'right']}
      keyboardAware
      title={t('screen.title')}
      onBack={handleBack}
      backTestID="review-export-back-button"
      titleColor={chrome.text}
      titleFontSize={responsiveLayout.headerTitleFontSize}
      headerStyle={{
        ...createStackScreenHeaderStyle(width, height, colors),
        paddingTop: responsiveLayout.headerPaddingTop,
        paddingBottom: responsiveLayout.headerPaddingBottom,
      }}
      footer={
        <View
          style={[
            chromeStyles.footer,
            {
              paddingHorizontal: responsiveLayout.footerHorizontalPadding,
              paddingTop: responsiveLayout.footerTopPadding,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <AppButton
            variant="primary"
            label={saveLabel}
            loading={isBusy}
            disabled={aiStatus === 'loading'}
            onPress={() => {
              onPressSave().catch((error) => {
                logger.error('ReviewExportScreen', 'Save failed', error);
              });
            }}
            testID="share-card-save-button"
          />
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
                chromeStyles.chip,
                {
                  paddingHorizontal: responsiveLayout.chipHorizontalPadding,
                  paddingVertical: responsiveLayout.chipVerticalPadding,
                  borderRadius: responsiveLayout.chipRadius,
                },
                selected && chromeStyles.chipSelected,
              ]}
            >
              <Text
                style={[
                  chromeStyles.chipText,
                  { fontSize: responsiveLayout.chipTextFontSize },
                  selected && chromeStyles.chipTextSelected,
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={scrollViewRef}
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
        keyboardDismissMode={
          Platform.OS === 'ios' ? 'interactive' : 'on-drag'
        }
      >
        <View
          style={[
            styles.previewOuter,
            { maxWidth: Math.min(width * 0.92, 380) },
          ]}
        >
        {/* D-06: captureRoot rasterizes light hand账 palette (ShareCardWeekContent INSIGHTS_COLORS). */}
        <View
          ref={captureRootRef}
          collapsable={false}
          accessible
          accessibilityLabel={exportRangeA11yLabel}
          style={styles.captureRoot}
        >
          <ShareCardShell model={shareModel}>
              <ShareCardWeekContent
                model={shareModel}
                aiStatus={aiStatus}
                dateRangeLabel={dateRangeLabel}
                cardTitle={cardTitle}
                closingSectionLabel={closingSectionLabel}
              />
            </ShareCardShell>
          </View>
        </View>

        <View style={chromeStyles.optInBlock}>
          <View style={styles.optInRow}>
            <Text style={chromeStyles.optInLabel}>{tShare('optIn.label')}</Text>
            <Switch
              testID="share-card-snippet-toggle"
              value={snippetEnabled}
              onValueChange={setSnippetEnabled}
              accessibilityLabel={tShare('optIn.label')}
            />
          </View>
          {snippetEnabled ? (
            <>
              <TextInput
                testID="share-card-snippet-input"
                style={chromeStyles.snippetInput}
                value={snippetText}
                onChangeText={setSnippetText}
                maxLength={80}
                placeholder={tShare('optIn.placeholder')}
                placeholderTextColor={chrome.textSecondary}
                multiline
                numberOfLines={3}
                onFocus={handleSnippetFocus}
                accessibilityLabel={tShare('optIn.placeholder')}
              />
              <Text style={chromeStyles.optInHint}>{tShare('optIn.hint')}</Text>
            </>
          ) : (
            <Text style={chromeStyles.optInOff}>{tShare('optIn.off')}</Text>
          )}
        </View>
      </ScrollView>
      </View>
    </AppScreenShell>
  );
};

function createChromeStyles(chrome: InsightsColors) {
  return StyleSheet.create({
    chip: {
      backgroundColor: chrome.cardBg,
      borderWidth: 1,
      borderColor: chrome.primary + '35',
    },
    chipSelected: {
      backgroundColor: chrome.primary + '25',
      borderColor: chrome.accent,
    },
    chipText: {
      color: chrome.textSecondary,
    },
    chipTextSelected: {
      color: chrome.accent,
      fontWeight: '700',
    },
    optInBlock: {
      alignSelf: 'stretch',
      width: '100%',
      maxWidth: 380,
      marginTop: 20,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      backgroundColor: chrome.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.primary + '28',
    },
    optInLabel: {
      flex: 1,
      fontSize: 16,
      color: chrome.text,
      marginRight: 12,
    },
    snippetInput: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: chrome.primary + '40',
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      lineHeight: 21,
      color: chrome.text,
      minHeight: 72,
      textAlignVertical: 'top',
    },
    optInHint: {
      marginTop: 8,
      fontSize: 12,
      lineHeight: 16.8,
      color: chrome.textSecondary,
    },
    optInOff: {
      marginTop: 4,
      fontSize: 12,
      color: chrome.textSecondary,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.primary + '30',
    },
  });
}

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
    paddingVertical: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
  },
  previewOuter: {
    alignSelf: 'center',
    width: '100%',
  },
  captureRoot: {
    width: '100%',
  },
  optInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
});
