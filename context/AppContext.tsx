import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_ENTRIES } from '../constants';
import { MoodEntry, Status, User, WeatherState } from '../types';

interface AppContextType {
  entries: MoodEntry[];
  addEntry: (entry: Omit<MoodEntry, 'id' | 'timestamp' | 'status'>) => void;
  resolveEntry: (id: string) => void;
  deleteEntry: (id: string) => void;
  weather: WeatherState;
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [weather, setWeather] = useState<WeatherState>({
    score: 0,
    condition: 'sunny',
    description: '关系晴朗'
  });

  // Load entries from AsyncStorage on mount
  useEffect(() => {
    loadEntries();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user_session');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const login = async () => {
    // Mock login
    const mockUser: User = {
      id: 'u1',
      name: 'Emotion Traveler',
      avatar: 'https://picsum.photos/100/100'
    };
    setUser(mockUser);
    await AsyncStorage.setItem('user_session', JSON.stringify(mockUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user_session');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
  };

  const syncToCloud = async () => {
    if (!user) throw new Error('User not logged in');
    // Mock sync delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    // In a real app, we would upload 'entries' to the server here
    console.log('Synced to cloud:', entries.length, 'entries');
  };

  const syncFromCloud = async () => {
    if (!user) throw new Error('User not logged in');
    // Mock sync delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    // In a real app, we would fetch entries from server
    // For now, we'll just keep existing entries or maybe merge mock ones
    console.log('Synced from cloud');
  };

  useEffect(() => {
    if (entries.length > 0) {
      saveEntries();
      calculateWeather();
    }
  }, [entries]);

  const loadEntries = async () => {
    try {
      const saved = await AsyncStorage.getItem('mood_entries');
      if (saved) {
        setEntries(JSON.parse(saved));
      } else {
        setEntries(MOCK_ENTRIES);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      setEntries(MOCK_ENTRIES);
    }
  };

  const saveEntries = async () => {
    try {
      await AsyncStorage.setItem('mood_entries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving entries:', error);
    }
  };

  const calculateWeather = () => {
    // Simple algorithm: Sum of active mood levels
    const activeEntries = entries.filter(e => e.status === Status.ACTIVE);
    const score = activeEntries.reduce((acc, curr) => acc + curr.moodLevel * 2, 0);
    
    let condition: WeatherState['condition'] = 'sunny';
    let description = '相处不错哦~';

    if (score > 30) {
      condition = 'stormy';
      description = '预警！关系需要紧急维护！';
    } else if (score > 20) {
      condition = 'rainy';
      description = '建议安排一次深度沟通';
    } else if (score > 10) {
      condition = 'cloudy';
    }

    setWeather({ score, condition, description });
  };

  const addEntry = (entryData: Omit<MoodEntry, 'id' | 'timestamp' | 'status'>) => {
    const newEntry: MoodEntry = {
      ...entryData,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: Status.ACTIVE,
    };
    setEntries(prev => [newEntry, ...prev]);
  };

  const resolveEntry = (id: string) => {
    setEntries(prev => prev.map(e => 
      e.id === id ? { ...e, status: Status.RESOLVED, resolvedAt: Date.now() } : e
    ));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <AppContext.Provider value={{ 
      entries, 
      addEntry, 
      resolveEntry, 
      deleteEntry, 
      weather,
      user,
      login,
      logout,
      updateUser,
      syncToCloud,
      syncFromCloud
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
