/**
 * 情绪回顾图页面：选择时间预设、渲染可截图画布、可选 AI 收尾句，并支持保存 PNG 到系统相册。
 * 隐私与权限在首次保存时通过 Alert 与 AsyncStorage 标记确认。
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { useResponsiveStyles } from '../../hooks/useResponsiveStyles';
import { getEffectiveFirstEntryDateForCompanion } from '../../services/companionDaysService';
import { formatDateChinese } from '../../shared/formatting';
import { REVIEW_PRESET_LABEL, type ReviewExportPreset } from '../../shared/time-range';
import { useAppStore } from '../../store/useAppStore';
import {
  generateReviewExportClosingLine,
  getDefaultReviewExportClosingLine,
  isGroqConfigured,
} from '../../utils/aiService';
import { computeReviewExportDerivedState } from '../../utils/reviewExportDerived';
import { AppScreenShell } from '../AppScreenShell';
import { INSIGHTS_COLORS } from '../Insights/constants';
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
  const user = useAppStore((s) => s.user);
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

    void generateReviewExportClosingLine(summary, user?.id, user?.name).then((text) => {
      if (id !== closingRequestIdRef.current) return;
      setClosingLine(text);
      setAiStatus('ready');
    });
  }, [summary, user?.id, user?.name]);

  const captureReviewPngUri = useCallback(async (): Promise<string> => {
    // 等待交互动画结束再截图，避免半帧布局；截图区域为 captureRootRef 包裹的画布。
    // 使用 tmpfile 结果以控制内存；失败时向上抛错供 onPressSave 统一 Alert。

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
      Alert.alert(
        '需要相册权限',
        '请在系统设置中允许心晴MO将回顾图保存到相册。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '去设置',
            onPress: () => void Linking.openSettings(),
          },
        ],
      );
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
        {
          text: '继续',
          onPress: () => {
            void go(true);
          },
        },
      ],
    );
  }, [isBusy, performCaptureAndSave]);

  return (
    <AppScreenShell
      edges={['top', 'left', 'right']}
      title="情绪回顾图"
      onBack={() => router.back()}
      titleColor={INSIGHTS_COLORS.text}
      titleFontFamily="Lato_700Bold"
      titleFontSize={responsiveLayout.headerTitleFontSize}
      headerStyle={{
        paddingHorizontal: responsiveLayout.headerPaddingHorizontal,
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
