/**
 * Standardized Component Prop Type Definitions
 * 
 * This file contains TypeScript interfaces for component props with proper
 * StyleProp types to ensure type safety throughout the application.
 * 
 * Requirements: 2.1, 2.2
 */

import { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { Edge } from 'react-native-safe-area-context';
import { MoodEntry, MoodLevel } from '../types';

/**
 * Avatar Component Props
 * Displays user profile images with fallback placeholder
 */
export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  placeholder?: string; // Optional blurhash or placeholder image
}

/**
 * EntryCard Component Props
 * Renders individual emotion diary entries in lists
 */
export interface EntryCardProps {
  entry: MoodEntry;
  onBurn?: (id: string) => void;
}

/**
 * MoodForm Component Props
 * Form component for creating and editing emotion diary entries
 */
export interface MoodFormProps {
  // Controlled component values
  moodLevel: MoodLevel;
  content: string;
  deadline: string;
  isCustomDeadline: boolean;
  customDeadlineText: string;
  selectedPeople: string[];
  selectedTriggers: string[];
  // Custom tag options
  customPeopleOptions: string[];
  customTriggerOptions: string[];
  allPeople: string[];
  allTriggers: string[];
  // Callback functions
  onMoodLevelChange: (level: MoodLevel) => void;
  onContentChange: (content: string) => void;
  onDeadlineChange: (deadline: string) => void;
  onCustomDeadlineChange: (isCustom: boolean, text: string) => void;
  onPeopleToggle: (item: string) => void;
  onTriggersToggle: (item: string) => void;
  onAddCustomPerson: (value: string) => Promise<string[]>;
  onAddCustomTrigger: (value: string) => Promise<string[]>;
  onDeleteCustomPerson: (value: string) => Promise<string[]>;
  onDeleteCustomTrigger: (value: string) => Promise<string[]>;
  onSubmit: () => void;
}

/**
 * ScreenContainer Component Props
 * Unified container for screens with SafeArea and keyboard handling
 */
export interface ScreenContainerProps {
  children: React.ReactNode;
  edges?: Edge[];
  scrollable?: boolean;
  keyboardAware?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Dashboard Header Component Props
 * Header for the dashboard list with filter controls
 */
export interface DashboardHeaderProps {
  filter: 'all' | 'active' | 'resolved' | 'burned';
  count: number;
  onFilterPress: () => void;
  isFilterOpen: boolean;
}

/**
 * AppImage Component Props
 * Unified image component using expo-image with caching
 */
export interface AppImageProps {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: string;
  onError?: () => void;
}

/**
 * TagSelector Component Props
 * Component for selecting and managing tags (people, triggers)
 */
export interface TagSelectorProps {
  title: string;
  options: string[];
  selected: string[];
  customOptions: string[];
  onToggle: (item: string) => void;
  onAdd: (value: string) => void;
  onDelete: (value: string) => void;
  prefix?: string;
  isLastSection?: boolean;
}

/**
 * Toast Component Props
 * Toast notification component
 */
export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  visible?: boolean;
  onHide?: () => void;
}

/**
 * EditEntryModal Component Props
 * Modal for editing existing emotion diary entries
 */
export interface EditEntryModalProps {
  entry: MoodEntry;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * BurnAnimation Component Props
 * Animation component for burning effect
 */
export interface BurnAnimationProps {
  snapshot: any; // SkImage from @shopify/react-native-skia
  width: number;
  height: number;
  onComplete: () => void;
}

/**
 * CompanionDaysCard Component Props
 * Card displaying companion days milestone
 */
export interface CompanionDaysCardProps {
  onPress: () => void;
}

/**
 * CompanionDaysModal Component Props
 * Modal displaying companion days details
 */
export interface CompanionDaysModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * AddTagInput Component Props
 * Input component for adding custom tags
 */
export interface AddTagInputProps {
  onAdd: (value: string) => void;
}

/**
 * AshIcon Component Props
 * Icon component for burned entries
 */
export interface AshIconProps {
  size?: number;
  opacity?: number;
  color?: string;
}

/**
 * ErrorBoundary Component Props
 * Error boundary wrapper component
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
