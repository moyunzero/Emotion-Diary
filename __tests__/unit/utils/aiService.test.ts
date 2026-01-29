import { MoodEntry, MoodLevel } from '../../../types';
import { predictEmotionTrend } from '../../../utils/aiService';

describe('aiService - Emoji Removal', () => {
  describe('predictEmotionTrend', () => {
    it('should not include emoji characters in warning messages', async () => {
      // Create mock entries that will trigger high and medium risk warnings
      const mockEntries: MoodEntry[] = [
        {
          id: '1',
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
          moodLevel: MoodLevel.FURIOUS,
          content: 'Test entry',
          deadline: '今天',
          people: ['伴侣'],
          triggers: ['沟通'],
          status: 'pending',
        },
        {
          id: '2',
          timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
          moodLevel: MoodLevel.FURIOUS,
          content: 'Test entry 2',
          deadline: '今天',
          people: ['伴侣'],
          triggers: ['沟通'],
          status: 'pending',
        },
        {
          id: '3',
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
          moodLevel: MoodLevel.ANNOYED,
          content: 'Test entry 3',
          deadline: '今天',
          people: ['伴侣'],
          triggers: ['沟通'],
          status: 'pending',
        },
      ];

      const forecast = await predictEmotionTrend(mockEntries, 7);

      // Check that warning messages don't contain emoji
      forecast.warnings.forEach(warning => {
        // Check for common emoji patterns
        expect(warning.message).not.toMatch(/⚠️/);
        expect(warning.message).not.toMatch(/🌤️/);
        expect(warning.message).not.toMatch(/🌧️/);
        expect(warning.message).not.toMatch(/☀️/);
        expect(warning.message).not.toMatch(/🎊/);
        
        // Verify message still contains meaningful text
        expect(warning.message.length).toBeGreaterThan(0);
      });
    });

    it('should maintain weather metaphor meaning without emoji', async () => {
      const mockEntries: MoodEntry[] = [
        {
          id: '1',
          timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
          moodLevel: MoodLevel.FURIOUS,
          content: 'Test',
          deadline: '今天',
          people: ['伴侣'],
          triggers: ['沟通'],
          status: 'pending',
        },
      ];

      const forecast = await predictEmotionTrend(mockEntries, 3);

      // Verify forecast structure is intact
      expect(forecast).toHaveProperty('predictions');
      expect(forecast).toHaveProperty('warnings');
      expect(forecast).toHaveProperty('summary');
      
      // Verify predictions contain risk levels (weather metaphor preserved)
      forecast.predictions.forEach(prediction => {
        expect(['high', 'medium', 'low']).toContain(prediction.riskLevel);
      });
    });

    it('should generate warnings with text descriptions instead of emoji', async () => {
      const mockEntries: MoodEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        timestamp: Date.now() - i * 24 * 60 * 60 * 1000,
        moodLevel: i % 2 === 0 ? MoodLevel.FURIOUS : MoodLevel.ANNOYED,
        content: `Test entry ${i}`,
        deadline: '今天',
        people: ['伴侣'],
        triggers: ['沟通'],
        status: 'pending' as const,
      }));

      const forecast = await predictEmotionTrend(mockEntries, 7);

      // If there are warnings, verify they contain descriptive text
      if (forecast.warnings.length > 0) {
        forecast.warnings.forEach(warning => {
          // Should contain date
          expect(warning.message).toMatch(/\d{4}-\d{2}-\d{2}/);
          
          // Should contain descriptive text (not just emoji)
          const textWithoutDate = warning.message.replace(/\d{4}-\d{2}-\d{2}/, '').trim();
          expect(textWithoutDate.length).toBeGreaterThan(5);
        });
      }
    });
  });
});
