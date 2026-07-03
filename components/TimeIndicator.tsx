import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react'; // 🔥 Додали хуки стану та життєвого циклу
import { Colors } from '../constants/theme';

export type LessonLayout = {
  lessonId: number;
  y: number;
  height: number;
  timeStart: string;
  timeEnd: string;
};

type Props = {
  layouts: LessonLayout[];
  // 🔥 now більше не передаємо через пропси
};

function timeToMinutes(time: string): number {
  if (!time || time === '—') return -1;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Константи з ScheduleCard стилів
const CARD_MARGIN_BOTTOM = 12;
const CARD_PADDING = 12;
const CARD_BORDER = 2;
const CARD_OFFSET = CARD_PADDING + CARD_BORDER; // 14px зверху і знизу

export default function TimeIndicator({ layouts }: Props) {
  // 🔥 Створюємо власний швидкий таймер тільки для цієї лінії
  const [internalNow, setInternalNow] = useState(new Date());

  useEffect(() => {
    // Лінія буде плавно оновлюватися кожні 10 секунд
    const timer = setInterval(() => setInternalNow(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  if (layouts.length === 0) return null;

  // 🔥 Використовуємо internalNow замість переданого now
  const currentMinutes = internalNow.getHours() * 60 + internalNow.getMinutes();
  const formattedTime = `${internalNow.getHours().toString().padStart(2, '0')}:${internalNow.getMinutes().toString().padStart(2, '0')}`;

  const sorted = [...layouts].sort((a, b) => a.y - b.y);

  const firstStart = timeToMinutes(sorted[0].timeStart);
  const lastEnd = timeToMinutes(sorted[sorted.length - 1].timeEnd);

  if (currentMinutes < firstStart || currentMinutes > lastEnd) return null;

  let lineY = 0;

  for (let i = 0; i < sorted.length; i++) {
    const lesson = sorted[i];
    const start = timeToMinutes(lesson.timeStart);
    const end = timeToMinutes(lesson.timeEnd);

    if (currentMinutes >= start && currentMinutes <= end) {
      const ratio = (currentMinutes - start) / (end - start);
      // Реальна висота вмісту картки (без margin, padding і border)
      const cardInnerHeight = lesson.height - CARD_MARGIN_BOTTOM - CARD_OFFSET * 2;
      lineY = lesson.y + CARD_OFFSET + ratio * cardInnerHeight;
      break;
    }

    if (i < sorted.length - 1) {
      const nextLesson = sorted[i + 1];
      const nextStart = timeToMinutes(nextLesson.timeStart);

      if (currentMinutes > end && currentMinutes < nextStart) {
        const gapTop = lesson.y + (lesson.height - CARD_MARGIN_BOTTOM) - 1; // було - 1
        lineY = gapTop;
        break;
      }  
    }
  }

  return (
    <View style={[styles.container, { top: lineY }]} pointerEvents="none">
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{formattedTime}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  badge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    elevation: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.error,
  },
});