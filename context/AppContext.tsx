import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_ENTRIES } from '../constants';
import { MoodEntry, Status, WeatherState } from '../types';

interface AppContextType {
  entries: MoodEntry[];
  addEntry: (entry: Omit<MoodEntry, 'id' | 'timestamp' | 'status'>) => void;
  resolveEntry: (id: string) => void;
  deleteEntry: (id: string) => void;
  weather: WeatherState;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [weather, setWeather] = useState<WeatherState>({
    score: 0,
    condition: 'sunny',
    description: '关系晴朗'
  });

  // Load entries from AsyncStorage on mount
  useEffect(() => {
    loadEntries();
  }, []);

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
    <AppContext.Provider value={{ entries, addEntry, resolveEntry, deleteEntry, weather }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
