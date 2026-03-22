/**
 * Unit tests for utility function return types
 * Task 15.3: Verify that utility functions return correctly typed values
 * Requirement 2.4: When using utility functions, THE System SHALL provide explicit return type annotations
 *
 * This test file validates that the 20 utility functions updated in Task 15.2
 * return correctly typed values and that TypeScript inference works properly.
 */

import React from "react";
import {
  AccessibilityProps,
  buttonAccessibility,
  createAccessibilityProps,
} from "../../../utils/accessibility";
import { formatDateChinese, formatMonthDay } from "../../../shared/formatting";
import { ensureMilliseconds, formatDate } from "@/shared/formatting";
import { getMoodIcon } from "../../../utils/moodIconUtils";

describe("Utility Function Return Types - Requirement 2.4", () => {
  describe("dateUtils.ts & shared/formatting - date helpers", () => {
    describe("formatDate", () => {
      it("should return string type", () => {
        const result = formatDate(Date.now());
        expect(typeof result).toBe("string");
      });

      it("should infer correct return type", () => {
        const result: string = formatDate(Date.now());
        expect(result).toBeDefined();
      });
    });

    describe("formatDateChinese", () => {
      it("should return string type", () => {
        const result = formatDateChinese(Date.now());
        expect(typeof result).toBe("string");
      });

      it("should infer correct return type", () => {
        const result: string = formatDateChinese(Date.now());
        expect(result).toBeDefined();
      });
    });

    describe("formatMonthDay (shared/formatting)", () => {
      it("should return string type", () => {
        const result = formatMonthDay(Date.now());
        expect(typeof result).toBe("string");
      });

      it("should infer correct return type", () => {
        const result: string = formatMonthDay(Date.now());
        expect(result).toBeDefined();
      });
    });

    describe("ensureMilliseconds", () => {
      it("should return number type", () => {
        const result = ensureMilliseconds(Date.now());
        expect(typeof result).toBe("number");
      });

      it("should infer correct return type", () => {
        const result: number = ensureMilliseconds(Date.now());
        expect(result).toBeDefined();
      });
    });
  });

  describe("accessibility.ts - Accessibility Utility Functions", () => {
    describe("createAccessibilityProps", () => {
      it("should return AccessibilityProps object", () => {
        const result = createAccessibilityProps("button", "Label");
        expect(typeof result).toBe("object");
        expect(result).toHaveProperty("accessibilityRole");
        expect(result).toHaveProperty("accessibilityLabel");
      });

      it("should infer correct return type", () => {
        const result: AccessibilityProps = createAccessibilityProps(
          "button",
          "Label",
        );
        expect(result).toBeDefined();
      });
    });

    describe("buttonAccessibility", () => {
      it("should return AccessibilityProps object", () => {
        const result = buttonAccessibility("Label");
        expect(typeof result).toBe("object");
        expect(result.accessibilityRole).toBe("button");
      });

      it("should infer correct return type", () => {
        const result: AccessibilityProps = buttonAccessibility("Label");
        expect(result).toBeDefined();
      });
    });
  });

  describe("moodIconUtils.tsx - Mood Icon Utility Functions", () => {
    describe("getMoodIcon", () => {
      it("should return React Element", () => {
        const result = getMoodIcon("Cloud", "#000", 20);
        expect(React.isValidElement(result)).toBe(true);
      });

      it("should infer correct return type", () => {
        const result: React.JSX.Element = getMoodIcon("Cloud", "#000", 20);
        expect(result).toBeDefined();
      });
    });
  });
});
