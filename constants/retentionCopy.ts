/**
 * 留存触达用户可见文案（009）
 */

export const RETENTION_COPY = {
  dailyReminderTitle: "情绪记录提醒",
  dailyReminderSubtextEnabled: (hour: number, minute: number) =>
    `每天 ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} 温柔提醒记一笔`,
  dailyReminderSubtextDisabled: "默认关闭；仅本地通知，不含日记内容",
  weeklyReviewToggleTitle: "周末周回顾提醒",
  weeklyReviewToggleSubtext: "周六 10:00 提示生成本周回顾图",
  enableConfirmTitle: "开启情绪提醒",
  enableConfirmMessage:
    "心晴MO 会在你设定的时间发送本地通知，提醒你花一分钟记录心情。通知不含日记正文，也不会上传到云端。",
  enableConfirmOk: "开启",
  enableConfirmCancel: "暂不",
  permissionDenied: "未获得通知权限，无法在设定时间提醒你",
  webReminderUnsupported: "Web 端暂不支持本地通知，请使用 App",
  dailyNotificationTitle: "心晴MO",
  dailyNotificationBody: "今天过得怎样？花一分钟记录心情吧",
  weeklyNotificationTitle: "心晴MO · 周回顾",
  weeklyNotificationBody: "本周的心情值得被看见，去生成回顾图吧",
  revisitBannerTitle: (days: number) =>
    days === 0 ? "今天还没记录" : `上次记录是 ${days} 天前`,
  revisitBannerAction: "去记一笔",
  revisitBannerDismiss: "今天先不提醒",
  weeklyBannerTitle: "本周回顾准备好了",
  weeklyBannerBody: "把这一周的心情收成一张回顾图",
  weeklyBannerAction: "生成上周回顾",
  weeklyBannerDismiss: "本周不再提示",
  quickFormExpand: "补充更多（人物、触发器、期限）",
  quickFormCollapse: "收起补充项",
} as const;
