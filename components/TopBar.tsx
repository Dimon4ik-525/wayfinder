import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/theme';

// Додаємо типи: тепер TopBar очікує отримати поточну дату і функцію для її зміни
type TopBarProps = {
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
};

export default function TopBar({ selectedDate, onDateChange }: TopBarProps) {
  
  // Функція для перемикання днів (+1 або -1 день)
  const changeDay = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate); // Відправляємо нову дату на головний екран
  };

  // Функція для красивого тексту українською
  const formatDate = (date: Date) => {
    const months = ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

  return (
    <View style={styles.topBar}>
      {/* Вибір групи */}
      <View style={styles.groupSelector}>
        <Text style={styles.groupTextLabel}>Група:</Text>
        <Text style={styles.groupTextValue}>КН-1</Text>
      </View>

      {/* КАЛЕНДАР (Перемикач дат) */}
      <View style={styles.dateSelector}>
        {/* Кнопка "Вчора" */}
        <TouchableOpacity onPress={() => changeDay(-1)} style={styles.arrowBtn}>
          <Text style={styles.arrowText}>{"<"}</Text>
        </TouchableOpacity>

        {/* Плашка з датою */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>📅 {formatDate(selectedDate)}</Text>
        </View>

        {/* Кнопка "Завтра" */}
        <TouchableOpacity onPress={() => changeDay(1)} style={styles.arrowBtn}>
          <Text style={styles.arrowText}>{">"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Додали justifyContent: 'space-between', щоб розкинути Групу і Календар по краях
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'space-between' },
  groupSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  groupTextLabel: { fontSize: 18, color: Colors.textSecondary, marginRight: 8 },
  groupTextValue: { fontSize: 18, fontWeight: 'bold', color: Colors.textMain },
  
  // Стилі для нового календаря
  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrowBtn: { 
    backgroundColor: Colors.white, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  arrowText: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  dateBadge: {
    backgroundColor: Colors.primaryGhost,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  dateBadgeText: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
});