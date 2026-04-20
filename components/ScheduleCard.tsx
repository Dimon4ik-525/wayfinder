import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; 
import { Colors } from '../constants/theme';

export type ScheduleCardProps = {
  lessonNumber: number;
  timeStart: string;
  timeEnd: string;
  subject: string;
  teacher: string;
  room: string;
  status: 'past' | 'active' | 'upcoming';
};

export default function ScheduleCard({ lessonNumber, timeStart, timeEnd, subject, teacher, room, status }: ScheduleCardProps) {
  const router = useRouter(); 
  
  const isActive = status === 'active';
  const isPast = status === 'past';

  const borderColor = isActive ? Colors.primary : (isPast ? Colors.background : '#E2E8F0');
  const timeColor = isActive ? Colors.primary : (isPast ? Colors.textSecondary : Colors.textMain);
  const badgeBgColor = isActive ? Colors.primaryGhost : (isPast ? Colors.background : '#FDF4FF'); 
  const badgeTextColor = isActive ? Colors.primary : (isPast ? Colors.textSecondary : '#D946EF');

  return (
    <View style={[styles.cardContainer, { borderColor: borderColor }]}>
      <View style={styles.timeSection}>
        <Text style={styles.lessonNumber}>{lessonNumber} ПАРА</Text>
        <Text style={[styles.timeText, { color: timeColor }]}>{timeStart}</Text>
        <Text style={[styles.timeEndText, { color: timeColor }]}>{timeEnd}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.subjectText, isPast && { color: Colors.textSecondary }]}>{subject}</Text>
        <Text style={styles.teacherText}>{teacher}</Text>
      </View>

      <View style={styles.actionSection}>
        <View style={[styles.statusBadge, { backgroundColor: badgeBgColor }]}>
          <Text style={[styles.statusText, { color: badgeTextColor }]}>
            {isActive ? 'ЗАРАЗ ІДЕ' : (isPast ? 'ЗАВЕРШЕНО' : 'НАСТУПНА')}
          </Text>
        </View>

        <View style={styles.roomBadge}>
          <Text style={styles.roomText}>📍 каб. {room}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.routeButton, isPast && styles.routeButtonDisabled]} 
          disabled={isPast}
          onPress={() => router.push('/map')} 
        >
          <Text style={[styles.routeButtonText, isPast && { color: Colors.textSecondary }]}>Як пройти?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Зменшені стилі для карток
const styles = StyleSheet.create({
  cardContainer: { 
    flexDirection: 'row', 
    backgroundColor: Colors.white, 
    borderRadius: 12, // Зменшено
    borderWidth: 2, 
    padding: 16, // Зменшено з 20
    alignItems: 'center', 
    marginBottom: 12 // Зменшено з 16
  },
  timeSection: { 
    width: 70, // Зменшено
    borderRightWidth: 1, 
    borderColor: '#E2E8F0', 
    marginRight: 16 // Зменшено
  },
  lessonNumber: { fontSize: 10, color: Colors.textSecondary, fontWeight: 'bold', marginBottom: 2 }, // Зменшено
  timeText: { fontSize: 18, fontWeight: 'bold' }, // Зменшено
  timeEndText: { fontSize: 12, opacity: 0.7 }, // Зменшено
  infoSection: { flex: 1 },
  subjectText: { fontSize: 16, fontWeight: 'bold', color: Colors.textMain, marginBottom: 2 }, // Зменшено
  teacherText: { fontSize: 13, color: Colors.textSecondary }, // Зменшено
  actionSection: { flexDirection: 'row', alignItems: 'center', gap: 10 }, // Зменшено
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 10, fontWeight: 'bold' }, // Зменшено
  roomBadge: { backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  roomText: { color: Colors.textMain, fontSize: 12, fontWeight: 'bold' }, // Зменшено
  routeButton: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  routeButtonDisabled: { backgroundColor: Colors.background },
  routeButtonText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' }, // Зменшено
});