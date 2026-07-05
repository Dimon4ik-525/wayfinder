import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, useWindowDimensions } from 'react-native';
import { useState } from 'react'; 
import { useRouter } from 'expo-router'; 
import { Colors } from '../constants/theme';

export default function Substitutions({ data }: { data: any[] }) {
  const router = useRouter(); 
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // 🔥 Стан для відкриття/закриття замін (за замовчуванням закриті: false)
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || data.length === 0) return null;

  const handleMapNavigation = (room: string) => {
    if (!room || room === '—') return;

    const lowerRoom = room.toLowerCase();
    
    // 🔥 Витягуємо перше-ліпше число з назви кабінету (наприклад, "32а" -> 32)
    const numberMatch = lowerRoom.match(/\d+/);
    const roomNumber = numberMatch ? parseInt(numberMatch[0], 10) : 0;

    // 🔥 Якщо номер кабінету 31 або більший — це наш невідцифрований корпус
    const isUnmappedBuilding = roomNumber >= 31;
    
    const inDevelopment = [
      'нувгп', 
      'тир'
    ];

    const isUnderConstruction = inDevelopment.some(keyword => lowerRoom.includes(keyword)) || isUnmappedBuilding;

    if (isUnderConstruction) {
      if (Platform.OS === 'web') {
        window.alert("В розробці 🛠\n\nЦей об'єкт (або корпус) ще не додано на мапу. Працюємо над цим!");
      } else {
        Alert.alert("В розробці 🛠", "Цей об'єкт (або корпус) ще не додано на мапу. Працюємо над цим!");
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

  const colPara = isMobile ? 30 : 40;
  const colTeacher = isMobile ? 80 : 140;
  const colRoom = isMobile ? 45 : 60;
  const colType = isMobile ? 60 : 80;
  const colAction = isMobile ? 60 : 100;

  return (
    <View style={styles.substitutionsBox}>
      
      {/* 🔥 Кнопка-шапка для відкриття/закриття */}
      <TouchableOpacity 
        style={styles.subsHeaderToggle} 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.subsTitle}>Заміни на цей день ({data.length})</Text>
        {/* Стрілочка, яка змінюється в залежності від стану */}
        <Text style={styles.subsToggleIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {/* 🔥 Показуємо контент тільки якщо isExpanded === true */}
      {isExpanded && (
        <View style={styles.subsContent}>
          {/* Шапка таблиці */}
          <View style={styles.subsHeader}>
            <Text style={[styles.subsColumnText, { width: colPara }]}>Пара</Text>
            <Text style={[styles.subsColumnText, { flex: 1 }]}>Предмет</Text>
            <Text style={[styles.subsColumnText, { width: colTeacher }]}>Викладач</Text>
            <Text style={[styles.subsColumnText, { width: colRoom }]}>Каб.</Text>
            <Text style={[styles.subsColumnText, { width: colType, textAlign: 'center' }]}>Тип</Text>
            <Text style={[styles.subsColumnText, { width: colAction, textAlign: 'center' }]}>Дія</Text> 
          </View>

          {/* Рендеримо реальні заміни */}
          {data.map((sub, index) => {
            const room = sub.cabinet || sub.room || '—'; 
            const lessonNum = sub.lesson_name || sub.lesson_number || '-';
            const typeText = sub.change_type || sub.type || 'Заміна';
            
            const isCancelled = sub.is_cancelled === true || typeText.toLowerCase() === 'скасовано';

            return (
              <View key={index} style={[styles.subsRow, index === data.length - 1 && { borderBottomWidth: 0 }]}>
                
                <Text style={[styles.subsRowTextBold, { width: colPara, fontSize: isMobile ? 12 : 13 }]}>
                  {lessonNum}
                </Text>
                
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingRight: 4 }}>
                  <Text style={[styles.subsRowTextBold, { color: isCancelled ? Colors.error : '#10B981', fontSize: isMobile ? 11 : 13 }]}>
                    {sub.subject || sub.discipline || 'Заміна'}
                  </Text>
                  {sub.replaced_subject && (
                     <Text style={[styles.subsRowSubtext, { fontSize: isMobile ? 10 : 12 }]} numberOfLines={1}>
                       (Замість: {sub.replaced_subject})
                     </Text>
                  )}
                </View>
                
                <Text style={[styles.subsRowText, { width: colTeacher, fontSize: isMobile ? 11 : 13 }]} numberOfLines={isMobile ? 2 : 1}>
                  {sub.teacher || '—'}
                </Text>
                
                <Text style={[styles.subsRowTextBold, { width: colRoom, fontSize: isMobile ? 11 : 13 }]} numberOfLines={1}>
                  {room}
                </Text>
                
                <View style={{ width: colType, alignItems: 'center' }}>
                  <View style={[styles.subsBadge, { backgroundColor: isCancelled ? '#FEE2E2' : '#FEF3C7', width: isMobile ? 55 : 70 }]}>
                    <Text style={{ color: isCancelled ? '#DC2626' : '#D97706', fontSize: isMobile ? 9 : 11, fontWeight: 'bold', textAlign: 'center' }} numberOfLines={1}>
                      {typeText}
                    </Text>
                  </View>
                </View>

                <View style={{ width: colAction, alignItems: 'flex-end' }}>
                  <TouchableOpacity 
                    style={[
                      styles.routeButton, 
                      room === '—' && styles.routeButtonDisabled,
                      isMobile && { paddingHorizontal: 6, paddingVertical: 4 }
                    ]} 
                    disabled={room === '—'}
                    onPress={() => handleMapNavigation(room)} 
                    activeOpacity={0.8}
                  >
                    <Text 
                      style={[
                        styles.routeButtonText, 
                        room === '—' && { color: '#9CA3AF' },
                        { fontSize: isMobile ? 10 : 11 }
                      ]}
                      numberOfLines={1} 
                    >
                      {isMobile ? 'Мапа' : 'Як пройти?'}
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  substitutionsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8, 
    paddingVertical: 6, 
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 15,
  },
  subsHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subsTitle: { fontSize: 14, fontWeight: 'bold', color: '#D97706' }, 
  subsToggleIcon: { fontSize: 14, fontWeight: 'bold', color: '#D97706' }, 
  subsContent: { marginTop: 10 },

  subsHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#FDE68A', paddingBottom: 2, marginBottom: 4 },
  subsColumnText: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold' },
  subsRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#FDE68A', paddingVertical: 6 }, 
  subsRowText: { fontSize: 13, color: '#4B5563' },
  subsRowTextBold: { fontSize: 13, fontWeight: 'bold', color: '#1F2937' },
  subsRowSubtext: { fontSize: 12, color: '#9CA3AF', flexShrink: 1 }, 
  subsBadge: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  
  routeButton: { 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 8, 
    paddingVertical: 6, 
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  routeButtonDisabled: { backgroundColor: '#E2E8F0' },
  routeButtonText: { color: Colors.white, fontWeight: 'bold' },
});