import { mergeConfirmForCount, presentMergeConfirm } from "../../../../features/profile/hooks/mergeConfirm";

describe("mergeConfirmForCount", () => {
  it("keeps the short confirm when nothing would be replaced", () => {
    expect(mergeConfirmForCount({ status: "ready", total: 0 })).toEqual({
      kind: "short",
    });
  });

  it("states a positive count", () => {
    expect(mergeConfirmForCount({ status: "ready", total: 3 })).toEqual({
      kind: "counted",
      total: 3,
    });
  });

  it("does not treat an unknown count as zero", () => {
    expect(mergeConfirmForCount({ status: "unknown" })).toEqual({
      kind: "unknown",
    });
  });
});

describe("presentMergeConfirm", () => {
  const t = (key: string, options?: Record<string, unknown>) => {
    if (key === "pull.confirmReplace") return `本机有 ${options?.count} 条修改`;
    if (key === "pull.confirmUnknown") return "暂时无法确认有多少条本机修改会被覆盖";
    if (key === "pull.confirmMessage") return "仅本机独有的记录会保留";
    if (key === "pull.confirmTitle") return "从云端合并";
    if (key === "pull.confirmOk") return "继续合并";
    if (key === "pull.uploadFirst") return "先备份";
    if (key === "pull.mergeAnyway") return "仍要合并";
    if (key === "actions.cancel") return "取消";
    return key;
  };

  it("offers backup, merge, and cancel when local edits would be replaced", () => {
    const alert = jest.fn();
    const onAction = jest.fn();
    presentMergeConfirm(
      { kind: "counted", total: 2 },
      onAction,
      { alert, t },
    );

    const [, message, buttons] = alert.mock.calls[0];
    expect(message).toBe("本机有 2 条修改");
    expect(message).not.toContain("日记");
    buttons[0].onPress();
    buttons[1].onPress();
    buttons[2].onPress();
    expect(onAction.mock.calls).toEqual([["upload"], ["download"], ["cancel"]]);
  });

  it("keeps the short confirm free of the replace actions", () => {
    const alert = jest.fn();
    presentMergeConfirm({ kind: "short" }, jest.fn(), { alert, t });
    const labels = alert.mock.calls[0][2].map((button: { text: string }) => button.text);
    expect(labels).toEqual(["取消", "继续合并"]);
  });

  it("uses the unknown copy without a zero count", () => {
    const alert = jest.fn();
    presentMergeConfirm({ kind: "unknown" }, jest.fn(), { alert, t });
    expect(alert.mock.calls[0][1]).toBe("暂时无法确认有多少条本机修改会被覆盖");
    expect(alert.mock.calls[0][1]).not.toContain("0 条");
  });
});
