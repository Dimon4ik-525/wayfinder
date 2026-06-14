import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import Footer from '../components/Footer';

export default function SettingsScreen() {
  const router = useRouter();
  const [selectedStart, setSelectedStart] = useState('start_main');
  const [isAdmissionMode, setIsAdmissionMode] = useState(false);

  // Завантажуємо збережений вхід при відкритті екрану
  useEffect(() => {
    const loadSettings = async () => {
      const saved = await AsyncStorage.getItem('userStartEntrance');
      if (saved) setSelectedStart(saved);
      const admissionSaved = await AsyncStorage.getItem('admissionMode');
      if (admissionSaved === 'true') setIsAdmissionMode(true);
    };
    loadSettings();
  }, []);

  // Зберігаємо новий вибір
  const handleSelect = async (id: string) => {
    setSelectedStart(id);
    await AsyncStorage.setItem('userStartEntrance', id);
  };

  const handleToggleAdmission = async () => {
    const newVal = !isAdmissionMode;
    setIsAdmissionMode(newVal);
    await AsyncStorage.setItem('admissionMode', String(newVal));
  };

  return (
    <View style={styles.mainWrapper}>
      {/* 🔥 Додали ScrollView для прокрутки контенту */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>⬅ Назад</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Налаштування</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Стандартний вхід до корпусу</Text>
          <Text style={styles.cardSubtitle}>
            Оберіть вхід, від якого за замовчуванням будуть будуватися всі маршрути на мапі.
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionBtn, selectedStart === 'start_main' && styles.optionBtnActive]}
              onPress={() => handleSelect('start_main')}
            >
              <Text style={[styles.optionText, selectedStart === 'start_main' && styles.optionTextActive]}>
                Вхід 1 - Корпус 1 (Центральний)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionBtn, selectedStart === 'start_entrance' && styles.optionBtnActive]}
              onPress={() => handleSelect('start_entrance')}
            >
              <Text style={[styles.optionText, selectedStart === 'start_entrance' && styles.optionTextActive]}>
                Вхід 2 - Корпус 2 (Задній)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎓 Режим приймальної комісії</Text>
          <Text style={styles.cardSubtitle}>
            Кабінет 12 стає «Приймальна для ФМБ», а Читальна зала — «Приймальна для кваліфікованих».
          </Text>
          <TouchableOpacity
            style={[styles.toggleBtn, isAdmissionMode && styles.toggleBtnActive]}
            onPress={handleToggleAdmission}
          >
            <Text style={[styles.toggleText, isAdmissionMode && styles.toggleTextActive]}>
              {isAdmissionMode ? '✅ Увімкнено' : '⬜ Вимкнено'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔥 Обгортка футера, яка відштовхує його вниз */}
        <View style={styles.footerWrapper}>
          <Footer/>
        </View>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  scrollContainer: { 
    flexGrow: 1, // 🔥 Дозволяє контенту розтягуватися на весь екран і притискати футер
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 20, // Задаємо відступ знизу, щоб контент не прилипав до краю при прокрутці
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  backButton: { padding: 10, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 20 },
  backButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.textMain },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.textMain },
  
  card: { backgroundColor: Colors.white, marginBottom: 20, padding: 30, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textMain, marginBottom: 10 },
  cardSubtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 30 },
  
  optionsContainer: { flexDirection: 'row', gap: 16 },
  optionBtn: { flex: 1, padding: 20, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center' },
  optionBtnActive: { backgroundColor: Colors.primaryGhost, borderColor: Colors.primary },
  optionText: { fontSize: 18, fontWeight: 'bold', color: Colors.textSecondary },
  optionTextActive: { color: Colors.primary },
  toggleBtn: { padding: 20, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.primaryGhost, borderColor: Colors.primary },
  toggleText: { fontSize: 18, fontWeight: 'bold', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.primary },

  // 🔥 Стиль для правильного позиціонування футера
  footerWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 20,
  }
});