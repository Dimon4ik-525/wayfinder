// 🔥 ДОДАНО Platform
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
// 🔥 ДОДАНО useCallback (забрали useEffect)
import { useState, useCallback } from 'react';
// 🔥 ДОДАНО useFocusEffect
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import Footer from '../components/Footer';

export default function SettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Визначаємо, чи це мобільний телефон

  const [selectedStart, setSelectedStart] = useState('start_main');
  const [isAdmissionMode, setIsAdmissionMode] = useState(false);

  // 🔥 Замінено на useFocusEffect для гарантованого оновлення
  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        try {
          const saved = await AsyncStorage.getItem('userStartEntrance');
          if (saved) setSelectedStart(saved);
          const admissionSaved = await AsyncStorage.getItem('admissionMode');
          if (admissionSaved === 'true') setIsAdmissionMode(true);
        } catch (e) {
          console.warn("Помилка завантаження налаштувань:", e);
        }
      };
      loadSettings();
    }, [])
  );

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
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer, 
          { 
            paddingBottom: isMobile ? 80 : 10,
            // 🔥 Для веб-браузера відступ 15, для додатку на телефоні 40
            paddingTop: Platform.OS === 'web' ? 15 : 40 
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Адаптивний заголовок */}
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>⬅ Назад</Text>
          </TouchableOpacity>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Налаштування</Text>
        </View>

        <View style={[styles.card, isMobile && styles.cardMobile]}>
          <Text style={[styles.cardTitle, isMobile && styles.cardTitleMobile]}>📍 Стандартний вхід до корпусу</Text>
          <Text style={[styles.cardSubtitle, isMobile && styles.cardSubtitleMobile]}>
            Оберіть вхід, від якого за замовчуванням будуть будуватися всі маршрути на мапі.
          </Text>

          {/* 🔥 Якщо телефон - ставимо в колонку, якщо ПК - в рядок */}
          <View style={[styles.optionsContainer, isMobile && styles.optionsContainerMobile]}>
            <TouchableOpacity 
              style={[styles.optionBtn, selectedStart === 'start_main' && styles.optionBtnActive]}
              onPress={() => handleSelect('start_main')}
            >
              <Text style={[styles.optionText, isMobile && styles.optionTextMobile, selectedStart === 'start_main' && styles.optionTextActive]}>
                Вхід 1 - Корпус 1 (Центральний)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionBtn, selectedStart === 'start_entrance' && styles.optionBtnActive]}
              onPress={() => handleSelect('start_entrance')}
            >
              <Text style={[styles.optionText, isMobile && styles.optionTextMobile, selectedStart === 'start_entrance' && styles.optionTextActive]}>
                Вхід 2 - Корпус 2 (Задній)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          <Text style={[styles.cardTitle, isMobile && styles.cardTitleMobile]}>🎓 Режим приймальної комісії</Text>
          <Text style={[styles.cardSubtitle, isMobile && styles.cardSubtitleMobile]}>
            Кабінет 12 стає «Приймальна для ФМБ», а Читальна зала — «Приймальна для кваліфікованих».
          </Text>
          <TouchableOpacity
            style={[styles.toggleBtn, isAdmissionMode && styles.toggleBtnActive]}
            onPress={handleToggleAdmission}
          >
            <Text style={[styles.toggleText, isMobile && styles.toggleTextMobile, isAdmissionMode && styles.toggleTextActive]}>
              {isAdmissionMode ? '✅ Увімкнено' : '⬜ Вимкнено'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Обгортка футера, яка відштовхує його вниз */}
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
    flexGrow: 1, 
    paddingHorizontal: '5%', 
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  headerMobile: { marginBottom: 20 }, 
  
  backButton: { padding: 10, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 15 },
  backButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.textMain },
  
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.textMain },
  titleMobile: { fontSize: 26 }, 
  
  card: { backgroundColor: Colors.white, marginBottom: 20, padding: 30, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  cardMobile: { padding: 20, borderRadius: 20 }, 
  
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textMain, marginBottom: 10 },
  cardTitleMobile: { fontSize: 18 },
  
  cardSubtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 30 },
  cardSubtitleMobile: { fontSize: 14, marginBottom: 20 },
  
  optionsContainer: { flexDirection: 'row', gap: 16 },
  optionsContainerMobile: { flexDirection: 'column', gap: 12 }, 
  
  optionBtn: { flex: 1, padding: 20, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  optionBtnActive: { backgroundColor: Colors.primaryGhost, borderColor: Colors.primary },
  optionText: { fontSize: 18, fontWeight: 'bold', color: Colors.textSecondary, textAlign: 'center' },
  optionTextMobile: { fontSize: 16 },
  optionTextActive: { color: Colors.primary },
  
  toggleBtn: { padding: 20, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.primaryGhost, borderColor: Colors.primary },
  toggleText: { fontSize: 18, fontWeight: 'bold', color: Colors.textSecondary },
  toggleTextMobile: { fontSize: 16 },
  toggleTextActive: { color: Colors.primary },

  footerWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 20,
  }
});