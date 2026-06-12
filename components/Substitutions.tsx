import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router'; 
import { Colors } from '../constants/theme';

export default function Substitutions({ data }: { data: any[] }) {
  const router = useRouter(); 

  if (!data || data.length === 0) return null;

const handleMapNavigation = (room: string) => {
    if (!room || room === '—') return;

    const lowerRoom = room.toLowerCase();
    
    // Перевірка на кабінети в розробці
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
      params: { 
        room: room,
        fromSchedule: 'true' // 🔥 Додали цей рядок, щоб мапа знала, звідки ми прийшли
      }
    });
  };

  return (
    <View style={styles.substitutionsBox}>
      <Text style={styles.subsTitle}>Заміни на цей день ({data.length})</Text>
      
      {/* Шапка таблиці */}
      <View style={styles.subsHeader}>
        <Text style={[styles.subsColumnText, { width: 40 }]}>Пара</Text>
        <Text style={[styles.subsColumnText, { flex: 1 }]}>Предмет</Text>
        <Text style={[styles.subsColumnText, { width: 140 }]}>Викладач</Text>
        <Text style={[styles.subsColumnText, { width: 60 }]}>Каб.</Text>
        <Text style={[styles.subsColumnText, { width: 80, textAlign: 'center' }]}>Тип</Text>
        <Text style={[styles.subsColumnText, { width: 100, textAlign: 'center' }]}>Дія</Text> 
      </View>

      {/* Рендеримо реальні заміни */}
      {data.map((sub, index) => {
        const room = sub.cabinet || sub.room || '—'; 
        const lessonNum = sub.lesson_name || sub.lesson_number || '-';
        const typeText = sub.change_type || sub.type || 'Заміна';
        
        const isCancelled = sub.is_cancelled === true || typeText.toLowerCase() === 'скасовано';

        return (
          <View key={index} style={[styles.subsRow, index === data.length - 1 && { borderBottomWidth: 0 }]}>
            
            <Text style={[styles.subsRowTextBold, { width: 40 }]}>
              {lessonNum}
            </Text>
            
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={[styles.subsRowTextBold, { color: isCancelled ? Colors.error : '#10B981' }]}>
                {sub.subject || sub.discipline || 'Заміна'}
              </Text>
              {sub.replaced_subject && (
                 <Text style={styles.subsRowSubtext} numberOfLines={1}> (Замість: {sub.replaced_subject})</Text>
              )}
            </View>
            
            <Text style={[styles.subsRowText, { width: 140 }]}>
              {sub.teacher || '—'}
            </Text>
            
            <Text style={[styles.subsRowTextBold, { width: 60 }]}>
              {room}
            </Text>
            
            {/* Відцентрований блок типу заміни */}
            <View style={{ width: 80, alignItems: 'center' }}>
              <View style={[styles.subsBadge, { backgroundColor: isCancelled ? '#FEE2E2' : '#FEF3C7' }]}>
                <Text style={{ color: isCancelled ? '#DC2626' : '#D97706', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>
                  {typeText}
                </Text>
              </View>
            </View>

            {/* Блок дії (Кнопка в 1 рядок) */}
            <View style={{ width: 100, alignItems: 'center' }}>
              <TouchableOpacity 
                style={[styles.routeButton, room === '—' && styles.routeButtonDisabled]} 
                disabled={room === '—'}
                onPress={() => handleMapNavigation(room)} 
                activeOpacity={0.8}
              >
                <Text 
                  style={[styles.routeButtonText, room === '—' && { color: '#9CA3AF' }]}
                  numberOfLines={1} 
                >
                  Як пройти?
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  substitutionsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8, 
    paddingVertical: 6, 
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 15,
  },
  subsTitle: { fontSize: 14, fontWeight: 'bold', color: '#D97706', marginBottom: 4 }, 
  subsHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#FDE68A', paddingBottom: 2, marginBottom: 4 },
  subsColumnText: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold' },
  subsRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#FDE68A', paddingVertical: 4 }, 
  subsRowText: { fontSize: 13, color: '#4B5563' },
  subsRowTextBold: { fontSize: 13, fontWeight: 'bold', color: '#1F2937' },
  subsRowSubtext: { fontSize: 12, color: '#9CA3AF', flexShrink: 1 }, 
  subsBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100, width: 70, alignItems: 'center', justifyContent: 'center' },
  
  // 🔥 Виправлені стилі кнопки для замін
  routeButton: { 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 8, // Зменшили відступ, щоб текст вліз
    paddingVertical: 6, 
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center'
  },
  routeButtonDisabled: { 
    backgroundColor: '#E2E8F0' 
  },
  routeButtonText: { 
    color: Colors.white, 
    fontSize: 11, // Трохи зменшили шрифт, щоб було акуратно в один ряд
    fontWeight: 'bold' 
  },
});