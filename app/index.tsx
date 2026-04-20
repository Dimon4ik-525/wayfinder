import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme'; // ПІДКЛЮЧАЄМО ТЕМУ

export default function Screensaver() {
  const router = useRouter();

  return (
    // Тепер весь екран реагує на дотик
    <Pressable 
      style={styles.container} 
      onPress={() => router.push('/schedule')}
    >
      
      {/* Кнопка з ефектом "подвійної обводки" */}
      <View style={styles.buttonOuterRing}>
        <View style={styles.buttonInner}>
          <Text style={styles.buttonText}>ПОЧАТИ ПОШУК</Text>
        </View>
      </View>
      
      {/* Підказка знизу */}
      <Text style={styles.hintText}>
        Торкніться екрана, щоб перейти до розкладу та карти
      </Text>

    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background, // Тема
  },
  buttonOuterRing: {
    backgroundColor: Colors.primaryLight, // Тема
    padding: 8, 
    borderRadius: 100,
  },
  buttonInner: {
    backgroundColor: Colors.primary, // Тема
    paddingVertical: 24,
    paddingHorizontal: 60,
    borderRadius: 100,
  },
  buttonText: {
    color: Colors.white, // Тема
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hintText: {
    marginTop: 30,
    fontSize: 20,
    color: Colors.textSecondary, // Тема
  }
});