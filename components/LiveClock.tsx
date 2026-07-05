import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface LiveClockProps {
  isCollapsed: boolean;
  isCompact: boolean;
  dynamicSidebarWidth: number;
}

export default function LiveClock({ isCollapsed, isCompact, dynamicSidebarWidth }: LiveClockProps) {
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
    <View style={styles.clockContainer}>
      <Text 
        style={[styles.time, { fontSize: isCollapsed ? 20 : (isCompact || dynamicSidebarWidth < 260 ? 50 : 80) }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatTime(currentTime)}
      </Text>
      {!isCollapsed && <Text style={[styles.date, { fontSize: isCompact ? 18 : 24 }]}>{formatDate(currentTime)}</Text>}
      {!isCollapsed && <Text style={[styles.day, { fontSize: isCompact ? 18 : 24 }]}>{formatDay(currentTime)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  clockContainer: { alignItems: 'center', paddingHorizontal: 10, marginBottom: 20 },
  time: { fontWeight: 'bold', color: Colors.white, letterSpacing: 2, textAlign: 'center' },
  date: { color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  day: { color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
});