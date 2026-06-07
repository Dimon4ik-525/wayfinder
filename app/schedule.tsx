import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopBar from '../components/TopBar';
import Substitutions from '../components/Substitutions';
import ScheduleCard, { ScheduleCardProps } from '../components/ScheduleCard';
import GroupSelector from '../components/GroupSelector';
import { fetchSchedule } from '../utils/scheduleApi'; 
import { Colors } from '../constants/theme';
import { useLocalSearchParams } from 'expo-router';

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
  const [scheduleData, setScheduleData] = useState<ScheduleCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentWeek, setCurrentWeek] = useState<string>('');
  const [substitutions, setSubstitutions] = useState<any[]>([]);

  // 🔥 Завантажуємо збережену групу при відкритті
const { keepGroup } = useLocalSearchParams();

useEffect(() => {
  const loadSavedGroup = async () => {
    try {
      if (keepGroup === 'true') {
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

  // 🔥 Зберігаємо групу при зміні
  const handleSelectGroup = async (group: any) => {
    setSelectedGroup(group);
    try {
      if (group) await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(group));
    } catch (e) {}
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
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

            // Беремо ВСІ пари на цей день
            const dailyLessonsRaw = rawData.schedules.filter((item: any) => item.day_of_week === selectedDayOfWeek);

            // 🔥 ГРУПУЄМО ЇХ ЗА НОМЕРОМ ПАРИ
            const groupedLessons = new Map<number, any[]>();
            dailyLessonsRaw.forEach((item: any) => {
                const id = item.lesson?.id || 99; 
                if (!groupedLessons.has(id)) groupedLessons.set(id, []);
                groupedLessons.get(id)!.push(item);
            });

            const formattedSchedule: ScheduleCardProps[] = [];

            // Формуємо масив карток
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
      setIsLoading(false);
    };

    loadSchedule();
  }, [selectedGroup, selectedDate]); 

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const calculateLineTop = () => {
    const startHour = 9; 
    const PIXELS_PER_HOUR = 78; 
    const totalMinutesPassed = ((now.getHours() - startHour) * 60) + now.getMinutes();
    const position = (totalMinutesPassed / 60) * PIXELS_PER_HOUR;
    return Math.max(0, position);
  };

  return (
    <View style={styles.container}>
      <TopBar 
        selectedDate={selectedDate} 
        onDateChange={setSelectedDate} 
        groupName={selectedGroup?.name}
        currentWeek={currentWeek}
      />
      
      <View style={styles.selectorContainer}>
        <GroupSelector onSelectGroup={handleSelectGroup} />
      </View>
      
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
                <Text style={{color: '#64748B'}}>👈 Оберіть групу в меню вище, щоб побачити розклад</Text>
            </View>
        ) : scheduleData.length === 0 && substitutions.length === 0 ? (
             <View style={styles.centerContainer}>
                <Text style={{color: '#64748B'}}>На цей день пар немає 🎉</Text>
            </View>
        ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, width: '100%' }}>
            
            {isToday && (
                <View style={[styles.redLineContainer, { top: calculateLineTop() }]}>
                <View style={styles.redBadge}>
                    <Text style={styles.redBadgeText}>{formattedTime}</Text>
                </View>
                <View style={styles.redLine} />
                </View>
            )}

            {scheduleData.map((lesson, index) => (
                <ScheduleCard key={index} {...lesson} />
            ))}
            </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: Colors.background },
  selectorContainer: { zIndex: 100, marginBottom: 15 },
  listContainer: { flex: 1, marginTop: 10, position: 'relative', alignItems: 'stretch' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  redLineContainer: { position: 'absolute', left: 4, right: 4, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  redBadge: { backgroundColor: Colors.error, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, elevation: 3 },
  redBadgeText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  redLine: { flex: 1, height: 2, backgroundColor: Colors.error },
});