import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Filter, PenLine } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, ListRenderItem, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { MoodEntry, Status } from '../types';
import { formatDateChinese } from '../utils/dateUtils';
import EntryCard from './EntryCard';
import WeatherStation from './WeatherStation';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const entries = useAppStore((state) => state.entries);
  const weather = useAppStore((state) => state.weather);
  const deleteEntry = useAppStore((state) => state.deleteEntry);
  const user = useAppStore((state) => state.user);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [avatarError, setAvatarError] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const filterButtonRef = useRef<TouchableOpacity>(null);
  const windowWidth = Dimensions.get('window').width;
  
  // 加载过滤偏好
  useEffect(() => {
    const loadFilterPreference = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem('dashboard_filter');
        if (savedFilter && ['all', 'active', 'resolved'].includes(savedFilter)) {
          setFilter(savedFilter as 'all' | 'active' | 'resolved');
        }
      } catch (error) {
        console.error('加载过滤偏好失败:', error);
      }
    };
    loadFilterPreference();
  }, []);
  
  // 保存过滤偏好
  const handleFilterChange = useCallback((newFilter: 'all' | 'active' | 'resolved') => {
    setFilter(newFilter);
    setIsFilterOpen(false);
    AsyncStorage.setItem('dashboard_filter', newFilter).catch(err => {
      console.error('保存过滤偏好失败:', err);
    });
  }, []);

  // 处理筛选按钮点击，测量按钮位置
  const handleFilterButtonPress = useCallback(() => {
    if (filterButtonRef.current) {
      filterButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        // pageX, pageY 是相对于屏幕的绝对位置
        setFilterButtonLayout({
          x: pageX,
          y: pageY,
          width,
          height,
        });
        setIsFilterOpen(!isFilterOpen);
      });
    } else {
      setIsFilterOpen(!isFilterOpen);
    }
  }, [isFilterOpen]);


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
  const handleBurn = useCallback((id: string, text: string) => {
    deleteEntry(id);
  }, [deleteEntry]);

  // FlatList 渲染函数，使用 useCallback 优化性能
  const renderEntry = useCallback<ListRenderItem<MoodEntry>>(({ item }) => (
    <EntryCard key={item.id} entry={item} onBurn={handleBurn} />
  ), [handleBurn]);

  // FlatList key 提取函数
  const keyExtractor = useCallback((item: MoodEntry) => item.id, []);

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

  // 渲染列表头部（只包含天气站和标题）
  const renderListHeader = () => (
    <>
      {/* Weather Station */}
      <View style={styles.weatherSection}>
        <WeatherStation />
      </View>

      {/* List Header - 标题和筛选按钮 */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {getFilterLabel()}
          <Text style={styles.count}> ({filteredEntries.length})</Text>
        </Text>
        
        <TouchableOpacity 
          ref={filterButtonRef}
          onPress={handleFilterButtonPress}
          onLayout={() => {
            // 当布局变化时重新测量（例如列表滚动时）
            if (filterButtonRef.current && isFilterOpen) {
              filterButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
                setFilterButtonLayout({
                  x: pageX,
                  y: pageY,
                  width,
                  height,
                });
              });
            }
          }}
          style={[styles.filterButton, isFilterOpen && styles.filterButtonActive]}
        >
          <Filter size={18} color={isFilterOpen ? '#EF4444' : '#6B7280'} />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header - 固定在顶部 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>情绪气象站</Text>
          <Text style={styles.subtitle}>
            {formatDateChinese(Date.now())} · {getWeatherAdvice()}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatar}>
          {avatarError || !user?.avatar ? (
            <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {user?.name?.charAt(0) || '?'}
              </Text>
            </View>
          ) : (
            <Image 
              source={{ uri: user.avatar }} 
              style={styles.avatarImage}
              onError={() => {
                setAvatarError(true);
              }}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* List - 包含天气站作为头部 */}
      <FlatList
        style={styles.listContainer}
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <PenLine size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>开始记录你的第一份情绪吧</Text>
            <Text style={styles.emptyText}>记录情绪，让每一次表达都成为照料心灵的过程</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/record')}
            >
              <Text style={styles.emptyButtonText}>去记录 ✍️</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.flatListContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={100}
        initialNumToRender={15}
        windowSize={21}
        showsVerticalScrollIndicator={false}
      />

      {/* 筛选下拉菜单 - 显示在按钮下方 */}
      {isFilterOpen && filterButtonLayout && (
        <>
          <TouchableOpacity 
            style={styles.filterBackdrop}
            activeOpacity={1}
            onPress={() => setIsFilterOpen(false)}
          />
          <View 
            style={[
              styles.filterDropdown,
              {
                top: filterButtonLayout.y + filterButtonLayout.height + 8,
                right: windowWidth - filterButtonLayout.x - filterButtonLayout.width,
              }
            ]}
          >
            <TouchableOpacity 
              onPress={() => handleFilterChange('active')} 
              style={[styles.filterOption, filter === 'active' && styles.filterOptionActive]}
            >
              <Text style={[styles.filterOptionText, filter === 'active' && styles.filterOptionTextActive]}>
                未处理
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleFilterChange('resolved')} 
              style={[styles.filterOption, filter === 'resolved' && styles.filterOptionActive]}
            >
              <Text style={[styles.filterOptionText, filter === 'resolved' && styles.filterOptionTextActive]}>
                已和解
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleFilterChange('all')} 
              style={[styles.filterOption, filter === 'all' && styles.filterOptionActive]}
            >
              <Text style={[styles.filterOptionText, filter === 'all' && styles.filterOptionTextActive]}>
                全部
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
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
  avatarPlaceholder: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  weatherSection: {
    marginBottom: 16,
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
  filterBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 998,
  },
  filterDropdown: {
    position: 'absolute',
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 999,
  },
  filterOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  filterOptionActive: {
    backgroundColor: '#FEF2F2',
  },
  filterOptionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    letterSpacing: 0,
    color: '#6B7280',
    textAlign: 'center',
  },
  filterOptionTextActive: {
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: '#EF4444',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  flatListContent: {
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25.2,
    letterSpacing: 0,
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default Dashboard;
