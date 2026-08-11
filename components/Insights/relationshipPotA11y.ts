/** Screen-reader label for a garden pot: name + status + healed count. */
export function buildRelationshipPotA11yLabel(
  displayName: string,
  statusLabel: string,
  healedCountText: string,
): string {
  return `${displayName}, ${statusLabel}, ${healedCountText}`;
}
