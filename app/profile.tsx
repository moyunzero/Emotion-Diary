import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CloudDownload,
  CloudUpload,
  LogOut,
  Settings,
  User as UserIcon,
  X
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';

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
  const user = useAppStore((state) => state.user);
  const entries = useAppStore((state) => state.entries);
  const weather = useAppStore((state) => state.weather);
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const updateUser = useAppStore((state) => state.updateUser);
  const syncToCloud = useAppStore((state) => state.syncToCloud);
  // syncFromCloud 目前用于未来的完整同步功能
  // const syncFromCloud = useAppStore((state) => state.syncFromCloud);
  const register = useAppStore((state) => state.register);
  const recoverFromCloud = useAppStore((state) => state.recoverFromCloud);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncProgress, setSyncProgress] = useState<string>('');
  
  // Edit Profile State
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  
  // Login/Register State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  
  // 加载最后同步时间
  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const time = await AsyncStorage.getItem('last_sync_time');
        if (time) {
          setLastSyncTime(parseInt(time, 10));
        }
      } catch (error) {
        console.error('加载最后同步时间失败:', error);
      }
    };
    loadLastSyncTime();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleSyncAction = async (type: 'upload' | 'download') => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsLoading(true);
    setSyncStatus('syncing');
    setSyncProgress(type === 'upload' ? '正在备份到云端...' : '正在从云端同步...');
    
    try {
      if (type === 'upload') {
        await syncToCloud();
        const now = Date.now();
        setLastSyncTime(now);
        await AsyncStorage.setItem('last_sync_time', now.toString());
        setSyncStatus('success');
        setSyncProgress(`成功备份 ${entries.length} 条记录`);
        setTimeout(() => {
          setSyncStatus('idle');
          setSyncProgress('');
        }, 2000);
      } else {
        await recoverFromCloud();
        const now = Date.now();
        setLastSyncTime(now);
        await AsyncStorage.setItem('last_sync_time', now.toString());
        setSyncStatus('success');
        setSyncProgress(`成功同步 ${entries.length} 条记录`);
        setTimeout(() => {
          setSyncStatus('idle');
          setSyncProgress('');
        }, 2000);
      }
    } catch (error: any) {
      const errorMessage = error?.message || '操作失败，请稍后重试';
      setSyncStatus('error');
      setSyncProgress(errorMessage);
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress('');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return '从未同步';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚同步';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleLogin = async () => {
    if (!isRegisterMode && (!email.trim() || !password.trim())) {
      Alert.alert('提示', '请输入邮箱和密码');
      return;
    }
    
    if (isRegisterMode && (!email.trim() || !password.trim() || !registerName.trim())) {
      Alert.alert('提示', '请填写所有必填项');
      return;
    }
    
    if (isRegisterMode && password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }
    
    setIsLoading(true);
    try {
      let success = false;
      
      if (isRegisterMode) {
        try {
          success = await register(email, password, registerName);
          if (success) {
            Alert.alert('注册成功', '账号已创建并自动登录');
            setIsLoginModalOpen(false);
            // 清空表单
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRegisterName('');
          } else {
            Alert.alert('注册失败', '请检查邮箱格式和密码强度');
          }
        } catch (error: any) {
          if (error.message && error.message.includes('User already registered')) {
            Alert.alert('账户已存在', '该邮箱已被注册，是否切换到登录模式？', [
              { text: '取消', style: 'cancel' },
              { 
                text: '去登录', 
                onPress: () => {
                  setIsRegisterMode(false);
                  setEmail(email); // 保留邮箱地址
                }
              }
            ]);
          } else {
            Alert.alert('注册失败', error.message || '请检查邮箱格式和密码强度');
          }
        }
      } else {
        success = await login(email, password);
        if (success) {
          setIsLoginModalOpen(false);
          // 清空表单
          setEmail('');
          setPassword('');
        } else {
          Alert.alert('登录失败', '请检查邮箱和密码是否正确');
        }
      }
    } catch (error: any) {
      Alert.alert(isRegisterMode ? '注册失败' : '登录失败', error.message || '请稍后重试');
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
    } catch {
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
            setIsLoading(true);
            try {
              await logout();
              router.back();
            } catch {
              Alert.alert('退出失败', '请稍后重试');
            } finally {
              setIsLoading(false);
            }
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
              {avatarError || !user?.avatar ? (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {user?.name?.charAt(0) || '?'}
                  </Text>
                </View>
              ) : (
                <Image 
                  source={{ uri: user.avatar }} 
                  style={styles.avatar}
                  onError={() => {
                    setAvatarError(true);
                  }}
                />
              )}
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
                  <Text style={styles.userHandle}>
                    {user.email || `@user_${user.id.slice(0, 8)}`}
                  </Text>
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
                {(() => {
                  // 计算陪伴天数：基于用户的第一条记录时间戳
                  if (!user || entries.length === 0) return 0;
                  
                  // 找到最早的一条记录
                  const oldestEntry = entries.reduce((oldest, current) => 
                    current.timestamp < oldest.timestamp ? current : oldest
                  );
                  
                  // 计算从第一条记录到现在经过的天数
                  const daysSinceFirstEntry = Math.floor(
                    (Date.now() - oldestEntry.timestamp) / (1000 * 60 * 60 * 24)
                  );
                  
                  // 至少显示1天
                  return Math.max(1, daysSinceFirstEntry);
                })()}
              </Text>
              <Text style={styles.statLabel}>陪伴天数</Text>
            </View>
          </View>

          {/* Menu Groups */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuHeader}>数据与安全</Text>
            
            {/* 同步状态指示器 */}
            {user && (
              <View style={styles.syncStatusContainer}>
                <View style={styles.syncStatusRow}>
                  <View style={styles.syncStatusLeft}>
                    {syncStatus === 'syncing' && (
                      <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 8 }} />
                    )}
                    {syncStatus === 'success' && (
                      <CheckCircle size={16} color="#10B981" style={{ marginRight: 8 }} />
                    )}
                    {syncStatus === 'error' && (
                      <X size={16} color="#EF4444" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.syncStatusText}>
                      {syncProgress || `最后同步：${formatLastSyncTime(lastSyncTime)}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.menuGroup}>
              <TouchableOpacity 
                style={[styles.menuItem, isLoading && styles.menuItemDisabled]} 
                onPress={() => handleSyncAction('upload')}
                disabled={isLoading}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#FEF2F2' }]}>
                  <CloudUpload size={20} color="#EF4444" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>备份心事</Text>
                  {syncStatus === 'syncing' && (
                    <Text style={styles.menuSubtext}>正在备份...</Text>
                  )}
                </View>
                {syncStatus !== 'syncing' && <ChevronRight size={20} color="#D1D5DB" />}
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={[styles.menuItem, isLoading && styles.menuItemDisabled]} 
                onPress={() => handleSyncAction('download')}
                disabled={isLoading}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#EFF6FF' }]}>
                  <CloudDownload size={20} color="#3B82F6" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>找回回忆</Text>
                  {syncStatus === 'syncing' && (
                    <Text style={styles.menuSubtext}>正在同步...</Text>
                  )}
                </View>
                {syncStatus !== 'syncing' && <ChevronRight size={20} color="#D1D5DB" />}
              </TouchableOpacity>
            </View>

            <Text style={styles.menuHeader}>其他</Text>
            <View style={styles.menuGroup}>
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
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[
              styles.modalContent,
              {
                maxHeight: Dimensions.get('window').height - insets.top - insets.bottom - 48, // 减去安全区域和 padding
              }
            ]}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                setIsLoginModalOpen(false);
                setIsRegisterMode(false);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setRegisterName('');
              }}
            >
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
            
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              <View style={styles.modalHeader}>
                <View style={styles.loginIconBox}>
                  <UserIcon size={32} color="#EF4444" />
                </View>
                <Text style={styles.modalTitle}>
                  {isRegisterMode ? '创建账号' : '开启云端守护'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isRegisterMode 
                    ? '注册账号，让情绪记录永久保存'
                    : '登录后，您的情绪记录将安全地存储在云端，随时随地找回。'
                  }
                </Text>
              </View>

              {!isRegisterMode ? (
                // 登录表单
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>邮箱</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="输入你的邮箱地址"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>密码</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="输入你的密码"
                      secureTextEntry
                    />
                  </View>
                </View>
              ) : (
                // 注册表单
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>昵称</Text>
                    <TextInput
                      style={styles.input}
                      value={registerName}
                      onChangeText={setRegisterName}
                      placeholder="给自己起个好听的名字吧~"
                      maxLength={20}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>邮箱</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="输入你的邮箱地址"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>密码</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="设置密码（至少6位）"
                      secureTextEntry
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>确认密码</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="请再次输入密码"
                      secureTextEntry
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isRegisterMode ? '注册账号' : '登录'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.switchModeContainer}>
                <Text style={styles.switchModeText}>
                  {isRegisterMode ? '已有账号？' : '还没有账号？'}
                </Text>
                <TouchableOpacity onPress={() => setIsRegisterMode(!isRegisterMode)}>
                  <Text style={styles.switchModeLink}>
                    {isRegisterMode ? '立即登录' : '立即注册'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditProfileOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditProfileOpen(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[
              styles.modalContent,
              {
                maxHeight: Dimensions.get('window').height - insets.top - insets.bottom - 48, // 减去安全区域和 padding
              }
            ]}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsEditProfileOpen(false)}
            >
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>修改资料</Text>
            
            <View style={styles.avatarSelection}>
              <Image 
                source={{ uri: editAvatar }} 
                style={styles.previewAvatar}
                onError={() => {
                  // 头像加载失败，使用默认头像
                }}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarList}>
                {AVATARS.map((uri, index) => (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => {
                      setEditAvatar(uri);
                      setAvatarError(false); // 重置错误状态
                    }}
                    style={[styles.avatarOption, editAvatar === uri && styles.avatarOptionSelected]}
                  >
                    <Image 
                      source={{ uri }} 
                      style={styles.avatarOptionImage}
                      onError={() => {
                        // 头像选项加载失败
                      }}
                    />
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
          </KeyboardAvoidingView>
        </SafeAreaView>
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
  avatarPlaceholder: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
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
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  menuSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  syncStatusContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncStatusText: {
    fontSize: 12,
    color: '#6B7280',
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
    paddingHorizontal: 24,
    // paddingVertical 由 SafeAreaView 自动处理
  },
  keyboardAvoidingView: {
    width: '100%',
    maxWidth: 340,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    // maxHeight 现在通过内联样式动态计算，考虑安全区域
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'stretch', // 改为 stretch，让内容可以填充宽度
    overflow: 'hidden', // React Native 只支持 hidden
    position: 'relative', // 确保关闭按钮定位正确
    // 添加明确的最小高度，确保内容可见
    minHeight: 400,
  },
  modalScrollView: {
    width: '100%',
    // 使用 flexShrink 确保 ScrollView 可以缩小，但不会消失
    flexShrink: 1,
  },
  modalScrollContent: {
    alignItems: 'stretch', // 改为 stretch，让内容可以填充宽度
    paddingTop: 0, // 标题区域已经有 marginBottom
    paddingBottom: 16, // 添加底部 padding，确保内容不被裁剪
    // 确保内容有足够的最小高度，让所有元素可见
    minHeight: 400,
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
    width: '100%', // 确保宽度填充
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
  formContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'stretch', // 确保表单内容可以填充宽度
  },

  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  switchModeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchModeLink: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
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