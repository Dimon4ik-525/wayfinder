import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import Svg, { Rect, Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../constants/theme';

// 1. Імпортуємо наш алгоритм пошуку шляху
import { findShortestPath } from '../utils/navigation';

// 2. Імпортуємо ДАНІ та ГРАФ з файлу конфігурації
import { 
  ROOMS as B1_F1_ROOMS, 
  KIOSK_POSITION as B1_F1_KIOSK, 
  VIEW_BOX as B1_F1_VIEWBOX, 
  WALLS_PATH as B1_F1_WALLS,
  NODES as B1_F1_NODES,
  EDGES as B1_F1_EDGES
} from '../constants/maps/building1_floor1';

export default function MapScreen() {
  const params = useLocalSearchParams();
  
  const [activeBuilding, setActiveBuilding] = useState(1);
  const [activeFloor, setActiveFloor] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(new Date());
  
  // Якщо прийшли з розкладу - беремо номер кабінету, інакше null
  const [targetRoomId, setTargetRoomId] = useState<string | null>((params.room as string) || null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const months = ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
    return `📅 ${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

  // 3. Динамічний вибір даних
  let currentRooms: any[] = [];
  let currentKiosk = { x: 0, y: 0 };
  let currentViewBox = "0 0 800 400";
  let currentWallsPath = "";
  let currentNodes: any[] = [];
  let currentEdges: any[] = [];

  if (activeBuilding === 1 && activeFloor === 1) {
    currentRooms = B1_F1_ROOMS;
    currentKiosk = B1_F1_KIOSK;
    currentViewBox = B1_F1_VIEWBOX;
    currentWallsPath = B1_F1_WALLS;
    currentNodes = B1_F1_NODES;
    currentEdges = B1_F1_EDGES;
  }

  // 4. НОВА ФУНКЦІЯ МАРШРУТУ (Використовує Алгоритм Дейкстри)
  const generateRoutePath = () => {
    if (!targetRoomId || currentNodes.length === 0) return '';
    
    // Перевіряємо, чи існує кабінет, який ми шукаємо
    const room = currentRooms.find(r => r.id === targetRoomId);
    if (!room) return '';

    // Запускаємо алгоритм: від Кіоску до обраного кабінету
    // ВАЖЛИВО: ID цілі має збігатися з ID вузла в масиві NODES
    const pathNodes = findShortestPath('kiosk', targetRoomId, currentNodes, currentEdges);
    
    // Якщо шлях не знайдено - повертаємо пустоту
    if (pathNodes.length === 0) return '';

    // Малюємо лінію, що з'єднує знайдені вузли
    // Беремо перший вузол (M - Move to) і далі ведемо лінії (L - Line to) до наступних
    let pathString = `M ${pathNodes[0].x} ${pathNodes[0].y} `;
    for (let i = 1; i < pathNodes.length; i++) {
      pathString += `L ${pathNodes[i].x} ${pathNodes[i].y} `;
    }

    return pathString;
  };

  return (
    <View style={styles.container}>
      
      {/* ВЕРХНЯ ПАНЕЛЬ */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Пошук кабінету..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText} numberOfLines={1}>{formatDate(now)}</Text>
        </View>
      </View>

      {/* ЗАГОЛОВОК */}
      <Text style={styles.mapTitle}>
        Корпус {activeBuilding}, {activeFloor} поверх — <Text style={{ fontWeight: 'bold' }}>
          {targetRoomId ? `ціль: каб. ${targetRoomId}` : 'Оберіть кабінет'}
        </Text>
      </Text>

      {/* ПАНЕЛІ КЕРУВАННЯ */}
      <View style={styles.controlPanel}>
        <View style={styles.tabSelector}>
          {[1, 2].map((building) => (
            <TouchableOpacity 
              key={`b-${building}`}
              style={[styles.tabButton, activeBuilding === building && styles.tabButtonActive]}
              onPress={() => {
                setActiveBuilding(building);
                setTargetRoomId(null);
              }}
            >
              <Text style={[styles.tabButtonText, activeBuilding === building && styles.tabButtonTextActive]}>
                Корпус {building}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabSelector}>
          {[1, 2, 3].map((floor) => (
            <TouchableOpacity 
              key={`f-${floor}`}
              style={[styles.tabButton, activeFloor === floor && styles.tabButtonActive]}
              onPress={() => {
                setActiveFloor(floor);
                setTargetRoomId(null);
              }}
            >
              <Text style={[styles.tabButtonText, activeFloor === floor && styles.tabButtonTextActive]}>
                {floor} пов.
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* КАРТА */}
      <View style={styles.mapArea}>
        {currentRooms.length === 0 ? (
          <Text style={{ fontSize: 24, color: Colors.textSecondary }}>
            Мапа для Корпусу {activeBuilding}, Поверху {activeFloor} ще в розробці...
          </Text>
        ) : (
          <Svg width="100%" height="100%" viewBox={currentViewBox}>
            
            {/* Креслення стін */}
            {currentWallsPath !== "" && (
              <Path d={currentWallsPath} stroke="#9CA3AF" strokeWidth="6" fill="none" />
            )}

            {/* КАБІНЕТИ */}
            {currentRooms.map((room) => {
              const isActive = room.id === targetRoomId;
              return (
                <G key={room.id} onPress={() => setTargetRoomId(room.id)}>
                  <Rect 
                    x={room.x} y={room.y} width={room.width} height={room.height} 
                    fill={isActive ? Colors.primary : 'rgba(226, 232, 240, 0.5)'} 
                    stroke={isActive ? Colors.primary : '#CBD5E1'} strokeWidth="4" rx="16" 
                  />
                  <SvgText 
                    x={room.x + (room.width / 2)} y={room.y + (room.height / 2) + 20} 
                    fill={isActive ? Colors.white : Colors.textMain} 
                    fontSize="70" fontWeight="bold" textAnchor="middle"
                  >
                    {room.label}
                  </SvgText>
                </G>
              );
            })}

            {/* МАРШРУТ (Намальований за алгоритмом!) */}
            {targetRoomId && (
              <Path 
                d={generateRoutePath()} 
                stroke={Colors.primary} 
                strokeWidth="24" 
                strokeDasharray="40, 30" 
                fill="none" 
                strokeLinejoin="round"
              />
            )}

            {/* ТОЧКА ВИ ТУТ */}
            <G x={currentKiosk.x} y={currentKiosk.y}>
              <Circle cx="0" cy="0" r="80" fill={Colors.error} opacity="0.2" />
              <Circle cx="0" cy="0" r="30" fill={Colors.error} />
              <SvgText x="0" y="140" fill={Colors.error} fontSize="60" fontWeight="bold" textAnchor="middle">ВИ ТУТ</SvgText>
            </G>

          </Svg>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 16 },
  searchContainer: { flexDirection: 'row', backgroundColor: Colors.white, flex: 1, maxWidth: 400, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 18, color: Colors.textMain, outlineStyle: 'none' } as any,
  dateBadge: { backgroundColor: Colors.primaryGhost, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexShrink: 0, whiteSpace: 'nowrap' } as any,
  dateBadgeText: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  mapTitle: { fontSize: 28, color: Colors.textMain, marginBottom: 20 },
  controlPanel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  tabSelector: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4 },
  tabButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  tabButtonActive: { backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.textSecondary },
  tabButtonTextActive: { color: Colors.primary },
  mapArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10, backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#E2E8F0' }
});