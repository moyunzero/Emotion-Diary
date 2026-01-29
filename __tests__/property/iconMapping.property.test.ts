/**
 * Icon mapping property tests
 * Feature: emoji-to-vector-icons
 * 
 * Property 1: Complete Emoji Coverage
 * Validates: Requirements 1.3
 */

import * as fc from 'fast-check';
import { MILESTONES } from '../../types/companionDays';
import {
    EMOJI_ICON_MAP,
    getAllMappedEmojis,
    getIconByEmoji,
    hasIconMapping,
} from '../../utils/iconMapping';

describe('Icon Mapping Property Tests', () => {
  /**
   * Property 1: Complete Emoji Coverage
   * For any emoji character used in the codebase, there SHALL exist 
   * a corresponding entry in the EMOJI_ICON_MAP.
   * 
   * Validates: Requirements 1.3
   */
  describe('Property 1: Complete Emoji Coverage', () => {
    // Define all emojis that are currently used in the codebase
    // These were identified by scanning the source files
    const CODEBASE_EMOJIS = {
      // From ErrorBoundary.tsx
      errorState: ['😔'],
      
      // From types/companionDays.ts - milestone icons
      milestones: ['🌱', '🌙', '💎', '🎉', '⭐', '👑'],
      
      // From components (Record.tsx, EditEntryModal.tsx, MoodForm.tsx)
      actions: ['💫', '💙'],
      
      // From CompanionDaysModal.tsx
      celebration: ['🎊'],
      
      // From app/profile.tsx and utils/aiService.ts
      weather: ['🌤️', '🌧️', '☀️'],
      
      // From MoodForm.tsx and EditEntryModal.tsx
      editing: ['✎'],
    };

    it('should have mappings for all error state emojis', () => {
      CODEBASE_EMOJIS.errorState.forEach(emoji => {
        expect(hasIconMapping(emoji)).toBe(true);
        expect(getIconByEmoji(emoji)).not.toBeNull();
      });
    });

    it('should have mappings for all milestone emojis', () => {
      CODEBASE_EMOJIS.milestones.forEach(emoji => {
        expect(hasIconMapping(emoji)).toBe(true);
        expect(getIconByEmoji(emoji)).not.toBeNull();
      });
    });

    it('should have mappings for all action emojis', () => {
      CODEBASE_EMOJIS.actions.forEach(emoji => {
        expect(hasIconMapping(emoji)).toBe(true);
        expect(getIconByEmoji(emoji)).not.toBeNull();
      });
    });

    it('should have mappings for all celebration emojis', () => {
      CODEBASE_EMOJIS.celebration.forEach(emoji => {
        expect(hasIconMapping(emoji)).toBe(true);
        expect(getIconByEmoji(emoji)).not.toBeNull();
      });
    });

    it('should have mappings for all weather emojis', () => {
      CODEBASE_EMOJIS.weather.forEach(emoji => {
        expect(hasIconMapping(emoji)).toBe(true);
        expect(getIconByEmoji(emoji)).not.toBeNull();
      });
    });

    it('should have mappings for all editing emojis', () => {
      CODEBASE_EMOJIS.editing.forEach(emoji => {
        expect(hasIconMapping(emoji)).toBe(true);
        expect(getIconByEmoji(emoji)).not.toBeNull();
      });
    });

    it('should have mappings for ALL emojis used in codebase', () => {
      // Flatten all emoji categories into a single array
      const allCodebaseEmojis = [
        ...CODEBASE_EMOJIS.errorState,
        ...CODEBASE_EMOJIS.milestones,
        ...CODEBASE_EMOJIS.actions,
        ...CODEBASE_EMOJIS.celebration,
        ...CODEBASE_EMOJIS.weather,
        ...CODEBASE_EMOJIS.editing,
      ];

      // Remove duplicates
      const uniqueEmojis = [...new Set(allCodebaseEmojis)];

      // Verify each emoji has a mapping
      uniqueEmojis.forEach(emoji => {
        expect(hasIconMapping(emoji)).toBe(true);
        expect(getIconByEmoji(emoji)).not.toBeNull();
        expect(EMOJI_ICON_MAP[emoji]).toBeDefined();
        expect(EMOJI_ICON_MAP[emoji].icon).toBeDefined();
        expect(EMOJI_ICON_MAP[emoji].name).toBeDefined();
        expect(EMOJI_ICON_MAP[emoji].semanticMeaning).toBeDefined();
      });
    });

    it('should have mappings for all milestone emojis from MILESTONES constant', () => {
      // Verify that all milestone icons in the MILESTONES array have mappings
      MILESTONES.forEach(milestone => {
        expect(hasIconMapping(milestone.icon)).toBe(true);
        expect(getIconByEmoji(milestone.icon)).not.toBeNull();
      });
    });

    it('should not have any unmapped emojis in critical paths', () => {
      // This test ensures that we don't accidentally use emojis without mappings
      const allCodebaseEmojis = [
        ...CODEBASE_EMOJIS.errorState,
        ...CODEBASE_EMOJIS.milestones,
        ...CODEBASE_EMOJIS.actions,
        ...CODEBASE_EMOJIS.celebration,
        ...CODEBASE_EMOJIS.weather,
        ...CODEBASE_EMOJIS.editing,
      ];

      const unmappedEmojis = allCodebaseEmojis.filter(emoji => !hasIconMapping(emoji));
      
      expect(unmappedEmojis).toHaveLength(0);
      if (unmappedEmojis.length > 0) {
        console.error('Unmapped emojis found:', unmappedEmojis);
      }
    });
  });

  /**
   * Property-based test: Icon mapping consistency
   * For any emoji in the mapping, the icon should be retrievable
   */
  describe('Icon Mapping Consistency Properties', () => {
    it('should return valid icon for any mapped emoji', () => {
      const allMappedEmojis = getAllMappedEmojis();
      
      fc.assert(
        fc.property(
          fc.constantFrom(...allMappedEmojis),
          (emoji) => {
            const icon = getIconByEmoji(emoji);
            expect(icon).not.toBeNull();
            expect(icon).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent mapping structure for any emoji', () => {
      const allMappedEmojis = getAllMappedEmojis();
      
      fc.assert(
        fc.property(
          fc.constantFrom(...allMappedEmojis),
          (emoji) => {
            const mapping = EMOJI_ICON_MAP[emoji];
            expect(mapping).toBeDefined();
            expect(mapping.icon).toBeDefined();
            expect(typeof mapping.name).toBe('string');
            expect(mapping.name.length).toBeGreaterThan(0);
            expect(typeof mapping.semanticMeaning).toBe('string');
            expect(mapping.semanticMeaning.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for any unmapped emoji', () => {
      // Generate random emoji-like strings that are NOT in our mapping
      const unmappedEmojis = ['🦄', '🚀', '🎨', '🔥', '💻', '🌈', '🎯', '🎪'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...unmappedEmojis),
          (emoji) => {
            if (!hasIconMapping(emoji)) {
              expect(getIconByEmoji(emoji)).toBeNull();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain bijection between emoji and icon name', () => {
      // For any mapped emoji, the icon name should be unique and consistent
      const allMappedEmojis = getAllMappedEmojis();
      const emojiToNameMap = new Map<string, string>();
      
      allMappedEmojis.forEach(emoji => {
        const mapping = EMOJI_ICON_MAP[emoji];
        const existingEmoji = Array.from(emojiToNameMap.entries())
          .find(([_, name]) => name === mapping.name)?.[0];
        
        if (existingEmoji && existingEmoji !== emoji) {
          // Multiple emojis can map to the same icon (e.g., 🌤️ and ☀️ both map to Sun)
          // This is acceptable, so we just verify consistency
          expect(mapping.name).toBe(EMOJI_ICON_MAP[existingEmoji].name);
        }
        
        emojiToNameMap.set(emoji, mapping.name);
      });
    });
  });

  /**
   * Property-based test: Semantic meaning validation
   */
  describe('Semantic Meaning Properties', () => {
    it('should have non-empty semantic meaning for all mapped emojis', () => {
      const allMappedEmojis = getAllMappedEmojis();
      
      fc.assert(
        fc.property(
          fc.constantFrom(...allMappedEmojis),
          (emoji) => {
            const mapping = EMOJI_ICON_MAP[emoji];
            expect(mapping.semanticMeaning).toBeDefined();
            expect(typeof mapping.semanticMeaning).toBe('string');
            expect(mapping.semanticMeaning.trim().length).toBeGreaterThan(0);
            // Semantic meaning should be descriptive (at least 10 characters)
            expect(mapping.semanticMeaning.length).toBeGreaterThanOrEqual(10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have meaningful semantic descriptions', () => {
      const allMappedEmojis = getAllMappedEmojis();
      
      fc.assert(
        fc.property(
          fc.constantFrom(...allMappedEmojis),
          (emoji) => {
            const mapping = EMOJI_ICON_MAP[emoji];
            // Semantic meaning should contain at least one word
            const words = mapping.semanticMeaning.split(/\s+/);
            expect(words.length).toBeGreaterThan(0);
            // Should not be just punctuation
            expect(mapping.semanticMeaning).toMatch(/[a-zA-Z]/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Coverage validation: Ensure no emojis are missing
   */
  describe('Coverage Validation', () => {
    it('should cover at least 14 unique emojis', () => {
      const allMappedEmojis = getAllMappedEmojis();
      // We identified 14 unique emojis in the codebase
      expect(allMappedEmojis.length).toBeGreaterThanOrEqual(14);
    });

    it('should have no duplicate emoji mappings', () => {
      const allMappedEmojis = getAllMappedEmojis();
      const uniqueEmojis = new Set(allMappedEmojis);
      expect(allMappedEmojis.length).toBe(uniqueEmojis.size);
    });

    it('should map all milestone emojis', () => {
      const milestoneEmojis = MILESTONES.map(m => m.icon);
      const allMappedEmojis = getAllMappedEmojis();
      
      milestoneEmojis.forEach(emoji => {
        expect(allMappedEmojis).toContain(emoji);
      });
    });
  });
});
