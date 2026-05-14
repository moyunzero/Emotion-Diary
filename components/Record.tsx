import React from "react";
import { EntryEditor } from "./EntryEditor";

/** Tab「记一笔」：创建模式全屏编辑器 */
const Record: React.FC<{ onClose: () => void; onSuccess?: () => void }> = (
  props,
) => (
  <EntryEditor mode="create" presentation="fullscreen" {...props} />
);

export default Record;
