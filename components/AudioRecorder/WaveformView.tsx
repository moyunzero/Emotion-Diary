/**
 * 波形视图组件
 * 实时显示录音音量
 * 支持高性能设备和低性能设备的降级方案
 */

import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

const BAR_COUNT = 20;
const BAR_WIDTH = 4;
const BAR_GAP = 2;
const MAX_BAR_HEIGHT = 40;
const MIN_BAR_HEIGHT = 4;

type WaveformType = "realtime-wave" | "simple-bars";

interface WaveformViewProps {
  readonly isActive: boolean;
  readonly waveformType?: WaveformType;
  readonly color?: string;
}

// 生成稳定的柱子ID（只生成一次）
const BAR_IDS = Array.from({ length: BAR_COUNT }, (_, i) => `bar-${i}`);

// 辅助函数：生成随机高度
const getRandomHeight = () => 
  Math.random() * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) + MIN_BAR_HEIGHT;

// 辅助函数：简单模式更新（所有柱子同高度）
const updateSimpleBars = (prevBars: number[]): number[] => {
  const randomHeight = getRandomHeight();
  return prevBars.map(() => randomHeight);
};

// 辅助函数：波形模式更新（平滑过渡）
const updateRealtimeWave = (prevBars: number[]): number[] => {
  const newBars = [...prevBars];
  
  for (let i = 0; i < BAR_COUNT; i++) {
    const randomTarget = getRandomHeight();
    newBars[i] = newBars[i] + (randomTarget - newBars[i]) * 0.5;
    newBars[i] = Math.max(MIN_BAR_HEIGHT, Math.min(MAX_BAR_HEIGHT, newBars[i]));
  }
  
  return newBars;
};

export const WaveformView: React.FC<WaveformViewProps> = ({
  isActive,
  waveformType = "realtime-wave",
  color = "#6C63FF",
}) => {
  const [bars, setBars] = useState<number[]>(
    Array.from({ length: BAR_COUNT }, () => MIN_BAR_HEIGHT)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setBars(Array.from({ length: BAR_COUNT }, () => MIN_BAR_HEIGHT));
      return;
    }

    const updateBars = () => {
      setBars(waveformType === "simple-bars" ? updateSimpleBars : updateRealtimeWave);
    };

    const intervalMs = waveformType === "simple-bars" ? 200 : 80;
    intervalRef.current = setInterval(updateBars, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, waveformType]);

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {bars.map((height, index) => (
          <View
            key={BAR_IDS[index]}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: color,
                borderTopLeftRadius: waveformType === "realtime-wave" ? BAR_WIDTH / 2 : 2,
                borderTopRightRadius: waveformType === "realtime-wave" ? BAR_WIDTH / 2 : 2,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: MAX_BAR_HEIGHT + 20,
    justifyContent: "center",
    alignItems: "center",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 2,
    minHeight: MIN_BAR_HEIGHT,
  },
});
