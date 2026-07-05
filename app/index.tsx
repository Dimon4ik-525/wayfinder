import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router'; 
import { Colors } from '../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter(); // Ініціалізуємо роутер

  // Функція для переходу в основний додаток
  const handleStart = () => {
    router.replace('/schedule'); // replace замінює поточний екран
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.content}>
        {/* 🔥 Оновлений блок логотипу: тепер квадратний */}
        <View style={styles.logoWrapper}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>
        
        <Text style={styles.title}>Wayfinder</Text>
        <Text style={styles.subtitle}>Твій розумний помічник{'\n'}у коледжі</Text>
      </View>

      {/* КНОПКА ПЕРЕХОДУ */}
      <TouchableOpacity 
        style={styles.startButton} 
        onPress={handleStart}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>Розпочати роботу</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sidebar, // 🔥 Змінено фон на темний (як у сайдбарі)
    justifyContent: 'center', // 🔥 Центруємо вміст
    alignItems: 'center',
    padding: 30,
  },
  content: {
    alignItems: 'center',
    marginBottom: 60, // Відступ перед кнопкою
  },
  // 🔥 Нові стилі для квадратного логотипу
  logoWrapper: {
    width: 180, // Зробили трохи більшим
    height: 180,
    backgroundColor: Colors.white, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 24, // 🎉 Квадрат із закругленими кутами
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10, // Тінь для Android
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 56, // Збільшено
    fontWeight: 'bold',
    color: Colors.white, // 🔥 Білий текст на темному фоні
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 24, // Збільшено
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 32,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 100, // Кнопка залишається овальною
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 22, // Збільшено
    fontWeight: 'bold',
  },
});