import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useState, useEffect } from 'react'; 
import TopBar from '../components/TopBar';
import Substitutions from '../components/Substitutions';
import ScheduleCard, { ScheduleCardProps } from '../components/ScheduleCard';
import { Colors } from '../constants/theme';

// Оновлений масив із 6-ма парами
const MOCK_SCHEDULE: ScheduleCardProps[] = [
  { lessonNumber: 1, timeStart: '09:00', timeEnd: '10:20', subject: 'Програмування і підтримка вебзастосувань', teacher: 'Попружук О.М.', room: '11', status: 'past' },
  { lessonNumber: 2, timeStart: '10:30', timeEnd: '11:50', subject: 'Комп\'ютерні мережі та системи', teacher: 'Іванов О.П.', room: '11', status: 'past' },
  { lessonNumber: 3, timeStart: '12:20', timeEnd: '13:40', subject: 'Рівняння та методи математичної фізики', teacher: 'Сінчук А.М.', room: '1', status: 'past' },
  { lessonNumber: 4, timeStart: '13:50', timeEnd: '15:10', subject: 'Менеджмент ІТ-проєктів', teacher: 'Петренко В.І.', room: '42', status: 'active' },
  { lessonNumber: 5, timeStart: '15:20', timeEnd: '16:40', subject: 'Основи кібербезпеки', teacher: 'Коваль Т.М.', room: '18', status: 'upcoming' },
  { lessonNumber: 6, timeStart: '16:50', timeEnd: '18:10', subject: 'Фізичне виховання', teacher: 'Сидоренко В.В.', room: 'Спортзал', status: 'upcoming' }
];

export default function ScheduleScreen() {
  // Стан для календаря (обрана дата)
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Стан для живого часу
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Перевірка: чи дивимось ми розклад на сьогодні?
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  
  const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const calculateLineTop = () => {
    const startHour = 9; // Початок першої пари
    const PIXELS_PER_HOUR = 78; // Масштаб для компактних карток
    
    const totalMinutesPassed = ((now.getHours() - startHour) * 60) + now.getMinutes();
    const position = (totalMinutesPassed / 60) * PIXELS_PER_HOUR;
    
    return Math.max(0, position);
  };

  return (
    <View style={styles.container}>
      
      {/* ПЕРЕДАЄМО ПАРАМЕТРИ В TOPBAR */}
      <TopBar selectedDate={selectedDate} onDateChange={setSelectedDate} />
      
      <Substitutions />

      <View style={styles.listContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 40, width: '100%' }}
        >
          
          {/* ЛІНІЯ ЧАСУ: показуємо лише для сьогоднішньої дати */}
          {isToday && (
            <View style={[styles.redLineContainer, { top: calculateLineTop() }]}>
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>{formattedTime}</Text>
              </View>
              <View style={styles.redLine} />
            </View>
          )}

          {MOCK_SCHEDULE.map((lesson, index) => (
            <ScheduleCard 
              key={index}
              {...lesson} 
            />
          ))}
        </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: Colors.background 
  },
  listContainer: { 
    flex: 1, 
    marginTop: 20, 
    position: 'relative',
    alignItems: 'stretch', 
  },
  redLineContainer: {
    position: 'absolute',
    left: -10, 
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10, 
  },
  redBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    elevation: 3, 
  },
  redBadgeText: { 
    color: Colors.white, 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  redLine: {
    flex: 1,
    height: 2, 
    backgroundColor: Colors.error,
  },
});