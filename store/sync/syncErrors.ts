import { i18n } from "../../i18n";
import { isAuthError, isNetworkError } from "../../utils/errorHandler";

/**
 * Sync-scoped user-friendly error message (extracted from useAppStore getErrorMessage).
 */
export function getSyncErrorMessage(error: unknown): string {
  if (!error) {
    return i18n.t("generic.operationFailed", { ns: "system" });
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
    return i18n.t("errors.requestTimeout", { ns: "system" });
  }

  if (isNetworkError(error)) {
    return i18n.t("errors.networkConnectionFailed", { ns: "system" });
  }

  if (isAuthError(error)) {
    if (errorMessage.includes("Invalid login credentials")) {
      return i18n.t("errors.invalidLoginCredentials", { ns: "system" });
    }
    return i18n.t("errors.authFailedRelogin", { ns: "system" });
  }

  if (errorMessage.includes("User already registered")) {
    return i18n.t("errors.emailRegistered", { ns: "system" });
  }

  if (errorMessage.includes("Email rate limit")) {
    return i18n.t("errors.rateLimited", { ns: "system" });
  }

  if (
    errorMessage.includes("relation") &&
    errorMessage.includes("does not exist")
  ) {
    return i18n.t("errors.dbTableMissing", { ns: "system" });
  }

  if (
    errorMessage.includes("23505") ||
    errorMessage.includes("duplicate key") ||
    errorMessage.includes("unique constraint")
  ) {
    return i18n.t("errors.recordExistsWillUpdate", { ns: "system" });
  }

  if (
    errorMessage.includes("42501") ||
    errorMessage.includes("row-level security") ||
    errorMessage.includes("violates row-level security policy")
  ) {
    return i18n.t("errors.rlsPolicyError", { ns: "system" });
  }

  if (
    errorMessage.includes("permission denied") ||
    errorMessage.includes("PGRST")
  ) {
    return i18n.t("errors.permissionDenied", { ns: "system" });
  }

  return errorMessage.length > 50
    ? i18n.t("generic.operationFailed", { ns: "system" })
    : errorMessage;
}
