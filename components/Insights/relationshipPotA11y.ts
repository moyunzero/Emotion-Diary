/** Screen-reader label for a garden pot: name + growth status only (D-20). */
export function buildRelationshipPotA11yLabel(
  displayName: string,
  statusLabel: string,
): string {
  return `${displayName}, ${statusLabel}`;
}
