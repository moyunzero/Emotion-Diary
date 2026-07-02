import React from "react";
import RitualConfirmOverlay, {
  type RitualConfirmOverlayProps,
} from "./RitualConfirmOverlay";

export type ResolveConfirmOverlayProps = Omit<
  RitualConfirmOverlayProps,
  "variant"
>;

export default function ResolveConfirmOverlay(
  props: ResolveConfirmOverlayProps,
) {
  return <RitualConfirmOverlay variant="resolve" {...props} />;
}
