import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDateChinese } from '../../shared/formatting';
import { REVIEW_PRESET_LABEL, type ReviewExportPreset } from '../../shared/time-range';
import { useResponsiveStyles } from '../../hooks/useResponsiveStyles';
import { getEffectiveFirstEntryDateForCompanion } from '../../services/companionDaysService';
import { useAppStore } from '../../store/useAppStore';
import {
  generateReviewExportClosingLine,
  getDefaultReviewExportClosingLine,
  isGroqConfigured,
} from '../../utils/aiService';
import { computeReviewExportDerivedState } from '../../utils/reviewExportDerived';
import { INSIGHTS_COLORS } from '../Insights/constants';
import { ScreenContainer } from '../ScreenContainer';
import { ReviewExportCanvas, type ReviewExportAiStatus } from './ReviewExportCanvas';
import { buildReviewExportResponsiveLayout } from './reviewExportResponsiveLayout';

const PRIVACY_ACK_KEY = 'review_export_privacy_ack_v1';

const PRESETS: { key: ReviewExportPreset; label: string }[] = [
  { key: 'this_week', label: REVIEW_PRESET_LABEL.this_week },
  { key: 'this_month', label: REVIEW_PRESET_LABEL.this_month },
  { key: 'last_week', label: REVIEW_PRESET_LABEL.last_week },
  { key: 'last_month', label: REVIEW_PRESET_LABEL.last_month },
];

export const ReviewExportScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveStyles();
  const responsiveLayout = useMemo(
    () => buildReviewExportResponsiveLayout(responsive),
    [responsive],
  );
  const entries = useAppStore((s) => s.entries);
  const userFirstEntryDate = useAppStore((s) => s.user?.firstEntryDate);
  const firstEntryDate = useMemo(
    () => getEffectiveFirstEntryDateForCompanion(userFirstEntryDate, entries),
    [userFirstEntryDate, entries],
  );

  const [preset, setPreset] = useState<ReviewExportPreset>('this_month');
  const [now] = useState(() => new Date());
  const [isBusy, setIsBusy] = useState(false);

  const derived = useMemo(
    () =>
      computeReviewExportDerivedState(entries, firstEntryDate, preset, now),
    [entries, firstEntryDate, preset, now],
  );
  const summary = derived.closingSummary;
  const exportRangeA11yLabel = useMemo(
    () => `回顾时间范围：${formatDateChinese(summary.periodStartMs)} 到 ${formatDateChinese(summary.periodEndMs)}`,
    [summary.periodEndMs, summary.periodStartMs],
  );

  const [closingLine, setClosingLine] = useState(() =>
    getDefaultReviewExportClosingLine(summary),
  );

  const [aiStatus, setAiStatus] = useState<ReviewExportAiStatus>('idle');
  const closingRequestIdRef = useRef(0);

  const captureRootRef = useRef<View>(null);

  useEffect(() => {
    const defaultLine = getDefaultReviewExportClosingLine(summary);
    const id = ++closingRequestIdRef.current;

    if (!isGroqConfigured()) {
      setClosingLine(defaultLine);
      setAiStatus('fallback');
      return;
    }

    setClosingLine(defaultLine);
    setAiStatus('loading');

    void generateReviewExportClosingLine(summary).then((text) => {
      if (id !== closingRequestIdRef.current) return;
      setClosingLine(text);
      setAiStatus('ready');
    });
  }, [summary]);

  const captureReviewPngUri = useCallback(async (): Promise<string> => {
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => resolve());
    });
    const target = captureRootRef.current;
    if (!target) {
      throw new Error('截图区域未就绪');
    }
    const uri = await captureRef(target, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    if (!uri || typeof uri !== 'string') {
      throw new Error('截图失败，请稍后重试');
    }
    return uri;
  }, []);

  const performCaptureAndSave = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('暂不支持', '请在 iOS 或 Android 应用中保存回顾图到相册。');
      return;
    }
    const uri = await captureReviewPngUri();
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('需要相册权限', '请在系统设置中允许焚语将回顾图保存到相册。');
      return;
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('已保存', '回顾图已保存到系统相册。');
  }, [captureReviewPngUri]);

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
        Alert.alert('保存失败', msg);
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
      '隐私提示',
      '回顾图含你的情绪与记录信息；保存后可在系统相册中查看，请注意设备共用与他人翻看风险。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '不再提示并保存',
          onPress: () => {
            void go(true);
          },
        },
        {
          text: '继续保存',
          onPress: () => {
            void go(false);
          },
        },
      ],
    );
  }, [isBusy, performCaptureAndSave]);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={styles.rootColumn}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: responsiveLayout.headerPaddingHorizontal,
            paddingTop: responsiveLayout.headerPaddingTop,
            paddingBottom: responsiveLayout.headerPaddingBottom,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <ChevronLeft size={26} color={INSIGHTS_COLORS.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontSize: responsiveLayout.headerTitleFontSize }]}>
          情绪回顾图
        </Text>
        <View style={{ width: 40 }} />
      </View>

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
          onPress={() => void onPressSave()}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { fontSize: responsiveLayout.saveButtonTextFontSize }]}>
              保存到相册
            </Text>
          )}
        </Pressable>
      </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  rootColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    color: INSIGHTS_COLORS.text,
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
