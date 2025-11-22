import { BarChart2, Home, PlusCircle, Wrench } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRecordPress: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, onRecordPress }) => {
  const insets = useSafeAreaInsets();

  const navItems = [
    { id: 'dashboard', icon: Home, label: '气象站' },
    { id: 'record', icon: PlusCircle, label: '记一笔', main: true },
    { id: 'insights', icon: BarChart2, label: '洞察' },
    { id: 'tools', icon: Wrench, label: '工具' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.navContent}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          if (item.main) {
            return (
              <TouchableOpacity key={item.id} onPress={onRecordPress} style={styles.mainButton}>
                <View style={styles.mainButtonInner}>
                  <Icon size={28} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => onTabChange(item.id)}
              style={styles.navItem}
            >
              <Icon 
                size={24} 
                color={isActive ? '#EF4444' : '#D1D5DB'} 
                strokeWidth={isActive ? 2.5 : 2}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 12,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    minWidth: 60,
    paddingBottom: 4,
  },
  mainButton: {
    position: 'relative',
    top: -20,
  },
  mainButtonInner: {
    width: 56,
    height: 56,
    backgroundColor: '#EF4444',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FCA5A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default Navigation;
