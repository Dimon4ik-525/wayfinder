import { Slot, useRouter, usePathname } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../constants/theme'; 
import EventsWidget from '../components/EventsWidget'; 

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname(); 
  const { width, height } = useWindowDimensions();

  // 🔥 Динамічні розміри на основі висоти екрану (щоб не вилазило по вертикалі)
  const isCompact = height < 800; // Для невеликих ноутбуків (напр. 13 дюймів)
  const isMobile = width < 768;   // Для телефонів/вертикальних планшетів

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

  if (pathname === '/') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <Slot />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ЛІВИЙ САЙДБАР */}
      {!isMobile && (
        <View style={[
          styles.sidebar, 
          // Динамічна ширина та відступи
          { 
            width: width < 1024 ? 260 : 320, 
            paddingTop: isCompact ? 30 : 60,
            paddingBottom: isCompact ? 30 : 60,
          }
        ]}>
          
          <View style={[
            styles.logoContainer,
            { width: isCompact ? 80 : 120, height: isCompact ? 80 : 120 }
          ]}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>

          {/* НАВІГАЦІЙНЕ МЕНЮ */}
          <View style={[styles.menuContainer, { marginTop: isCompact ? 20 : 40 }]}>
            <TouchableOpacity 
              style={[styles.menuButton, pathname === '/schedule' && styles.menuButtonActive, { paddingVertical: isCompact ? 12 : 16 }]}
              onPress={() => router.replace('/schedule')}
            >
              <Text style={pathname === '/schedule' ? styles.menuTextActive : styles.menuText}>
                📅 Розклад груп
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuButton, pathname === '/map' && styles.menuButtonActive, { paddingVertical: isCompact ? 12 : 16 }]}
              onPress={() => router.replace('/map')}
            >
              <Text style={pathname === '/map' ? styles.menuTextActive : styles.menuText}>
                📍 Мапа корпусу
              </Text>
            </TouchableOpacity>
          </View>

          {/* Обгортка для віджета подій з гнучкістю */}
          <View style={styles.widgetWrapper}>
            <EventsWidget />
          </View>

          {/* ЖИВИЙ ГОДИННИК */}
          <View style={styles.clockContainer}>
            <Text 
              style={[styles.time, { fontSize: isCompact || width < 1024 ? 50 : 80 }]}
              numberOfLines={1}
              adjustsFontSizeToFit // Дозволяє тексту стискатися
            >
              {formatTime(currentTime)}
            </Text>
            <Text style={[styles.date, { fontSize: isCompact ? 18 : 24 }]}>{formatDate(currentTime)}</Text>
            <Text style={[styles.day, { fontSize: isCompact ? 18 : 24 }]}>{formatDay(currentTime)}</Text>
          </View>

        </View>
      )}

      {/* ПРАВА ЧАСТИНА (Тут показується розклад або мапа) */}
      <View style={styles.mainContent}>
        <Slot /> 
      </View>

      {/* ПРОСТЕ МОБІЛЬНЕ МЕНЮ (якщо це телефон) */}
      {isMobile && (
        <View style={styles.mobileBottomBar}>
          <TouchableOpacity onPress={() => router.replace('/schedule')} style={styles.mobileTab}>
            <Text style={pathname === '/schedule' ? styles.menuTextActive : styles.menuText}>📅 Розклад</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/map')} style={styles.mobileTab}>
            <Text style={pathname === '/map' ? styles.menuTextActive : styles.menuText}>📍 Мапа</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
  
  sidebar: { 
    backgroundColor: Colors.sidebar, 
    alignItems: 'center',
    justifyContent: 'space-between',
    // flexShrink: 0 не дає сайдбару сплющитися більше, ніж треба
    flexShrink: 0,
  },
  
  logoContainer: { 
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
  
  menuContainer: { width: '100%', paddingHorizontal: 20 },
  
  menuButton: { paddingHorizontal: 20, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  menuButtonActive: { backgroundColor: Colors.primary },
  menuText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  menuTextActive: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },

  widgetWrapper: {
    flex: 1, // Дозволяє віджету розтягуватися або стискатися
    width: '100%',
    paddingHorizontal: 15,
    marginVertical: 10,
    justifyContent: 'center',
    overflow: 'hidden', // Обрізає те, що не влазить
  },

  clockContainer: { alignItems: 'center', paddingHorizontal: 10 },
  time: { fontWeight: 'bold', color: Colors.white, letterSpacing: 2, textAlign: 'center' },
  date: { color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  day: { color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  
  mainContent: { flex: 1, position: 'relative' },

  mobileBottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 70,
    backgroundColor: Colors.sidebar,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155'
  },
  mobileTab: {
    padding: 10,
    alignItems: 'center'
  }
});
