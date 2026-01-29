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
import {
  ensureMilliseconds,
  formatDate,
  formatDateChinese,
  formatDateShort,
} from "../../../utils/dateUtils";
import { getMoodIcon } from "../../../utils/moodIconUtils";
import {
  getDeviceType,
  getMaxContentWidth,
  isLandscape,
  responsiveBorderRadius,
  responsiveFontSize,
  responsiveGrid,
  responsiveIconSize,
  responsivePadding,
  responsiveSpacing,
} from "../../../utils/responsiveUtils";

describe("Utility Function Return Types - Requirement 2.4", () => {
  describe("responsiveUtils.ts - Responsive Design Functions", () => {
    describe("responsivePadding", () => {
      it("should return number type for horizontal padding", () => {
        const result = responsivePadding.horizontal();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it("should return number type for horizontal padding with custom base", () => {
        const result = responsivePadding.horizontal(30);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it("should return number type for vertical padding", () => {
        const result = responsivePadding.vertical();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it("should return number type for vertical padding with custom base", () => {
        const result = responsivePadding.vertical(24);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it("should return number type for card padding", () => {
        const result = responsivePadding.card();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it("should return number type for card padding with custom base", () => {
        const result = responsivePadding.card(25);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    describe("responsiveFontSize", () => {
      it("should return number type for title font size", () => {
        const result = responsiveFontSize.title();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for title font size with custom base", () => {
        const result = responsiveFontSize.title(28);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for cardTitle font size", () => {
        const result = responsiveFontSize.cardTitle();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for cardTitle font size with custom base", () => {
        const result = responsiveFontSize.cardTitle(18);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for body font size", () => {
        const result = responsiveFontSize.body();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for body font size with custom base", () => {
        const result = responsiveFontSize.body(15);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for small font size", () => {
        const result = responsiveFontSize.small();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for small font size with custom base", () => {
        const result = responsiveFontSize.small(10);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });
    });

    describe("responsiveSpacing", () => {
      it("should return number type for cardGap", () => {
        const result = responsiveSpacing.cardGap();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for component spacing", () => {
        const result = responsiveSpacing.component();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for component spacing with custom base", () => {
        const result = responsiveSpacing.component(20);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });
    });

    describe("responsiveIconSize", () => {
      it("should return number type for small icon size", () => {
        const result = responsiveIconSize.small();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for medium icon size", () => {
        const result = responsiveIconSize.medium();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for large icon size", () => {
        const result = responsiveIconSize.large();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });
    });

    describe("responsiveBorderRadius", () => {
      it("should return number type for card border radius", () => {
        const result = responsiveBorderRadius.card();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for large border radius", () => {
        const result = responsiveBorderRadius.large();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });
    });

    describe("responsiveGrid", () => {
      it("should return number type for columns", () => {
        const result = responsiveGrid.columns();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
        expect(Number.isInteger(result)).toBe(true);
      });

      it("should return number type for itemWidth", () => {
        const result = responsiveGrid.itemWidth();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for itemWidth with custom gap", () => {
        const result = responsiveGrid.itemWidth(12);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });

      it("should return number type for gap", () => {
        const result = responsiveGrid.gap();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });
    });

    describe("getMaxContentWidth", () => {
      it("should return number type", () => {
        const result = getMaxContentWidth();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      });
    });

    describe("getDeviceType", () => {
      it("should return valid device type string", () => {
        const result = getDeviceType();
        expect(typeof result).toBe("string");
        expect(["phone", "tablet", "desktop"]).toContain(result);
      });
    });

    describe("isLandscape", () => {
      it("should return boolean type", () => {
        const result = isLandscape();
        expect(typeof result).toBe("boolean");
      });
    });
  });

  describe("TypeScript Inference Validation", () => {
    it("should infer correct types for responsivePadding methods", () => {
      // TypeScript should infer these as number
      const horizontal: number = responsivePadding.horizontal();
      const vertical: number = responsivePadding.vertical();
      const card: number = responsivePadding.card();

      expect(horizontal).toBeDefined();
      expect(vertical).toBeDefined();
      expect(card).toBeDefined();
    });

    it("should infer correct types for responsiveFontSize methods", () => {
      // TypeScript should infer these as number
      const title: number = responsiveFontSize.title();
      const cardTitle: number = responsiveFontSize.cardTitle();
      const body: number = responsiveFontSize.body();
      const small: number = responsiveFontSize.small();

      expect(title).toBeDefined();
      expect(cardTitle).toBeDefined();
      expect(body).toBeDefined();
      expect(small).toBeDefined();
    });

    it("should infer correct types for responsiveSpacing methods", () => {
      // TypeScript should infer these as number
      const cardGap: number = responsiveSpacing.cardGap();
      const component: number = responsiveSpacing.component();

      expect(cardGap).toBeDefined();
      expect(component).toBeDefined();
    });

    it("should infer correct types for responsiveIconSize methods", () => {
      // TypeScript should infer these as number
      const small: number = responsiveIconSize.small();
      const medium: number = responsiveIconSize.medium();
      const large: number = responsiveIconSize.large();

      expect(small).toBeDefined();
      expect(medium).toBeDefined();
      expect(large).toBeDefined();
    });

    it("should infer correct types for responsiveBorderRadius methods", () => {
      // TypeScript should infer these as number
      const card: number = responsiveBorderRadius.card();
      const large: number = responsiveBorderRadius.large();

      expect(card).toBeDefined();
      expect(large).toBeDefined();
    });

    it("should infer correct types for responsiveGrid methods", () => {
      // TypeScript should infer these as number
      const columns: number = responsiveGrid.columns();
      const itemWidth: number = responsiveGrid.itemWidth();
      const gap: number = responsiveGrid.gap();

      expect(columns).toBeDefined();
      expect(itemWidth).toBeDefined();
      expect(gap).toBeDefined();
    });

    it("should infer correct type for getMaxContentWidth", () => {
      // TypeScript should infer this as number
      const maxWidth: number = getMaxContentWidth();
      expect(maxWidth).toBeDefined();
    });

    it("should infer correct type for getDeviceType", () => {
      // TypeScript should infer this as 'phone' | 'tablet' | 'desktop'
      const deviceType: "phone" | "tablet" | "desktop" = getDeviceType();
      expect(deviceType).toBeDefined();
    });

    it("should infer correct type for isLandscape", () => {
      // TypeScript should infer this as boolean
      const landscape: boolean = isLandscape();
      expect(landscape).toBeDefined();
    });
  });

  describe("Edge Cases and Boundary Values", () => {
    it("should handle zero base values for padding", () => {
      const horizontal = responsivePadding.horizontal(0);
      const vertical = responsivePadding.vertical(0);
      const card = responsivePadding.card(0);

      expect(typeof horizontal).toBe("number");
      expect(typeof vertical).toBe("number");
      expect(typeof card).toBe("number");
    });

    it("should handle large base values for font sizes", () => {
      const title = responsiveFontSize.title(100);
      const cardTitle = responsiveFontSize.cardTitle(100);
      const body = responsiveFontSize.body(100);
      const small = responsiveFontSize.small(100);

      expect(title).toBeGreaterThan(0);
      expect(cardTitle).toBeGreaterThan(0);
      expect(body).toBeGreaterThan(0);
      expect(small).toBeGreaterThan(0);
    });

    it("should handle negative gap values for grid", () => {
      // Even with negative gap, function should return a number
      const itemWidth = responsiveGrid.itemWidth(-10);
      expect(typeof itemWidth).toBe("number");
    });

    it("should return consistent types across multiple calls", () => {
      const call1 = responsivePadding.horizontal();
      const call2 = responsivePadding.horizontal();

      expect(typeof call1).toBe(typeof call2);
      expect(typeof call1).toBe("number");
    });
  });

  describe("Return Value Consistency", () => {
    it("should return consistent number types for all padding methods", () => {
      const methods = [
        responsivePadding.horizontal(),
        responsivePadding.vertical(),
        responsivePadding.card(),
      ];

      methods.forEach((result) => {
        expect(typeof result).toBe("number");
        expect(Number.isFinite(result)).toBe(true);
      });
    });

    it("should return consistent number types for all font size methods", () => {
      const methods = [
        responsiveFontSize.title(),
        responsiveFontSize.cardTitle(),
        responsiveFontSize.body(),
        responsiveFontSize.small(),
      ];

      methods.forEach((result) => {
        expect(typeof result).toBe("number");
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThan(0);
      });
    });

    it("should return consistent number types for all icon size methods", () => {
      const methods = [
        responsiveIconSize.small(),
        responsiveIconSize.medium(),
        responsiveIconSize.large(),
      ];

      methods.forEach((result) => {
        expect(typeof result).toBe("number");
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThan(0);
      });
    });

    it("should return consistent number types for all border radius methods", () => {
      const methods = [
        responsiveBorderRadius.card(),
        responsiveBorderRadius.large(),
      ];

      methods.forEach((result) => {
        expect(typeof result).toBe("number");
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThan(0);
      });
    });

    it("should return consistent number types for all grid methods", () => {
      const methods = [
        responsiveGrid.columns(),
        responsiveGrid.itemWidth(),
        responsiveGrid.gap(),
      ];

      methods.forEach((result) => {
        expect(typeof result).toBe("number");
        expect(Number.isFinite(result)).toBe(true);
      });
    });
  });

  describe("dateUtils.ts - Date Utility Functions", () => {
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

    describe("formatDateShort", () => {
      it("should return string type", () => {
        const result = formatDateShort(Date.now());
        expect(typeof result).toBe("string");
      });

      it("should infer correct return type", () => {
        const result: string = formatDateShort(Date.now());
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
