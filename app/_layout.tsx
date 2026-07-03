import { Slot, useRouter, usePathname } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Colors } from '../constants/theme'; 
import EventsWidget from '../components/EventsWidget';
import AdmissionBanner from '../components/AdmissionBanner';
import LiveClock from '../components/LiveClock'; // 🔥 Додали імпорт нашого нового годинника

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname(); 
  
  const { width, height } = useWindowDimensions();

  // Логіка адаптивності (3 стани)
  const isCompact = height < 800; 
  const isMobile = width < 500;   
  const isCollapsed = width < 900 && !isMobile; 

  const dynamicSidebarWidth = isCollapsed ? 90 : Math.min(Math.max(width * 0.20, 220), 260);

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
          { 
            width: dynamicSidebarWidth, 
            paddingTop: isCompact ? 15 : 25, 
            paddingBottom: isCompact ? 20 : 40,
          }
        ]}>
          
          {/* ВЕРХНЯ ЧАСТИНА: ЛОГО + МЕНЮ */}
          <View style={styles.sidebarTop}>
            
            {/* ЛОГОТИП */}
            <View style={[
              styles.logoContainer,
              { 
                width: isCollapsed ? 60 : (isCompact ? 80 : 90), 
                height: isCollapsed ? 60 : (isCompact ? 80 : 90),
                borderRadius: isCollapsed ? 12 : 16,
                marginLeft: isCollapsed ? 0 : 20, 
                alignSelf: isCollapsed ? 'center' : 'flex-start',
              }
            ]}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logoImage} 
                resizeMode="contain" 
              />
            </View>

            {/* НАВІГАЦІЙНЕ МЕНЮ */}
            <View style={[styles.menuContainer, { 
              marginTop: isCompact ? 20 : 35,
              paddingHorizontal: isCollapsed ? 10 : 20 
            }]}>
              <TouchableOpacity 
                style={[
                  styles.menuButton, 
                  pathname === '/schedule' && styles.menuButtonActive, 
                  { 
                    paddingVertical: isCompact ? 12 : 16,
                    justifyContent: isCollapsed ? 'center' : 'flex-start', 
                    paddingHorizontal: isCollapsed ? 0 : 20
                  }
                ]}
                onPress={() => router.replace('/schedule')}
              >
                <Text style={[pathname === '/schedule' ? styles.menuTextActive : styles.menuText, { fontSize: isCollapsed ? 26 : 16 }]}>
                  {isCollapsed ? '📅' : '📅 Розклад груп'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.menuButton, 
                  pathname === '/map' && styles.menuButtonActive, 
                  { 
                    paddingVertical: isCompact ? 12 : 16,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    paddingHorizontal: isCollapsed ? 0 : 20
                  }
                ]}
                onPress={() => router.replace('/map')}
              >
                <Text style={[pathname === '/map' ? styles.menuTextActive : styles.menuText, { fontSize: isCollapsed ? 26 : 16 }]}>
                  {isCollapsed ? '📍' : '📍 Мапа корпусу'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ВІДЖЕТ ПОДІЙ  + ВІДЖЕТ ПРИЙМАЛЬНОЇ КОМІСІЇ */}
          {!isCollapsed && (
            <View style={{ flex: 1, width: '100%' }}>
              <AdmissionBanner />
              <View style={styles.widgetWrapper}>
                <EventsWidget />
              </View>
            </View>
          )}

          {/* НИЖНЯ ЧАСТИНА: ГОДИННИК ТА НАЛАШТУВАННЯ */}
          <View style={styles.sidebarBottom}>
            
            {/* 🔥 Викликаємо наш новий незалежний годинник */}
            <LiveClock 
              isCollapsed={isCollapsed} 
              isCompact={isCompact} 
              dynamicSidebarWidth={dynamicSidebarWidth} 
            />

            {/* КНОПКА НАЛАШТУВАНЬ (ШЕСТІРНЯ) */}
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/settings' as any)}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

        </View>
      )}

      {/* ПРАВА ЧАСТИНА */}
      <View style={styles.mainContent}>
        <Slot /> 
      </View>

      {/* НИЖНЄ МЕНЮ ДЛЯ МОБІЛОК */}
      {isMobile && (
        <View style={styles.mobileBottomBar}>
          <TouchableOpacity onPress={() => router.replace('/schedule')} style={styles.mobileTab}>
            <Text style={pathname === '/schedule' ? styles.menuTextActive : styles.menuText}>📅 Розклад</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/map')} style={styles.mobileTab}>
            <Text style={pathname === '/map' ? styles.menuTextActive : styles.menuText}>📍 Мапа</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings' as any)} style={styles.mobileTab}>
            <Text style={pathname === '/settings' ? styles.menuTextActive : styles.menuText}>⚙️ Налашт.</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', height: '100%', backgroundColor: Colors.background },
  
  sidebar: { 
    backgroundColor: Colors.sidebar, 
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0, 
    height: '100%',
  },

  sidebarTop: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  
  logoContainer: { 
    backgroundColor: Colors.white, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 16,
    padding: 10,
    marginTop: 5, 
  },
  logoImage: { width: '100%', height: '100%' },
  
  menuContainer: { width: '100%' },
  menuButton: { borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  menuButtonActive: { backgroundColor: Colors.primary },
  menuText: { color: Colors.textSecondary, fontWeight: '600' },
  menuTextActive: { color: Colors.white, fontWeight: 'bold' },

  widgetWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },

  sidebarBottom: {
    width: '100%',
    alignItems: 'center',
    position: 'relative', 
  },
  
  settingsButton: {
    position: 'absolute',
    bottom: -10, 
    right: 20,   
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: { fontSize: 20 },

  mainContent: { flex: 1, position: 'relative', height: '100%' },

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