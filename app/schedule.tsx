import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopBar from '../components/TopBar';
import Substitutions from '../components/Substitutions';
import ScheduleCard, { ScheduleCardProps } from '../components/ScheduleCard';
import GroupSelector from '../components/GroupSelector';
import { fetchSchedule } from '../utils/scheduleApi'; 
import { Colors } from '../constants/theme';
import TimeIndicator, { LessonLayout } from '../components/TimeIndicator';

export default function ScheduleScreen() {
  const router = useRouter();
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768; 

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
  const [scheduleData, setScheduleData] = useState<ScheduleCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentWeek, setCurrentWeek] = useState<string>('');
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [lessonLayouts, setLessonLayouts] = useState<LessonLayout[]>([]);

  useEffect(() => {
    const loadSavedGroup = async () => {
      try {
        const shouldKeep = await AsyncStorage.getItem('returnToSchedule');
        await AsyncStorage.removeItem('returnToSchedule');

        if (shouldKeep === 'true') {
          const saved = await AsyncStorage.getItem('lastSelectedGroup');
          if (saved) setSelectedGroup(JSON.parse(saved));
        } else {
          await AsyncStorage.removeItem('lastSelectedGroup');
          setSelectedGroup(null);
        }
      } catch (e) {}
    };
    loadSavedGroup();
  }, []);

  const handleSelectGroup = async (group: any) => {
    setSelectedGroup(group);
    try {
      if (group) await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(group));
    } catch (e) {}
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getLessonStatus = (timeStart: string, timeEnd: string): 'past' | 'active' | 'upcoming' => {
    if (!timeStart || !timeEnd || timeStart === '—') return 'past';

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    if (!isToday) return selectedDate < new Date() ? 'past' : 'upcoming';

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = timeStart.split(':').map(Number);
    const [endH, endM] = timeEnd.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes > endMinutes) return 'past';
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return 'active';
    return 'upcoming';
  };

  useEffect(() => {
    const loadSchedule = async () => {
      if (!selectedGroup) return; 
      
      setIsLoading(true);
      try {
        const rawData = await fetchSchedule(selectedGroup.id);
        
        if (rawData && rawData.schedules && Array.isArray(rawData.schedules)) {

            const weekType = rawData.current_week === 'numerator' ? 'Чисельник' : 
                             rawData.current_week === 'denominator' ? 'Знаменник' : '';
            setCurrentWeek(weekType);

            const todayStr = new Date().toDateString();
            const tomorrowDate = new Date();
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const tomorrowStr = tomorrowDate.toDateString();
            const currentSelectedStr = selectedDate.toDateString();

            if (currentSelectedStr === todayStr && rawData.changes?.today?.items) {
                setSubstitutions(rawData.changes.today.items);
            } else if (currentSelectedStr === tomorrowStr && rawData.changes?.tomorrow?.items) {
                setSubstitutions(rawData.changes.tomorrow.items);
            } else {
                setSubstitutions([]); 
            }

            let selectedDayOfWeek = selectedDate.getDay();
            if (selectedDayOfWeek === 0) selectedDayOfWeek = 7; 

            const dailyLessonsRaw = rawData.schedules.filter((item: any) => item.day_of_week === selectedDayOfWeek);

            const groupedLessons = new Map<number, any[]>();
            dailyLessonsRaw.forEach((item: any) => {
                const id = item.lesson?.id || 99; 
                if (!groupedLessons.has(id)) groupedLessons.set(id, []);
                groupedLessons.get(id)!.push(item);
            });

            const formattedSchedule: ScheduleCardProps[] = [];

            groupedLessons.forEach((lessonsArr, id) => {
                const baseLesson = lessonsArr[0].lesson;

                const subLessons = lessonsArr.map(l => {
                    const typeStr = (l.lesson_type || "").toLowerCase();
                    const isNumerator = typeStr.includes('чисельник');
                    const isDenominator = typeStr.includes('знаменник');
                    const extractedSubgroup = (l.lesson_type || "")
                        .replace(/Звичайна|Чисельник|Знаменник/gi, '')
                        .trim();

                    return {
                        subject: l.subject,
                        teacher: l.teacher || '—',
                        room: l.cabinet || '—',
                        subgroup: extractedSubgroup || null,
                        isNumerator,
                        isDenominator
                    };
                });

                subLessons.sort((a, b) => {
                    if (a.isNumerator && !b.isNumerator) return -1;
                    if (!a.isNumerator && b.isNumerator) return 1;
                    return 0;
                });

                formattedSchedule.push({
                    lessonId: id,
                    lessonNumber: baseLesson?.name || baseLesson?.id || '-', 
                    timeStart: baseLesson?.starts_at || '—',
                    timeEnd: baseLesson?.ends_at || '—',
                    status: getLessonStatus(baseLesson?.starts_at || '', baseLesson?.ends_at || ''),
                    subLessons: subLessons, 
                    currentWeekType: weekType
                });
            });
            
            formattedSchedule.sort((a, b) => (a.lessonId || 99) - (b.lessonId || 99));

            setScheduleData(formattedSchedule);
        } else {
            setScheduleData([]);
            setSubstitutions([]);
            setCurrentWeek('');
        }
      } catch (error) {
        console.error("Помилка при форматуванні розкладу:", error);
        setScheduleData([]);
        setSubstitutions([]);
      }
      setLessonLayouts([]);
      setIsLoading(false);
    };

    loadSchedule();
  }, [selectedGroup, selectedDate]); 

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <View style={styles.container}>
      
      {/* 🔥 ОСНОВНИЙ КОНТЕНТ (СКРОЛ). Він рендериться першим, тому лежить під шапкою */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ 
          // Відступ зверху, щоб звільнити місце для плаваючої шапки
          paddingTop: isMobile ? 180 : 120, 
          // Відступ знизу, щоб пари не налізали на нижнє меню (Tab Bar)
          paddingBottom: 140, 
          paddingHorizontal: isMobile ? 15 : 20 
        }}
        style={styles.scrollArea}
      >
        
        {/* Заміни тепер крутяться разом зі скролом */}
        {substitutions.length > 0 && (
           <Substitutions data={substitutions} />
        )}

        <View style={styles.listContainer}>
          {isLoading ? (
              <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={{color: '#64748B', marginTop: 10}}>Завантаження розкладу...</Text>
              </View>
          ) : !selectedGroup ? (
              <View style={styles.centerContainer}>
                  <Text style={{
                    color: '#64748B', 
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: '500',
                    textAlign: 'center',
                  }}>
                    ☝️ Щоб побачити розклад - оберіть групу в меню вище
                  </Text>
              </View>
          ) : scheduleData.length === 0 && substitutions.length === 0 ? (
               <View style={styles.centerContainer}>
                  <Text style={{color: '#64748B'}}>На цей день пар немає 🎉</Text>
              </View>
          ) : (
              <View style={{ position: 'relative', width: '100%' }}>
                
                {isToday && (
                  <TimeIndicator layouts={lessonLayouts} now={now} />
                )}

                {scheduleData.map((lesson, index) => (
                  <View
                    key={index}
                    onLayout={(e) => {
                      const { y, height } = e.nativeEvent.layout;
                      setLessonLayouts(prev => {
                        const filtered = prev.filter(l => l.lessonId !== lesson.lessonId);
                        return [...filtered, {
                          lessonId: lesson.lessonId || index,
                          y,
                          height,
                          timeStart: lesson.timeStart,
                          timeEnd: lesson.timeEnd,
                        }];
                      });
                    }}
                  >
                    <ScheduleCard {...lesson} />
                  </View>
                ))}
              </View>
          )}
        </View>
      </ScrollView>

      {/* 🔥 АБСОЛЮТНА ШАПКА (ПЛАВАЮЧИЙ ТОП-БАР) */}
      <View style={[
        styles.absoluteHeader,
        {
          paddingTop: isMobile ? 50 : 20,
          paddingHorizontal: isMobile ? 15 : 20,
        }
      ]}>
        <View style={[
          styles.headerRow, 
          { 
            flexDirection: isMobile ? 'column-reverse' : 'row', 
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: 15
          }
        ]}>
          
          <View style={[
            styles.selectorContainer, 
            { width: isMobile ? '100%' : 250 }
          ]}>
            <GroupSelector 
              onSelectGroup={handleSelectGroup}
              currentWeek={currentWeek}
              value={selectedGroup}
             />
          </View>
          
          <View style={[
            styles.topBarContainer, 
            { alignItems: isMobile ? 'center' : 'flex-end' }
          ]}>
            <TopBar 
              selectedDate={selectedDate} 
              onDateChange={setSelectedDate} 
            />
          </View>

        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollArea: { flex: 1 },
  
  // 🔥 Стилі плаваючої шапки
  absoluteHeader: {
    position: 'absolute', // Відриваємо від екрану
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background, // Суцільний фон, щоб пари ховались ПІД нього
    zIndex: 100, // Поверх усього
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    // Легенька тінь, щоб було видно що це шапка
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },

  headerRow: { zIndex: 100 },
  selectorContainer: { zIndex: 100 },
  topBarContainer: { zIndex: 1 },

  listContainer: { flex: 1, position: 'relative', alignItems: 'stretch' },
  centerContainer: { marginTop: 40, justifyContent: 'center', alignItems: 'center' },
});