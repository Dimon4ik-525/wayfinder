import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, useWindowDimensions } from 'react-native';
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
  
  // 🔥 Отримуємо розміри екрана для адаптивності
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const isActive = status === 'active';
  const isPast = status === 'past';

  const borderColor = isActive ? Colors.primary : (isPast ? Colors.background : '#E2E8F0');
  const timeColor = isActive ? Colors.primary : (isPast ? Colors.textSecondary : Colors.textMain);
  const badgeBgColor = isActive ? Colors.primaryGhost : (isPast ? Colors.background : '#FDF4FF'); 
  const badgeTextColor = isActive ? Colors.primary : (isPast ? Colors.textSecondary : '#D946EF');

  const handleMapNavigation = (room: string) => {
    const lowerRoom = room.toLowerCase();
    
    if (lowerRoom.includes('актова') || lowerRoom.includes('нувгп')) {
      if (Platform.OS === 'web') {
        window.alert("В розробці 🛠\n\nЦей об'єкт ще не додано на мапу. Працюємо над цим!");
      } else {
        Alert.alert("В розробці 🛠", "Цей об'єкт ще не додано на мапу. Працюємо над цим!");
      }
      return; 
    }

    router.push({
      pathname: '/map', 
      params: { 
        room: room,
        fromSchedule: 'true'
       } 
    });
  };

  return (
    <View style={[
      styles.cardContainer, 
      { 
        borderColor: borderColor,
        // 🔥 На мобільному зменшуємо відступи всередині картки та між ними
        padding: isMobile ? 8 : 12,
        marginBottom: isMobile ? 10 : 12
      }
    ]}>
      
      {/* ЛІВА ЧАСТИНА: ЧАС ТА СТАТУС */}
      <View style={[
        styles.timeSection,
        {
          // 🔥 Звужуємо секцію часу на телефоні
          width: isMobile ? 70 : 85,
          paddingRight: isMobile ? 8 : 12,
          marginRight: isMobile ? 8 : 12
        }
      ]}>
        <Text style={styles.lessonNumber}>{lessonNumber} ПАРА</Text>
        <Text style={[styles.timeText, { color: timeColor, fontSize: isMobile ? 16 : 18 }]}>{timeStart}</Text>
        <Text style={[styles.timeEndText, { color: timeColor, fontSize: isMobile ? 11 : 12 }]}>{timeEnd}</Text>
        
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: badgeBgColor,
            paddingVertical: isMobile ? 4 : 6,
            marginTop: isMobile ? 6 : 10
          }
        ]}>
          <Text style={[
            styles.statusText, 
            { 
              color: badgeTextColor, 
              textAlign: 'center',
              fontSize: isMobile ? 9 : 11
            }
          ]}>
            {isActive ? 'ЗАРАЗ' : (isPast ? 'БУЛА' : 'БУДЕ')}
          </Text>
        </View>
      </View>

      {/* ПРАВА ЧАСТИНА: ПРЕДМЕТИ */}
      <View style={styles.rightContent}>
        {subLessons.map((sub, idx) => {
          const isActiveWeek = 
            (!sub.isNumerator && !sub.isDenominator) || 
            (sub.isNumerator && currentWeekType === 'Чисельник') ||
            (sub.isDenominator && currentWeekType === 'Знаменник') ||
            currentWeekType === ''; 

          const canNavigate = isActiveWeek && sub.room !== '—';

          return (
            <View key={idx} style={[styles.subLessonRow, idx > 0 && styles.divider, { paddingVertical: isMobile ? 6 : 10 }]}>
              
              <View style={[styles.infoCol, !isActiveWeek && { opacity: 0.3 }]}>
                {(sub.isNumerator || sub.isDenominator) && (
                  <Text style={[styles.weekTag, { fontSize: isMobile ? 9 : 10 }]}>
                    {sub.isNumerator ? 'Чисельник' : 'Знаменник'}
                  </Text>
                )}
                
                <Text style={[
                  styles.subjectText, 
                  isPast && { color: Colors.textSecondary },
                  { fontSize: isMobile ? 14 : 15 } // Трохи менший шрифт предмету
                ]}>
                  {sub.subject}
                </Text>
                
                {sub.subgroup ? (
                  <Text style={[styles.subgroupText, { fontSize: isMobile ? 11 : 12 }]}>{sub.subgroup}</Text>
                ) : null}

                <Text style={[styles.teacherText, { fontSize: isMobile ? 11 : 12 }]}>{sub.teacher}</Text>
              </View>

              <View style={[styles.actionCol, !isActiveWeek && { opacity: 0.3 }]}>
                <View style={[styles.roomBadge, { paddingHorizontal: isMobile ? 8 : 10, paddingVertical: isMobile ? 4 : 6 }]}>
                  <Text style={[styles.roomText, { fontSize: isMobile ? 11 : 13 }]}>📍 каб. {sub.room}</Text>
                </View>

                <TouchableOpacity 
                  style={[
                    styles.routeButton, 
                    (!canNavigate || isPast) && styles.routeButtonDisabled,
                    // 🔥 Робимо кнопку компактнішою
                    isMobile && { paddingHorizontal: 12, paddingVertical: 8, minWidth: 80 }
                  ]} 
                  disabled={!canNavigate}
                  onPress={() => handleMapNavigation(sub.room)} 
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.routeButtonText, 
                    (!canNavigate || isPast) && { color: '#9CA3AF' },
                    { fontSize: isMobile ? 11 : 13 }
                  ]}>
                    {/* 🔥 На телефоні пишемо просто "Мапа" */}
                    {isMobile ? 'Мапа' : 'Як пройти?'}
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
  // Базові стилі (будуть перезаписуватись динамічними вище)
  cardContainer: { 
    flexDirection: 'row', 
    backgroundColor: Colors.white, 
    borderRadius: 12, 
    borderWidth: 2, 
  },
  timeSection: { 
    borderRightWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'center',
    justifyContent: 'center'
  },
  lessonNumber: { fontSize: 10, color: Colors.textSecondary, fontWeight: 'bold', marginBottom: 2 }, 
  timeText: { fontWeight: 'bold' }, 
  timeEndText: { opacity: 0.7 }, 
  
  statusBadge: { 
    paddingHorizontal: 8, 
    borderRadius: 8, 
    width: '100%', 
    alignItems: 'center' 
  },
  statusText: { 
    fontWeight: '900', 
    letterSpacing: 0.5 
  }, 
  
  rightContent: { flex: 1, justifyContent: 'center' },
  subLessonRow: { flexDirection: 'row', alignItems: 'center' }, 
  divider: { borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  infoCol: { flex: 1, paddingRight: 6, justifyContent: 'center' },
  actionCol: { alignItems: 'flex-end', justifyContent: 'center', gap: 6 }, 
  
  weekTag: { fontWeight: 'bold', color: '#64748B', backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  subjectText: { fontWeight: 'bold', color: Colors.textMain, marginBottom: 2 }, 
  subgroupText: { fontWeight: 'bold', color: Colors.primary, marginBottom: 2 },
  teacherText: { color: Colors.textSecondary }, 
  
  roomBadge: { backgroundColor: Colors.background, borderRadius: 100, marginBottom: 4 }, 
  roomText: { color: Colors.textMain, fontWeight: 'bold' }, 
  
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
    fontWeight: 'bold' 
  }, 
});