import { HeartHandshake, MessageCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { generateEmpathyPerspective, generateReconciliationMessage } from '../services/geminiService';
import { Status } from '../types';
const Tools: React.FC = () => {
  const { entries } = useApp();
  const activeEntries = entries.filter(e => e.status === Status.ACTIVE);
  
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [mode, setMode] = useState<'message' | 'empathy' | null>(null);

  const selectedEntry = entries.find(e => e.id === selectedEntryId);

  const handleGenerate = async (type: 'message' | 'empathy') => {
    if (!selectedEntry) return;
    setMode(type);
    setLoading(true);
    setResult('');

    let text = '';
    try {
      if (type === 'message') {
        text = await generateReconciliationMessage(selectedEntry);
      } else {
        text = await generateEmpathyPerspective(selectedEntry);
      }
    } catch (error) {
      text = type === 'message' ? '抱歉，生成失败了，要不你先送个红包？' : '系统正在思考对方的狡辩...';
    }

    setResult(text);
    setLoading(false);
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setString(result);
      Alert.alert('复制成功', '内容已复制到剪贴板');
    } catch (error) {
      Alert.alert('复制失败', '无法复制到剪贴板');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>和解工具箱</Text>
      <Text style={styles.subtitle}>AI 帮你化解尴尬，重修旧好</Text>

      {/* Entry Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>选择一个未处理的事件</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => {
              if (activeEntries.length === 0) {
                Alert.alert('提示', '当前没有未处理的事件');
                return;
              }
              // In a real app, you might want to use a modal picker
              Alert.alert(
                '选择事件',
                '请选择一个事件',
                activeEntries.map((e, index) => ({
                  text: `${formatDate(e.timestamp)} - ${truncateText(e.content, 20)}`,
                  onPress: () => {
                    setSelectedEntryId(e.id);
                    setResult('');
                    setMode(null);
                  }
                }))
              );
            }}
          >
            <Text style={styles.pickerText}>
              {selectedEntry 
                ? `${formatDate(selectedEntry.timestamp)} - ${truncateText(selectedEntry.content, 20)}`
                : '-- 请选择 --'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>

        {/* Tool Buttons */}
      {selectedEntry && (
        <View style={styles.toolButtonsContainer}>
          <TouchableOpacity 
            style={[
              styles.toolButton, 
              mode === 'message' && {
                backgroundColor: '#FEF2F2',
                borderColor: '#FCA5A5'
              }
            ]}
            onPress={() => handleGenerate('message')}
            disabled={loading}
          >
            <MessageCircle size={28} color={mode === 'message' ? '#DC2626' : '#4B5563'} />
            <Text style={[styles.toolButtonText, mode === 'message' && { color: '#DC2626' }]}>
              一键求和
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.toolButton, 
              mode === 'empathy' && {
                backgroundColor: '#EFF6FF',
                borderColor: '#93C5FD'
              }
            ]}
            onPress={() => handleGenerate('empathy')}
            disabled={loading}
          >
            <HeartHandshake size={28} color={mode === 'empathy' ? '#2563EB' : '#4B5563'} />
            <Text style={[styles.toolButtonText, mode === 'empathy' && { color: '#2563EB' }]}>
              如果我是TA
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F87171" />
          <Text style={styles.loadingText}>AI正在思考中...</Text>
        </View>
      )}

      {/* Result */}
      {result && !loading && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>
              {mode === 'message' ? '💌 建议发送：' : '🤔 TA可能是这么想的：'}
            </Text>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
            <Text style={styles.copyButtonText}>复制内容</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Placeholder for other features */}
      <View style={styles.placeholderContainer}>
        <View style={styles.placeholderItem}>
          <Text style={styles.placeholderText}>⏳ 和解倒计时 (开发中)</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  selectorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  pickerContainer: {
    // Container for the picker
  },
  picker: {
    width: '100%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerText: {
    fontSize: 14,
    color: '#374151',
  },
  toolButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  toolButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  toolButtonTextSelected: {
    color: '#DC2626',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  resultContent: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  copyButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  placeholderContainer: {
    marginTop: 32,
    opacity: 0.5,
  },
  placeholderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
});

export default Tools;
