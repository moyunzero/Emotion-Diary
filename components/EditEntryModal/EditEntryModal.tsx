/**
 * EditEntryModal 壳层：Modal、KeyboardAvoidingView、安全区、组合 EditEntryForm
 */
import { Edit, X } from 'lucide-react-native';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EditEntryModalProps } from '../../types/components';
import AppIcon from '../icons/AppIcon';
import EditEntryForm from './EditEntryForm';
import { styles } from './EditEntryModal.styles';

const EditEntryModalComponent: React.FC<EditEntryModalProps> = ({
  entry,
  visible,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <AppIcon name={Edit} size={20} color="#1F2937" />
              <Text style={styles.headerTitle}>编辑记录</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
        >
          <EditEntryForm
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
