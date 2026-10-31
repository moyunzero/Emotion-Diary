/**
 * EditEntryModal 壳层：Modal、安全区、组合 EntryEditor（编辑模式）。
 * 键盘避让由 EntryEditor embedded 用 keyboard height 贴底，不用 KAV
 * （Modal + KAV padding 易在保存钮与键盘间留空洞）。
 */
import { Edit } from 'lucide-react-native';
import React from 'react';
import { Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
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
          backTestID="edit-entry-close"
          headerCenter={
            <View style={styles.headerTitleContainer}>
              <AppIcon name={Edit} size={20} color={COLORS.gray[800]} />
              <Text style={styles.headerTitle}>{editTitle}</Text>
            </View>
          }
          titleAccessibilityLabel={editTitle}
          style={[styles.modalStackHeader, { paddingTop: insets.top }]}
        />

        <View style={styles.keyboardContainer}>
          <EntryEditor
            mode="edit"
            presentation="embedded"
            entry={entry}
            visible={visible}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </View>
      </View>
    </Modal>
  );
};

const EditEntryModal = React.memo(EditEntryModalComponent);

export default EditEntryModal;
