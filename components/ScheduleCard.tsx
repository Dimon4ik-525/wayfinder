import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router'; 
import { Colors } from '../constants/theme';

export type SubLesson = {
  subject: string;
  teacher: string;
  room: string;
  subgroup: string | null;
  isNumerator: boolean;
  isDenominator: boolean;
};

export type ScheduleCardProps = {
  lessonId?: number;
  lessonNumber: number | string;
  timeStart: string;
  timeEnd: string;
  status: 'past' | 'active' | 'upcoming';
  subLessons: SubLesson[];
  currentWeekType: string;
};

export default function ScheduleCard({ lessonNumber, timeStart, timeEnd, status, subLessons, currentWeekType }: ScheduleCardProps) {
  const router = useRouter(); 
  
  const isActive = status === 'active';
  const isPast = status === 'past';

  const borderColor = isActive ? Colors.primary : (isPast ? Colors.background : '#E2E8F0');
  const timeColor = isActive ? Colors.primary : (isPast ? Colors.textSecondary : Colors.textMain);
  const badgeBgColor = isActive ? Colors.primaryGhost : (isPast ? Colors.background : '#FDF4FF'); 
  const badgeTextColor = isActive ? Colors.primary : (isPast ? Colors.textSecondary : '#D946EF');

  const handleMapNavigation = (room: string) => {
    const lowerRoom = room.toLowerCase();
    
    if (lowerRoom.includes('с/к') || lowerRoom.includes('спортзал') || lowerRoom.includes('актова') || lowerRoom.includes('тир')) {
      if (Platform.OS === 'web') {
        window.alert("В розробці 🛠\n\nЦей об'єкт ще не додано на мапу. Працюємо над цим!");
      } else {
        Alert.alert("В розробці 🛠", "Цей об'єкт ще не додано на мапу. Працюємо над цим!");
      }
      return; 
    }

    router.push({
      pathname: '/map', 
      params: { room: room } 
    });
  };

  return (
    <View style={[styles.cardContainer, { borderColor: borderColor }]}>
      
      {/* ЛІВА ЧАСТИНА: ЧАС ТА СТАТУС */}
      <View style={styles.timeSection}>
        <Text style={styles.lessonNumber}>{lessonNumber} ПАРА</Text>
        <Text style={[styles.timeText, { color: timeColor }]}>{timeStart}</Text>
        <Text style={[styles.timeEndText, { color: timeColor }]}>{timeEnd}</Text>
        
        {/* 🔥 ЗБІЛЬШЕНИЙ БЕЙДЖ СТАТУСУ */}
        <View style={[styles.statusBadge, { backgroundColor: badgeBgColor }]}>
          <Text style={[styles.statusText, { color: badgeTextColor, textAlign: 'center' }]}>
            {isActive ? 'ЗАРАЗ' : (isPast ? 'БУЛА' : 'БУДЕ')}
          </Text>
        </View>
      </View>

      {/* ПРАВА ЧАСТИНА: ПРЕДМЕТИ (Чисельник / Знаменник) */}
      <View style={styles.rightContent}>
        {subLessons.map((sub, idx) => {
          const isActiveWeek = 
            (!sub.isNumerator && !sub.isDenominator) || 
            (sub.isNumerator && currentWeekType === 'Чисельник') ||
            (sub.isDenominator && currentWeekType === 'Знаменник') ||
            currentWeekType === ''; 

          const canNavigate = isActiveWeek && sub.room !== '—';

          return (
            <View key={idx} style={[styles.subLessonRow, idx > 0 && styles.divider]}>
              
              <View style={[styles.infoCol, !isActiveWeek && { opacity: 0.3 }]}>
                {(sub.isNumerator || sub.isDenominator) && (
                  <Text style={styles.weekTag}>
                    {sub.isNumerator ? 'Чисельник' : 'Знаменник'}
                  </Text>
                )}
                
                <Text style={[styles.subjectText, isPast && { color: Colors.textSecondary }]}>
                  {sub.subject}
                </Text>
                
                {sub.subgroup ? (
                  <Text style={styles.subgroupText}>{sub.subgroup}</Text>
                ) : null}

                <Text style={styles.teacherText}>{sub.teacher}</Text>
              </View>

              <View style={[styles.actionCol, !isActiveWeek && { opacity: 0.3 }]}>
                <View style={styles.roomBadge}>
                  <Text style={styles.roomText}>📍 каб. {sub.room}</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.routeButton, (!canNavigate || isPast) && styles.routeButtonDisabled]} 
                  disabled={!canNavigate}
                  onPress={() => handleMapNavigation(sub.room)} 
                  activeOpacity={0.8}
                >
                  <Text style={[styles.routeButtonText, (!canNavigate || isPast) && { color: '#9CA3AF' }]}>
                    Як пройти?
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          );
        })}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { 
    flexDirection: 'row', 
    backgroundColor: Colors.white, 
    borderRadius: 12, 
    borderWidth: 2, 
    padding: 12, 
    marginBottom: 12 
  },
  timeSection: { 
    width: 85, // 🔥 Збільшив ширину секції, щоб вмістити більший статус
    borderRightWidth: 1, 
    borderColor: '#E2E8F0', 
    paddingRight: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  lessonNumber: { fontSize: 10, color: Colors.textSecondary, fontWeight: 'bold', marginBottom: 2 }, 
  timeText: { fontSize: 18, fontWeight: 'bold' }, 
  timeEndText: { fontSize: 12, opacity: 0.7 }, 
  
  // 🔥 Оновлені стилі для статусу
  statusBadge: { 
    marginTop: 10, // Трохи більше відступу від часу
    paddingHorizontal: 8, 
    paddingVertical: 6, // Більший внутрішній відступ по вертикалі
    borderRadius: 8, // Більш округлі краї
    width: '100%', 
    alignItems: 'center' 
  },
  statusText: { 
    fontSize: 11, // Збільшений шрифт (було 9)
    fontWeight: '900', // Зробив текст товстішим
    letterSpacing: 0.5 // Додав простір між літерами для кращої читабельності
  }, 
  
  rightContent: { flex: 1, justifyContent: 'center' },
  subLessonRow: { flexDirection: 'row', paddingVertical: 10, alignItems: 'center' }, 
  divider: { borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  infoCol: { flex: 1, paddingRight: 10, justifyContent: 'center' },
  actionCol: { alignItems: 'flex-end', justifyContent: 'center', gap: 8 }, 
  
  weekTag: { fontSize: 10, fontWeight: 'bold', color: '#64748B', backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  subjectText: { fontSize: 15, fontWeight: 'bold', color: Colors.textMain, marginBottom: 2 }, 
  subgroupText: { fontSize: 12, fontWeight: 'bold', color: Colors.primary, marginBottom: 2 },
  teacherText: { fontSize: 12, color: Colors.textSecondary }, 
  
  roomBadge: { backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, marginBottom: 4 }, 
  roomText: { color: Colors.textMain, fontSize: 13, fontWeight: 'bold' }, 
  
  routeButton: { 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 100,
    minWidth: 110, 
    alignItems: 'center',
    justifyContent: 'center'
  },
  routeButtonDisabled: { 
    backgroundColor: '#F1F5F9' 
  },
  routeButtonText: { 
    color: Colors.white, 
    fontSize: 13, 
    fontWeight: 'bold' 
  }, 
});