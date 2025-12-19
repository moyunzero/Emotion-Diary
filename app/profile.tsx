import { useRouter } from 'expo-router';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  CloudDownload,
  CloudUpload,
  FileText,
  Info,
  LogOut,
  Moon,
  Settings,
  User as UserIcon,
  X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const AVATARS = [
  'https://picsum.photos/id/64/200/200',
  'https://picsum.photos/id/177/200/200',
  'https://picsum.photos/id/237/200/200',
  'https://picsum.photos/id/433/200/200',
  'https://picsum.photos/id/1025/200/200',
  'https://picsum.photos/id/1074/200/200',
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, entries, weather, login, logout, updateUser, syncToCloud, syncFromCloud } = useApp();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // Edit Profile State
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handleSyncAction = async (type: 'upload' | 'download') => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'upload') {
        await syncToCloud();
        Alert.alert('备份成功', '您的心事已安全存储在云端。');
      } else {
        await syncFromCloud();
        Alert.alert('同步完成', '已找回您的珍贵回忆。');
      }
    } catch (error) {
      Alert.alert('操作失败', '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
      setIsLoginModalOpen(false);
    } catch (error) {
      Alert.alert('登录失败', '请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditProfile = () => {
    if (!user) return;
    setEditName(user.name);
    setEditAvatar(user.avatar || AVATARS[0]);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('提示', '昵称不能为空哦');
      return;
    }
    setIsLoading(true);
    try {
      await updateUser({ name: editName, avatar: editAvatar });
      setIsEditProfileOpen(false);
    } catch (error) {
      Alert.alert('保存失败', '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '退出', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.back();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Decorative Background Circle */}
      <View style={styles.bgCircle} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={28} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Moon size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Settings size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity 
              onPress={user ? openEditProfile : () => setIsLoginModalOpen(true)}
              style={styles.avatarWrapper}
            >
              <Image 
                source={{ uri: user?.avatar || 'https://picsum.photos/100/100' }} 
                style={styles.avatar} 
              />
              {user && (
                <View style={styles.editBadge}>
                  <Camera size={14} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.userInfo}>
              {user ? (
                <>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userHandle}>@emotion_traveler</Text>
                  <View style={styles.moodBadge}>
                    <Text style={styles.moodText}>今日心情: {weather.score > 20 ? '🌧️' : '☀️'}</Text>
                  </View>
                </>
              ) : (
                <TouchableOpacity onPress={() => setIsLoginModalOpen(true)}>
                  <Text style={styles.loginTitle}>点击登录</Text>
                  <Text style={styles.loginSubtitle}>开启您的情绪之旅</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>心事记录</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{weather.score}</Text>
              <Text style={styles.statLabel}>心情指数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {user ? Math.floor((Date.now() - 1700000000000) / (1000 * 60 * 60 * 24)) : 0}
              </Text>
              <Text style={styles.statLabel}>陪伴天数</Text>
            </View>
          </View>

          {/* Menu Groups */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuHeader}>数据与安全</Text>
            <View style={styles.menuGroup}>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => handleSyncAction('upload')}
                disabled={isLoading}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#FEF2F2' }]}>
                  <CloudUpload size={20} color="#EF4444" />
                </View>
                <Text style={styles.menuText}>备份心事</Text>
                <ChevronRight size={20} color="#D1D5DB" />
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => handleSyncAction('download')}
                disabled={isLoading}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#EFF6FF' }]}>
                  <CloudDownload size={20} color="#3B82F6" />
                </View>
                <Text style={styles.menuText}>找回回忆</Text>
                <ChevronRight size={20} color="#D1D5DB" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: '#F0FDF4' }]}>
                  <FileText size={20} color="#16A34A" />
                </View>
                <Text style={styles.menuText}>导出数据</Text>
                <ChevronRight size={20} color="#D1D5DB" />
              </TouchableOpacity>
            </View>

            <Text style={styles.menuHeader}>其他</Text>
            <View style={styles.menuGroup}>
              <TouchableOpacity style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
                  <Info size={20} color="#4B5563" />
                </View>
                <Text style={styles.menuText}>帮助与反馈</Text>
                <ChevronRight size={20} color="#D1D5DB" />
              </TouchableOpacity>
              
              {user && (
                <>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                    <View style={[styles.menuIcon, { backgroundColor: '#FEF2F2' }]}>
                      <LogOut size={20} color="#EF4444" />
                    </View>
                    <Text style={[styles.menuText, { color: '#EF4444' }]}>退出登录</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      )}

      {/* Login Modal */}
      <Modal
        visible={isLoginModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsLoginModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsLoginModalOpen(false)}
            >
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View style={styles.modalHeader}>
              <View style={styles.loginIconBox}>
                <UserIcon size={32} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>开启云端守护</Text>
              <Text style={styles.modalSubtitle}>
                登录后，您的情绪记录将安全地存储在云端，随时随地找回。
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>一键登录 / 注册</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditProfileOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditProfileOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsEditProfileOpen(false)}
            >
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>修改资料</Text>
            
            <View style={styles.avatarSelection}>
              <Image source={{ uri: editAvatar }} style={styles.previewAvatar} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarList}>
                {AVATARS.map((uri, index) => (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => setEditAvatar(uri)}
                    style={[styles.avatarOption, editAvatar === uri && styles.avatarOptionSelected]}
                  >
                    <Image source={{ uri }} style={styles.avatarOptionImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>昵称</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="给自己起个好听的名字吧"
                maxLength={20}
              />
            </View>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>保存修改</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5', // 浅粉色背景
  },
  bgCircle: {
    position: 'absolute',
    top: -width * 0.5,
    left: -width * 0.2,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: '#FEF2F2', // 更浅的粉色
    opacity: 0.6,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileSection: {
    marginTop: 20,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#EF4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Lato_700Bold',
  },
  userHandle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Lato_400Regular',
  },
  moodBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  moodText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Lato_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Lato_400Regular',
  },
  menuContainer: {
    marginBottom: 20,
  },
  menuHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 68,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Edit Profile Specific
  avatarSelection: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  avatarList: {
    flexDirection: 'row',
    maxHeight: 60,
  },
  avatarOption: {
    marginHorizontal: 6,
    borderRadius: 25,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#EF4444',
  },
  avatarOptionImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
});
