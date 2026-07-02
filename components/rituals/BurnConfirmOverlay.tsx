import React from "react";
import RitualConfirmOverlay, {
  type RitualConfirmOverlayProps,
} from "./RitualConfirmOverlay";

export type BurnConfirmOverlayProps = Omit<
  RitualConfirmOverlayProps,
  "variant"
>;

export default function BurnConfirmOverlay(props: BurnConfirmOverlayProps) {
  return <RitualConfirmOverlay variant="burn" {...props} />;
}
