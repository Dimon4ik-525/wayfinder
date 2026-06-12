import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useState, createElement } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { Colors } from '../constants/theme';

type TopBarProps = {
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
};

export default function TopBar({ selectedDate, onDateChange }: TopBarProps) {
  const [showPicker, setShowPicker] = useState(false);

  const changeDay = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate);
  };

  const handleDateChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false); 
    }
    if (selected) {
      onDateChange(selected);
    }
  };

  const formatDate = (date: Date) => {
    const months = ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

  // 🔥 РОЗУМНА ФУНКЦІЯ ВИКЛИКУ КАЛЕНДАРЯ
  const openPicker = () => {
    if (Platform.OS === 'web') {
      // Знаходимо наш схований інпут і програмно відкриваємо його
      const inputEl = document.getElementById('web-date-input');
      if (inputEl) {
        try {
          (inputEl as any).showPicker();
        } catch (e) {
          // Якщо браузер дуже старий
          inputEl.focus(); 
        }
      }
    } else {
      // Для мобільних телефонів
      setShowPicker(true);
    }
  };

  return (
    <View style={styles.topBar}>
      {/* КАЛЕНДАР */}
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDay(-1)} style={styles.arrowBtn}>
          <Text style={styles.arrowText}>{"<"}</Text>
        </TouchableOpacity>

        <View style={{ position: 'relative' }}>
          {/* Кнопка виклику календаря */}
          <TouchableOpacity onPress={openPicker}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>📅 {formatDate(selectedDate)}</Text>
            </View>
          </TouchableOpacity>

          {/* Схований інпут для Web, який ми викликаємо за ID */}
          {Platform.OS === 'web' && createElement('input', {
            id: 'web-date-input',
            type: 'date',
            // Коригуємо часовий пояс для правильного відображення в інпуті
            value: new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0],
            onChange: (event: any) => {
              if (event.target.value) onDateChange(new Date(event.target.value));
            },
            style: { width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }
          })}
        </View>

        <TouchableOpacity onPress={() => changeDay(1)} style={styles.arrowBtn}>
          <Text style={styles.arrowText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {/* Нативний календар для iOS/Android */}
      {showPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end' // Зміщено праворуч, оскільки група тепер зліва
  },
  dateSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
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