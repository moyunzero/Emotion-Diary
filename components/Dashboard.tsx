import { Filter } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Status } from '../types';
import EntryCard from './EntryCard';
import WeatherStation from './WeatherStation';

const Dashboard: React.FC = () => {
  const { entries, weather, deleteEntry } = useApp(); // 引入 deleteEntry
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredEntries = (() => {
    let filtered = entries;
    
    if (filter === 'active') {
      filtered = entries.filter(e => e.status === Status.ACTIVE);
    } else if (filter === 'resolved') {
      filtered = entries.filter(e => e.status === Status.RESOLVED);
    }
    
    // 当选择"全部记录"时，按状态分组：未处理在前，已和解在后，各自按时间倒序
    if (filter === 'all') {
      const activeEntries = filtered
        .filter(e => e.status === Status.ACTIVE)
        .sort((a, b) => b.timestamp - a.timestamp);
      const resolvedEntries = filtered
        .filter(e => e.status === Status.RESOLVED)
        .sort((a, b) => b.timestamp - a.timestamp);
      return [...activeEntries, ...resolvedEntries];
    }
    
    // 其他情况按时间倒序排列
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  })();

  // 修改处理函数：接收 id 和 text，直接删除
  const handleBurn = (id: string, text: string) => {
    deleteEntry(id);
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'active':
        return '未处理';
      case 'resolved':
        return '已和解';
      default:
        return '全部记录';
    }
  };

  const getWeatherAdvice = () => {
    return weather.condition === 'sunny' ? '宜开心' : '宜沟通';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>情绪气象站</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('zh-CN')} · {getWeatherAdvice()}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Image 
            source={{ uri: 'https://picsum.photos/100/100' }} 
            style={styles.avatarImage} 
          />
        </View>
      </View>

      {/* Weather Station */}
      <View style={styles.weatherSection}>
        <WeatherStation />
      </View>

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {getFilterLabel()}
          <Text style={styles.count}> ({filteredEntries.length})</Text>
        </Text>
        
        <View>
          <TouchableOpacity 
            onPress={() => setIsFilterOpen(!isFilterOpen)}
            style={[styles.filterButton, isFilterOpen && styles.filterButtonActive]}
          >
            <Filter size={18} color={isFilterOpen ? '#EF4444' : '#6B7280'} />
          </TouchableOpacity>
          
          {isFilterOpen && (
            <View style={styles.filterDropdown}>
              <TouchableOpacity 
                onPress={() => { setFilter('active'); setIsFilterOpen(false); }} 
                style={[styles.filterOption, filter === 'active' && styles.filterOptionActive]}
              >
                <Text style={[styles.filterOptionText, filter === 'active' && styles.filterOptionTextActive]}>
                  未处理
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => { setFilter('resolved'); setIsFilterOpen(false); }} 
                style={[styles.filterOption, filter === 'resolved' && styles.filterOptionActive]}
              >
                <Text style={[styles.filterOptionText, filter === 'resolved' && styles.filterOptionTextActive]}>
                  已和解
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => { setFilter('all'); setIsFilterOpen(false); }} 
                style={[styles.filterOption, filter === 'all' && styles.filterOptionActive]}
              >
                <Text style={[styles.filterOptionText, filter === 'all' && styles.filterOptionTextActive]}>
                  全部
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍃</Text>
            <Text style={styles.emptyText}>这里空空如也，一片祥和</Text>
          </View>
        ) : (
          filteredEntries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onBurn={handleBurn} />
          ))
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  scrollView: {
    flex: 1,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontFamily: 'Lato_700Bold',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 33.6,
    letterSpacing: -0.5,
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16.8,
    letterSpacing: 0,
    color: '#6B7280',
    marginTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  weatherSection: {
    marginBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    zIndex: 20,
  },
  listTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25.2,
    letterSpacing: 0,
    color: '#1F2937',
  },
  count: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16.8,
    letterSpacing: 0,
    color: '#9CA3AF',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#FEF2F2',
  },
  filterDropdown: {
    position: 'absolute',
    right: 0,
    top: 40,
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, // 调低透明度
    shadowRadius: 12,
    elevation: 4, // 调低 elevation
    overflow: 'hidden',
    zIndex: 30,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  filterOptionActive: {
    backgroundColor: '#FEF2F2',
  },
  filterOptionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
    letterSpacing: 0,
    color: '#374151',
  },
  filterOptionTextActive: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.8,
    letterSpacing: 0.5,
    color: '#EF4444',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
    letterSpacing: 0,
    color: '#D1D5DB',
  },
});

export default Dashboard;
