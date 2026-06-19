/**
 * EditEntryModal 壳层：Modal、KeyboardAvoidingView、安全区、组合 EntryEditor（编辑模式）
 */
import { Edit } from 'lucide-react-native';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { EditEntryModalProps } from '../../types/components';
import { EntryEditor } from '../EntryEditor';
import { StackScreenHeader } from '../StackScreenHeader';
import AppIcon from '../icons/AppIcon';
import { styles } from './EditEntryModal.styles';

const EditEntryModalComponent: React.FC<EditEntryModalProps> = ({
  entry,
  visible,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('record');
  const editTitle = t('screen.editTitle');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <StackScreenHeader
          leading="close"
          onBack={onClose}
          headerCenter={
            <View style={styles.headerTitleContainer}>
              <AppIcon name={Edit} size={20} color="#1F2937" />
              <Text style={styles.headerTitle}>{editTitle}</Text>
            </View>
          }
          titleAccessibilityLabel={editTitle}
          style={[styles.modalStackHeader, { paddingTop: insets.top }]}
        />

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
        >
          <EntryEditor
            mode="edit"
            presentation="embedded"
            entry={entry}
            visible={visible}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const EditEntryModal = React.memo(EditEntryModalComponent);

export default EditEntryModal;
