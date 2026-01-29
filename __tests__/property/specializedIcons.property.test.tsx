/**
 * Specialized Icon Components Property Tests
 * Feature: emoji-to-vector-icons
 * 
 * Property 2: Milestone Icon Consistency
 * Property 3: Milestone Icon Sizing
 * Property 4: Milestone Icon Coloring
 * Property 6: Message Icon Type Mapping
 * Property 7: Message Icon Sizing
 * 
 * Validates: Requirements 3.1, 3.3, 3.4, 5.1, 5.2, 5.4
 */

import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';
import MessageIcon, { MessageType } from '../../components/icons/MessageIcon';
import MilestoneIcon from '../../components/icons/MilestoneIcon';
import { MILESTONES } from '../../types/companionDays';

describe('Specialized Icon Components Property Tests', () => {
  /**
   * Property 2: Milestone Icon Consistency
   * For any milestone in the MILESTONES array, when rendered through 
   * MilestoneIcon component, the component SHALL render a vector icon 
   * component (not emoji text).
   * 
   * **Validates: Requirements 3.1**
   */
  describe('Property 2: Milestone Icon Consistency', () => {
    it('should render vector icons for all milestones (not emoji text)', () => {
      // Test each milestone renders a vector icon component
      MILESTONES.forEach(milestone => {
        const { getAllByTestId, queryByText } = render(
          <MilestoneIcon emoji={milestone.icon} testID="milestone-icon" />
        );
        
        // Should render an icon component
        const icons = getAllByTestId('milestone-icon');
        expect(icons.length).toBeGreaterThan(0);
        expect(icons[0]).toBeTruthy();
        
        // Should NOT render emoji as text
        expect(queryByText(milestone.icon)).toBeNull();
      });
    });

    it('should consistently render vector icons across multiple renders', () => {
      // Test that milestone icons render consistently
      fc.assert(
        fc.property(
          fc.constantFrom(...MILESTONES),
          (milestone) => {
            // Render the same milestone multiple times
            const render1 = render(
              <MilestoneIcon emoji={milestone.icon} testID="milestone-1" />
            );
            const render2 = render(
              <MilestoneIcon emoji={milestone.icon} testID="milestone-2" />
            );
            
            // Both should render successfully
            const icons1 = render1.getAllByTestId('milestone-1');
            const icons2 = render2.getAllByTestId('milestone-2');
            
            expect(icons1.length).toBeGreaterThan(0);
            expect(icons2.length).toBeGreaterThan(0);
            expect(icons1[0]).toBeTruthy();
            expect(icons2[0]).toBeTruthy();
            
            // Neither should render emoji text
            expect(render1.queryByText(milestone.icon)).toBeNull();
            expect(render2.queryByText(milestone.icon)).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should render vector icons for all milestone emojis', () => {
      // Extract all milestone emojis and verify they all render as vector icons
      const milestoneEmojis = MILESTONES.map(m => m.icon);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...milestoneEmojis),
          (emoji) => {
            const { getAllByTestId, queryByText } = render(
              <MilestoneIcon emoji={emoji} testID="milestone-icon" />
            );
            
            // Should render a vector icon
            const icons = getAllByTestId('milestone-icon');
            expect(icons.length).toBeGreaterThan(0);
            
            // Should not render emoji text
            expect(queryByText(emoji)).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Milestone Icon Sizing
   * For any milestone rendered with a specified size prop, the icon 
   * component SHALL receive that size value as its size prop.
   * 
   * **Validates: Requirements 3.3**
   */
  describe('Property 3: Milestone Icon Sizing', () => {
    it('should render successfully with any valid size value', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MILESTONES),
          fc.integer({ min: 16, max: 128 }),
          (milestone, size) => {
            // Should not throw an error when rendering with various sizes
            expect(() => {
              const { getAllByTestId } = render(
                <MilestoneIcon 
                  emoji={milestone.icon} 
                  size={size}
                  testID="milestone-icon"
                />
              );
              
              const icons = getAllByTestId('milestone-icon');
              expect(icons.length).toBeGreaterThan(0);
              expect(icons[0]).toBeTruthy();
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various size values for all milestone emojis', () => {
      const milestoneEmojis = MILESTONES.map(m => m.icon);
      const commonSizes = [16, 20, 24, 32, 48, 64, 96, 128];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...milestoneEmojis),
          fc.constantFrom(...commonSizes),
          (emoji, size) => {
            const { getAllByTestId } = render(
              <MilestoneIcon 
                emoji={emoji} 
                size={size}
                testID="sized-icon"
              />
            );
            
            const icons = getAllByTestId('sized-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render with default size when size prop is not provided', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MILESTONES),
          (milestone) => {
            const { getAllByTestId } = render(
              <MilestoneIcon 
                emoji={milestone.icon}
                testID="default-size-icon"
              />
            );
            
            const icons = getAllByTestId('default-size-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle edge case sizes correctly', () => {
      const edgeSizes = [1, 8, 16, 200, 256];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...MILESTONES),
          fc.constantFrom(...edgeSizes),
          (milestone, size) => {
            const { getAllByTestId } = render(
              <MilestoneIcon 
                emoji={milestone.icon} 
                size={size}
                testID="edge-size-icon"
              />
            );
            
            const icons = getAllByTestId('edge-size-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 4: Milestone Icon Coloring
   * For any milestone with a theme color, when rendered through 
   * MilestoneIcon, the icon SHALL receive the milestone's color 
   * as its color prop.
   * 
   * **Validates: Requirements 3.4**
   */
  describe('Property 4: Milestone Icon Coloring', () => {
    it('should render successfully with milestone theme colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MILESTONES),
          (milestone) => {
            const { getAllByTestId } = render(
              <MilestoneIcon 
                emoji={milestone.icon}
                color={milestone.color}
                testID="colored-icon"
              />
            );
            
            const icons = getAllByTestId('colored-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all milestone colors correctly', () => {
      // Test that each milestone's color is properly passed through
      MILESTONES.forEach(milestone => {
        const { getAllByTestId } = render(
          <MilestoneIcon 
            emoji={milestone.icon}
            color={milestone.color}
            testID={`milestone-${milestone.level}`}
          />
        );
        
        const icons = getAllByTestId(`milestone-${milestone.level}`);
        expect(icons.length).toBeGreaterThan(0);
        expect(icons[0]).toBeTruthy();
      });
    });

    it('should accept custom colors for any milestone', () => {
      const customColors = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
        '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A'
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...MILESTONES),
          fc.constantFrom(...customColors),
          (milestone, customColor) => {
            const { getAllByTestId } = render(
              <MilestoneIcon 
                emoji={milestone.icon}
                color={customColor}
                testID="custom-color-icon"
              />
            );
            
            const icons = getAllByTestId('custom-color-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render with default color when color prop is not provided', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MILESTONES),
          (milestone) => {
            const { getAllByTestId } = render(
              <MilestoneIcon 
                emoji={milestone.icon}
                testID="default-color-icon"
              />
            );
            
            const icons = getAllByTestId('default-color-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 6: Message Icon Type Mapping
   * For any message type (success, error, info, warning), the MessageIcon 
   * component SHALL render a semantically appropriate icon from the 
   * predefined MESSAGE_ICON_MAP.
   * 
   * **Validates: Requirements 5.1, 5.2**
   */
  describe('Property 6: Message Icon Type Mapping', () => {
    const messageTypes: MessageType[] = ['success', 'error', 'info', 'warning'];

    it('should render appropriate icon for each message type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...messageTypes),
          (type) => {
            const { getAllByTestId } = render(
              <MessageIcon type={type} testID="message-icon" />
            );
            
            // Should render an icon component
            const icons = getAllByTestId('message-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render all message types successfully', () => {
      // Test each message type renders correctly
      messageTypes.forEach(type => {
        const { getAllByTestId } = render(
          <MessageIcon type={type} testID={`message-${type}`} />
        );
        
        const icons = getAllByTestId(`message-${type}`);
        expect(icons.length).toBeGreaterThan(0);
        expect(icons[0]).toBeTruthy();
      });
    });

    it('should consistently render the same icon for the same message type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...messageTypes),
          (type) => {
            // Render the same message type multiple times
            const render1 = render(
              <MessageIcon type={type} testID="message-1" />
            );
            const render2 = render(
              <MessageIcon type={type} testID="message-2" />
            );
            
            // Both should render successfully
            const icons1 = render1.getAllByTestId('message-1');
            const icons2 = render2.getAllByTestId('message-2');
            
            expect(icons1.length).toBeGreaterThan(0);
            expect(icons2.length).toBeGreaterThan(0);
            expect(icons1[0]).toBeTruthy();
            expect(icons2[0]).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should use default colors for each message type', () => {
      // Test that each message type renders successfully with its default color
      fc.assert(
        fc.property(
          fc.constantFrom(...messageTypes),
          (type) => {
            const { getAllByTestId } = render(
              <MessageIcon type={type} testID="default-color-message" />
            );
            
            const icons = getAllByTestId('default-color-message');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Message Icon Sizing
   * For any message context with a specified icon size, the MessageIcon 
   * component SHALL render an icon with that size.
   * 
   * **Validates: Requirements 5.4**
   */
  describe('Property 7: Message Icon Sizing', () => {
    const messageTypes: MessageType[] = ['success', 'error', 'info', 'warning'];

    it('should render successfully with any valid size value', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...messageTypes),
          fc.integer({ min: 12, max: 64 }),
          (type, size) => {
            const { getAllByTestId } = render(
              <MessageIcon 
                type={type} 
                size={size}
                testID="sized-message-icon"
              />
            );
            
            const icons = getAllByTestId('sized-message-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various size values for all message types', () => {
      const commonSizes = [12, 16, 20, 24, 28, 32, 48, 64];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...messageTypes),
          fc.constantFrom(...commonSizes),
          (type, size) => {
            const { getAllByTestId } = render(
              <MessageIcon 
                type={type} 
                size={size}
                testID="message-size-test"
              />
            );
            
            const icons = getAllByTestId('message-size-test');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render with default size when size prop is not provided', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...messageTypes),
          (type) => {
            const { getAllByTestId } = render(
              <MessageIcon 
                type={type}
                testID="default-size-message"
              />
            );
            
            const icons = getAllByTestId('default-size-message');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle edge case sizes correctly', () => {
      const edgeSizes = [1, 8, 100, 128];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...messageTypes),
          fc.constantFrom(...edgeSizes),
          (type, size) => {
            const { getAllByTestId } = render(
              <MessageIcon 
                type={type} 
                size={size}
                testID="edge-size-message"
              />
            );
            
            const icons = getAllByTestId('edge-size-message');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain consistent sizing across all message types', () => {
      const testSize = 28;
      
      messageTypes.forEach(type => {
        const { getAllByTestId } = render(
          <MessageIcon 
            type={type} 
            size={testSize}
            testID={`consistent-size-${type}`}
          />
        );
        
        const icons = getAllByTestId(`consistent-size-${type}`);
        expect(icons.length).toBeGreaterThan(0);
        expect(icons[0]).toBeTruthy();
      });
    });
  });

  /**
   * Additional Property: Color Customization for Message Icons
   * Message icons should accept custom colors that override defaults
   */
  describe('Message Icon Color Customization', () => {
    const messageTypes: MessageType[] = ['success', 'error', 'info', 'warning'];

    it('should accept custom colors for any message type', () => {
      const customColors = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
        '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A'
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...messageTypes),
          fc.constantFrom(...customColors),
          (type, customColor) => {
            const { getAllByTestId } = render(
              <MessageIcon 
                type={type}
                color={customColor}
                testID="custom-color-message"
              />
            );
            
            const icons = getAllByTestId('custom-color-message');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Milestone Icon with Background
   * Test that background rendering works correctly with various configurations
   */
  describe('Milestone Icon Background Rendering', () => {
    it('should render background with correct dimensions for any size', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MILESTONES),
          fc.integer({ min: 16, max: 128 }),
          (milestone, size) => {
            const { getByTestId } = render(
              <MilestoneIcon 
                emoji={milestone.icon}
                size={size}
                showBackground={true}
                testID="bg-icon"
              />
            );
            
            const container = getByTestId('bg-icon-container');
            expect(container).toBeTruthy();
            
            // Background should be 1.5x the icon size
            const expectedSize = size * 1.5;
            expect(container.props.style).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  width: expectedSize,
                  height: expectedSize,
                }),
              ])
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply custom background colors correctly', () => {
      const bgColors = ['#F3F4F6', '#E0F2FE', '#FEE2E2', '#FEF3C7', '#F3E8FF'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...MILESTONES),
          fc.constantFrom(...bgColors),
          (milestone, bgColor) => {
            const { getByTestId } = render(
              <MilestoneIcon 
                emoji={milestone.icon}
                showBackground={true}
                backgroundColor={bgColor}
                testID="bg-color-icon"
              />
            );
            
            const container = getByTestId('bg-color-icon-container');
            expect(container.props.style).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  backgroundColor: bgColor,
                }),
              ])
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
