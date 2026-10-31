import { type ColorPalette, DESIGN_TOKENS } from '@/constants/colors';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { Plus, X } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * AddTagInput 组件
 * 用于添加自定义标签的输入组件
 * 
 * @param onAdd - 添加新标签的回调函数
 */
interface AddTagInputProps {
  onAdd: (value: string) => void;
}

function createAddTagInputStyles(colors: ColorPalette) {
  return StyleSheet.create({
    addTagInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addTagInput: {
      width: 80,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 12,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.mood.level3,
      backgroundColor: colors.surface,
    },
    addTagCancel: {
      padding: 4,
    },
    addTagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.gray[300],
      borderStyle: 'dashed',
    },
    addTagText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.gray[400],
    },
  });
}

const AddTagInputComponent: React.FC<AddTagInputProps> = ({ onAdd }) => {
  const { t } = useTranslation('record');
  const { colors } = useThemeStyles();
  const styles = useMemo(() => createAddTagInputStyles(colors), [colors]);
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState('');
  const isSubmittingRef = useRef(false);

  const handleAdd = () => {
    if (val.trim() && !isSubmittingRef.current) {
      isSubmittingRef.current = true;
      onAdd(val.trim());
      setVal('');
      setIsEditing(false);
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 100);
    } else if (!val.trim()) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    isSubmittingRef.current = true;
    setIsEditing(false);
    setVal('');
    Keyboard.dismiss();
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 100);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!isSubmittingRef.current) {
        if (val.trim()) {
          handleAdd();
        } else {
          setIsEditing(false);
          setVal('');
        }
      }
    }, 150);
  };

  if (isEditing) {
    return (
      <View style={styles.addTagInputContainer}>
        <TextInput
          autoFocus
          value={val}
          onChangeText={setVal}
          onBlur={handleBlur}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          blurOnSubmit={true}
          placeholder={t('addTag.placeholder')}
          placeholderTextColor={colors.gray[400]}
          style={styles.addTagInput}
          maxLength={20}
        />
        <TouchableOpacity onPress={handleCancel} style={styles.addTagCancel}>
          <X size={14} color={colors.gray[500]} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => setIsEditing(true)}
      style={styles.addTagButton}
    >
      <Plus size={12} color={colors.gray[500]} />
      <Text style={styles.addTagText}>{t('addTag.custom')}</Text>
    </TouchableOpacity>
  );
};

const AddTagInput = React.memo(AddTagInputComponent);

export default AddTagInput;
