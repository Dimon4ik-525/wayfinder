import { Slot, useRouter, usePathname } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../constants/theme'; 

// 👇 ДОДАНО: імпорт нашого віджета
import EventsWidget from '../components/EventsWidget'; 

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname(); 

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const months = ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const formatDay = (date: Date) => {
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
    return days[date.getDay()];
  };

  return (
    <View style={styles.container}>
      {/* ЛІВИЙ САЙДБАР */}
      <View style={styles.sidebar}>
        
        {/* Блок з реальним логотипом */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>

        {/* НАВІГАЦІЙНЕ МЕНЮ */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={[styles.menuButton, pathname === '/schedule' && styles.menuButtonActive]}
            onPress={() => router.push('/schedule')}
          >
            <Text style={pathname === '/schedule' ? styles.menuTextActive : styles.menuText}>
              📅 Розклад груп
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuButton, pathname === '/map' && styles.menuButtonActive]}
            onPress={() => router.push('/map')}
          >
            <Text style={pathname === '/map' ? styles.menuTextActive : styles.menuText}>
              📍 Мапа корпусу
            </Text>
          </TouchableOpacity>
        </View>

        {/* 👇 ВСТАВЛЯЄМО ВІДЖЕТ ТУТ 👇 */}
        <EventsWidget />

        {/* ЖИВИЙ ГОДИННИК */}
        <View style={styles.clockContainer}>
          <Text style={styles.time}>{formatTime(currentTime)}</Text>
          <Text style={styles.date}>{formatDate(currentTime)}</Text>
          <Text style={styles.day}>{formatDay(currentTime)}</Text>
        </View>

      </View>

      {/* ПРАВА ЧАСТИНА */}
      <View style={styles.mainContent}>
        <Slot /> 
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
  sidebar: { 
    width: 320, 
    backgroundColor: Colors.sidebar, 
    paddingTop: 60, 
    paddingBottom: 60, 
    alignItems: 'center',
    justifyContent: 'space-between' 
  },
  
  logoContainer: { 
    width: 120, 
    height: 120, 
    backgroundColor: Colors.white, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 16,
    padding: 10 
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  
  menuContainer: { width: '100%', paddingHorizontal: 20, marginTop: 40 },
  
  menuButton: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  menuButtonActive: { backgroundColor: Colors.primary },
  menuText: { color: Colors.textSecondary, fontSize: 18, fontWeight: '600' },
  menuTextActive: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },

  clockContainer: { alignItems: 'center' },
  time: { fontSize: 80, fontWeight: 'bold', color: Colors.white, letterSpacing: 2 },
  date: { fontSize: 24, color: Colors.textSecondary, marginTop: 8 },
  day: { fontSize: 24, color: Colors.textSecondary, marginTop: 4 },
  mainContent: { flex: 1 },
});