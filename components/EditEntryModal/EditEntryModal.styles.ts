import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  modalStackHeader: {
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text.tertiary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  moodButton: {
    alignItems: 'center',
    opacity: 0.5,
  },
  moodButtonSelected: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  moodIconContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIconContainerSelected: {},
  moodLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: COLORS.text.primary,
    fontWeight: '800',
  },
  contentInput: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.gray[700],
    textAlignVertical: 'top',
  },
  deadlineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  deadlineButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
  },
  deadlineButtonSelected: {
    backgroundColor: COLORS.text.primary,
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text.secondary,
  },
  deadlineTextSelected: {
    color: COLORS.text.inverse,
  },
  deadlineCustomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customDeadlineInput: {
    width: '100%',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.gray[700],
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.background.primary,
    overflow: 'hidden',
  },
  tagSelected: {
    backgroundColor: COLORS.background.page,
    borderColor: '#FCA5A5',
  },
  tagMain: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text.tertiary,
  },
  tagTextSelected: {
    color: COLORS.submit,
  },
  tagDelete: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    opacity: 0.6,
  },
  audioSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[50],
  },
  audioSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  submitContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[50],
    backgroundColor: COLORS.background.primary,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: COLORS.submit,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.shadow.submit,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.inverse,
  },
});
