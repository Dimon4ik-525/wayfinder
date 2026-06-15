import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

const ADMISSION_URL = 'https://tehcollege.rv.ua/2024/05/21/%d0%b2%d1%81%d1%82%d1%83%d0%bf%d0%bd%d0%b8%d0%ba%d1%83/';

export default function AdmissionBanner() {
  const [isAdmissionMode, setIsAdmissionMode] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem('admissionMode');
        setIsAdmissionMode(saved === 'true');
      } catch (e) {}
    };
    load();

    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!isAdmissionMode) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openURL(ADMISSION_URL)}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>🎓</Text>
        <Text style={styles.text}>Інформація для вступника</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 15, // Вирівняно з іншими елементами сайдбару
    marginTop: 10,         // Відступ зверху
    marginBottom: 5,       // Зменшено відступ знизу
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,   // 🔥 Зроблено трохи тоншою (було 16)
    paddingHorizontal: 15,
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    flex: 1,
    color: Colors.white,
    fontSize: 15,          // 🔥 Трохи зменшено шрифт для компактності
    fontWeight: 'bold',
  },
});