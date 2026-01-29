import { Plus, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * AddTagInput 组件
 * 用于添加自定义标签的输入组件
 * 
 * @param onAdd - 添加新标签的回调函数
 */
interface AddTagInputProps {
  onAdd: (value: string) => void;
}

const AddTagInput: React.FC<AddTagInputProps> = ({ onAdd }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState('');
  const isSubmittingRef = useRef(false);

  const handleAdd = () => {
    if (val.trim() && !isSubmittingRef.current) {
      isSubmittingRef.current = true;
      onAdd(val.trim());
      setVal('');
      setIsEditing(false);
      // 重置标志
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 100);
    } else if (!val.trim()) {
      // 空值时直接关闭
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    isSubmittingRef.current = true;
    setIsEditing(false);
    setVal('');
    Keyboard.dismiss();
    // 重置标志
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 100);
  };

  const handleBlur = () => {
    // 延迟执行，让 onSubmitEditing 或 Cancel 先执行
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
          placeholder="添加新标签..."
          placeholderTextColor="#9CA3AF"
          style={styles.addTagInput}
          maxLength={20}
        />
        <TouchableOpacity onPress={handleCancel} style={styles.addTagCancel}>
          <X size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => setIsEditing(true)}
      style={styles.addTagButton}
    >
      <Plus size={12} color="#6B7280" />
      <Text style={styles.addTagText}>自定义</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
});

export default AddTagInput;



