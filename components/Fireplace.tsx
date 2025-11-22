import { X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  text: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const Fireplace: React.FC<Props> = ({ text, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Start burning animation after 1 second
    const burnTimer = setTimeout(() => {
      Animated.timing(textAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(onClose, 500);
      });
    }, 1000);

    return () => clearTimeout(burnTimer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.modal,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.fireContainer}>
          <View style={styles.flame}>
            <View style={[styles.firePart, { height: 60, backgroundColor: '#F97316' }]} />
            <View style={[styles.firePart, { height: 40, backgroundColor: '#FCD34D' }]} />
            <View style={[styles.firePart, { height: 20, backgroundColor: '#FDE047' }]} />
          </View>
          <View style={styles.logs}>
            <View style={styles.log} />
            <View style={styles.log} />
            <View style={styles.log} />
          </View>
        </View>

        <Animated.Text 
          style={[
            styles.burningText,
            {
              opacity: textAnim,
              transform: [{ scale: textAnim }],
            }
          ]}
        >
          {text}
        </Animated.Text>

        <Text style={styles.statusText}>
          正在焚烧负面情绪...
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  fireContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  flame: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 100,
    width: 80,
  },
  firePart: {
    width: 40,
    borderRadius: 20,
    marginBottom: -10,
    position: 'absolute',
    bottom: 0,
  },
  logs: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  log: {
    width: 30,
    height: 8,
    backgroundColor: '#8B4513',
    borderRadius: 4,
  },
  burningText: {
    fontSize: 18,
    color: '#FCD34D',
    textAlign: 'center',
    lineHeight: 26,
    marginVertical: 20,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default Fireplace;
