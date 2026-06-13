import { useEffect, useState } from "react";
import { ActivityIndicator, InteractionManager, View } from "react-native";

import type { MoodEntry } from "../../types";
import EmotionPodcast from "../ai/EmotionPodcast";
import { EmotionReleaseArchive } from "./EmotionReleaseArchive";
import { GardenFooter } from "./GardenFooter";
import { RelationshipGarden } from "./RelationshipGarden";
import { TriggerInsight } from "./TriggerInsight";

type InsightsDeferredSectionsProps = {
  entries: MoodEntry[];
  thisMonthCount: number;
  lastMonthCount: number;
  resolvedCount: number;
};

/**
 * Insights 首屏以下区块：交互结束后再挂载，减轻首开主线程压力。
 */
export function InsightsDeferredSections({
  entries,
  thisMonthCount,
  lastMonthCount,
  resolvedCount,
}: InsightsDeferredSectionsProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, []);

  if (!ready) {
    return (
      <View style={{ paddingVertical: 28, alignItems: "center" }}>
        <ActivityIndicator color="#EF4444" />
      </View>
    );
  }

  return (
    <>
      <EmotionPodcast />
      <EmotionReleaseArchive entries={entries} />
      <RelationshipGarden entries={entries} />
      <TriggerInsight entries={entries} />
      <GardenFooter
        thisMonthCount={thisMonthCount}
        lastMonthCount={lastMonthCount}
        resolvedCount={resolvedCount}
      />
    </>
  );
}
