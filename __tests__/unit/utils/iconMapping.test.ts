/**
 * Icon mapping utilities unit tests
 * Tests the emoji-to-icon mapping infrastructure
 */

import {
    CloudRain,
    Crown,
    Edit,
    Frown,
    Gem,
    Heart,
    Moon,
    PartyPopper,
    Sparkles,
    Sprout,
    Star,
    Sun,
} from 'lucide-react-native';
import {
    EMOJI_ICON_MAP,
    getAllMappedEmojis,
    getIconByEmoji,
    getIconNameByEmoji,
    hasIconMapping,
} from '../../../utils/iconMapping';

describe('iconMapping', () => {
  describe('EMOJI_ICON_MAP', () => {
    it('should contain all required emoji mappings', () => {
      const requiredEmojis = [
        '😔', '🌱', '🌙', '💎', '🎉', '⭐', '👑',
        '💫', '💙', '🎊', '🌤️', '🌧️', '☀️', '✎'
      ];
      
      requiredEmojis.forEach(emoji => {
        expect(EMOJI_ICON_MAP[emoji]).toBeDefined();
        expect(EMOJI_ICON_MAP[emoji].icon).toBeDefined();
        expect(EMOJI_ICON_MAP[emoji].name).toBeDefined();
        expect(EMOJI_ICON_MAP[emoji].semanticMeaning).toBeDefined();
      });
    });

    it('should have correct structure for each mapping', () => {
      Object.entries(EMOJI_ICON_MAP).forEach(([emoji, mapping]) => {
        expect(typeof emoji).toBe('string');
        expect(mapping.icon).toBeDefined(); // LucideIcon is a component
        expect(typeof mapping.name).toBe('string');
        expect(typeof mapping.semanticMeaning).toBe('string');
      });
    });
  });

  describe('getIconByEmoji', () => {
    it('should return Frown icon for 😔 emoji', () => {
      const icon = getIconByEmoji('😔');
      expect(icon).toBe(Frown);
    });

    it('should return Sprout icon for 🌱 emoji', () => {
      const icon = getIconByEmoji('🌱');
      expect(icon).toBe(Sprout);
    });

    it('should return Moon icon for 🌙 emoji', () => {
      const icon = getIconByEmoji('🌙');
      expect(icon).toBe(Moon);
    });

    it('should return Gem icon for 💎 emoji', () => {
      const icon = getIconByEmoji('💎');
      expect(icon).toBe(Gem);
    });

    it('should return PartyPopper icon for 🎉 emoji', () => {
      const icon = getIconByEmoji('🎉');
      expect(icon).toBe(PartyPopper);
    });

    it('should return Star icon for ⭐ emoji', () => {
      const icon = getIconByEmoji('⭐');
      expect(icon).toBe(Star);
    });

    it('should return Crown icon for 👑 emoji', () => {
      const icon = getIconByEmoji('👑');
      expect(icon).toBe(Crown);
    });

    it('should return Sparkles icon for 💫 emoji', () => {
      const icon = getIconByEmoji('💫');
      expect(icon).toBe(Sparkles);
    });

    it('should return Heart icon for 💙 emoji', () => {
      const icon = getIconByEmoji('💙');
      expect(icon).toBe(Heart);
    });

    it('should return Sun icon for ☀️ emoji', () => {
      const icon = getIconByEmoji('☀️');
      expect(icon).toBe(Sun);
    });

    it('should return CloudRain icon for 🌧️ emoji', () => {
      const icon = getIconByEmoji('🌧️');
      expect(icon).toBe(CloudRain);
    });

    it('should return Edit icon for ✎ emoji', () => {
      const icon = getIconByEmoji('✎');
      expect(icon).toBe(Edit);
    });

    it('should return null for unmapped emoji', () => {
      const icon = getIconByEmoji('🦄');
      expect(icon).toBeNull();
    });

    it('should return null for empty string', () => {
      const icon = getIconByEmoji('');
      expect(icon).toBeNull();
    });

    it('should return null for non-emoji string', () => {
      const icon = getIconByEmoji('hello');
      expect(icon).toBeNull();
    });
  });

  describe('getIconNameByEmoji', () => {
    it('should return "Frown" for 😔 emoji', () => {
      const name = getIconNameByEmoji('😔');
      expect(name).toBe('Frown');
    });

    it('should return "Sprout" for 🌱 emoji', () => {
      const name = getIconNameByEmoji('🌱');
      expect(name).toBe('Sprout');
    });

    it('should return "PartyPopper" for 🎉 emoji', () => {
      const name = getIconNameByEmoji('🎉');
      expect(name).toBe('PartyPopper');
    });

    it('should return "Sparkles" for 💫 emoji', () => {
      const name = getIconNameByEmoji('💫');
      expect(name).toBe('Sparkles');
    });

    it('should return null for unmapped emoji', () => {
      const name = getIconNameByEmoji('🦄');
      expect(name).toBeNull();
    });

    it('should return null for empty string', () => {
      const name = getIconNameByEmoji('');
      expect(name).toBeNull();
    });
  });

  describe('hasIconMapping', () => {
    it('should return true for mapped emoji 😔', () => {
      expect(hasIconMapping('😔')).toBe(true);
    });

    it('should return true for mapped emoji 🌱', () => {
      expect(hasIconMapping('🌱')).toBe(true);
    });

    it('should return true for mapped emoji 💫', () => {
      expect(hasIconMapping('💫')).toBe(true);
    });

    it('should return true for mapped emoji ✎', () => {
      expect(hasIconMapping('✎')).toBe(true);
    });

    it('should return false for unmapped emoji', () => {
      expect(hasIconMapping('🦄')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasIconMapping('')).toBe(false);
    });

    it('should return false for non-emoji string', () => {
      expect(hasIconMapping('hello')).toBe(false);
    });

    it('should return true for all milestone emojis', () => {
      const milestoneEmojis = ['🌱', '🌙', '💎', '🎉', '⭐', '👑'];
      milestoneEmojis.forEach(emoji => {
        expect(hasIconMapping(emoji)).toBe(true);
      });
    });

    it('should return true for all weather emojis', () => {
      const weatherEmojis = ['🌤️', '🌧️', '☀️'];
      weatherEmojis.forEach(emoji => {
        expect(hasIconMapping(emoji)).toBe(true);
      });
    });
  });

  describe('getAllMappedEmojis', () => {
    it('should return an array of all mapped emojis', () => {
      const emojis = getAllMappedEmojis();
      expect(Array.isArray(emojis)).toBe(true);
      expect(emojis.length).toBeGreaterThan(0);
    });

    it('should include all required emojis', () => {
      const emojis = getAllMappedEmojis();
      expect(emojis).toContain('😔');
      expect(emojis).toContain('🌱');
      expect(emojis).toContain('💫');
      expect(emojis).toContain('✎');
    });

    it('should include all milestone emojis', () => {
      const emojis = getAllMappedEmojis();
      const milestoneEmojis = ['🌱', '🌙', '💎', '🎉', '⭐', '👑'];
      milestoneEmojis.forEach(emoji => {
        expect(emojis).toContain(emoji);
      });
    });

    it('should include all weather emojis', () => {
      const emojis = getAllMappedEmojis();
      const weatherEmojis = ['🌤️', '🌧️', '☀️'];
      weatherEmojis.forEach(emoji => {
        expect(emojis).toContain(emoji);
      });
    });

    it('should return at least 14 emojis', () => {
      const emojis = getAllMappedEmojis();
      // We have: 😔, 🌱, 🌙, 💎, 🎉, ⭐, 👑, 💫, 💙, 🎊, 🌤️, 🌧️, ☀️, ✎
      expect(emojis.length).toBeGreaterThanOrEqual(14);
    });

    it('should not contain duplicate emojis', () => {
      const emojis = getAllMappedEmojis();
      const uniqueEmojis = [...new Set(emojis)];
      expect(emojis.length).toBe(uniqueEmojis.length);
    });
  });

  describe('semantic meanings', () => {
    it('should have meaningful semantic descriptions', () => {
      Object.entries(EMOJI_ICON_MAP).forEach(([emoji, mapping]) => {
        expect(mapping.semanticMeaning.length).toBeGreaterThan(0);
        expect(mapping.semanticMeaning).not.toBe('');
      });
    });

    it('should describe error emoji appropriately', () => {
      const meaning = EMOJI_ICON_MAP['😔'].semanticMeaning;
      expect(meaning.toLowerCase()).toMatch(/sad|error|disappoint/);
    });

    it('should describe milestone emojis appropriately', () => {
      expect(EMOJI_ICON_MAP['🌱'].semanticMeaning.toLowerCase()).toMatch(/growth|beginning|milestone/);
      expect(EMOJI_ICON_MAP['💎'].semanticMeaning.toLowerCase()).toMatch(/achievement|precious|milestone/);
      expect(EMOJI_ICON_MAP['👑'].semanticMeaning.toLowerCase()).toMatch(/achievement|ultimate/);
    });
  });
});
