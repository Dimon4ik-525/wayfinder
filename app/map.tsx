import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, LogBox, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../constants/theme';

// Імпортуємо наш компонент-малювальник
import MapCanvas from '../components/MapCanvas';

// Приховуємо спливаючі попередження на екрані
LogBox.ignoreLogs([
  'Unknown event handler property `onStartShouldSetResponder`',
  'Unknown event handler property `onResponderTerminationRequest`',
  'Unknown event handler property `onResponderGrant`',
  'Unknown event handler property `onResponderMove`',
  'Unknown event handler property `onResponderRelease`',
  'Unknown event handler property `onResponderTerminate`',
]);

// ГЛУШНИК ДЛЯ КОНСОЛІ БРАУЗЕРА (щоб там було чисто)
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Unknown event handler property')) {
    return; 
  }
  originalConsoleError(...args);
};

import { findShortestPath } from '../utils/navigation';

// --- КОРПУС 1 ---
// (Тут ми використовуємо нову логіку START_POINTS)
import { 
  ROOMS as B1_F1_ROOMS, VIEW_BOX as B1_F1_VIEWBOX, 
  WALLS_PATH as B1_F1_WALLS, NODES as B1_F1_NODES, EDGES as B1_F1_EDGES, START_POINTS as B1_F1_START_POINTS
} from '../constants/maps/corp1/floor1'; 

import { 
  ROOMS as B1_F2_ROOMS, VIEW_BOX as B1_F2_VIEWBOX, 
  WALLS_PATH as B1_F2_WALLS, NODES as B1_F2_NODES, EDGES as B1_F2_EDGES, START_POINTS as B1_F2_START_POINTS
} from '../constants/maps/corp1/floor2'; 

import { 
  ROOMS as B1_F3_ROOMS, VIEW_BOX as B1_F3_VIEWBOX, 
  WALLS_PATH as B1_F3_WALLS, NODES as B1_F3_NODES, EDGES as B1_F3_EDGES, START_POINTS as B1_F3_START_POINTS
} from '../constants/maps/corp1/floor3'; 


// --- КОРПУС 2 ---
// (Залишаємо стару логіку KIOSK_POSITION, поки ти її не оновиш)
import { 
  ROOMS as B2_F2_ROOMS, KIOSK_POSITION as B2_F2_KIOSK, VIEW_BOX as B2_F2_VIEWBOX, 
  WALLS_PATH as B2_F2_WALLS, NODES as B2_F2_NODES, EDGES as B2_F2_EDGES
} from '../constants/maps/corp2/floor2'; 


// Збираємо всі кімнати в одну глобальну базу для пошуку
const ALL_ROOMS = [
  ...B1_F1_ROOMS,
  ...B1_F2_ROOMS,
  ...B1_F3_ROOMS,
  ...B2_F2_ROOMS
];

export default function MapScreen() {
  const params = useLocalSearchParams();
  
  const [activeBuilding, setActiveBuilding] = useState(1);
  const [activeFloor, setActiveFloor] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(new Date());
  
  const [targetRoomId, setTargetRoomId] = useState<string | null>((params.room as string) || null);
  
  // Змінна для зберігання вибраного входу (за замовчуванням Головний вхід)
  const [activeStartId, setActiveStartId] = useState('start_main');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const months = ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];
    return `📅 ${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

  // ЛОГІКА ПОШУКУ
  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : ALL_ROOMS.filter(room => room.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectRoomFromSearch = (room: any) => {
    setActiveBuilding(room.building);
    setActiveFloor(room.floor);
    setTargetRoomId(room.id);
    setSearchQuery(''); // Ховаємо список після вибору
  };

  // Динамічний вибір даних для поточної мапи
  let currentRooms: any[] = [];
  let currentViewBox = "0 0 800 400";
  let currentWallsPath = "";
  let currentNodes: any[] = [];
  let currentEdges: any[] = [];
  let currentStartPoints: any[] = []; // Уніфікований масив точок старту

  if (activeBuilding === 1 && activeFloor === 1) {
    currentRooms = B1_F1_ROOMS; currentViewBox = B1_F1_VIEWBOX;
    currentWallsPath = B1_F1_WALLS; currentNodes = B1_F1_NODES; currentEdges = B1_F1_EDGES; 
    currentStartPoints = B1_F1_START_POINTS || []; 
  } else if (activeBuilding === 1 && activeFloor === 2) {
    currentRooms = B1_F2_ROOMS; currentViewBox = B1_F2_VIEWBOX;
    currentWallsPath = B1_F2_WALLS; currentNodes = B1_F2_NODES; currentEdges = B1_F2_EDGES;
    currentStartPoints = B1_F2_START_POINTS || [];
  } else if (activeBuilding === 1 && activeFloor === 3) {
    currentRooms = B1_F3_ROOMS; currentViewBox = B1_F3_VIEWBOX;
    currentWallsPath = B1_F3_WALLS; currentNodes = B1_F3_NODES; currentEdges = B1_F3_EDGES;
    currentStartPoints = B1_F3_START_POINTS || [];
  } else if (activeBuilding === 2 && activeFloor === 2) {
    currentRooms = B2_F2_ROOMS; currentViewBox = B2_F2_VIEWBOX;
    currentWallsPath = B2_F2_WALLS; currentNodes = B2_F2_NODES; currentEdges = B2_F2_EDGES;
    // Тимчасове рішення для старих поверхів, які ще використовують KIOSK_POSITION
    currentStartPoints = [{ id: 'kiosk', label: 'Старт', x: B2_F2_KIOSK.x, y: B2_F2_KIOSK.y }];
  }

  // Обчислення правильного старту для графа
  let effectiveStartId = activeStartId;
  let dynamicKioskPosition = { x: 0, y: 0 };

  if (currentStartPoints && currentStartPoints.length > 0) {
    // Якщо вибраного входу немає на цьому поверсі - вибираємо перший доступний
    if (!currentStartPoints.find(p => p.id === activeStartId)) {
      effectiveStartId = currentStartPoints[0].id;
    }
    // Шукаємо координати вибраного входу
    const selectedStartPoint = currentStartPoints.find(p => p.id === effectiveStartId) || currentStartPoints[0];
    dynamicKioskPosition = { x: selectedStartPoint.x, y: selectedStartPoint.y };
  } else {
    effectiveStartId = 'kiosk';
  }

  // Обчислення маршруту
  const generateRoutePath = () => {
    if (!targetRoomId || currentNodes.length === 0) return '';
    const room = currentRooms.find(r => r.id === targetRoomId);
    if (!room) return '';
    
    // БУДУЄМО ВІД ПРАВИЛЬНОГО ВХОДУ!
    const pathNodes = findShortestPath(effectiveStartId, targetRoomId, currentNodes, currentEdges);
    
    if (pathNodes.length === 0) return '';

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
        
        {/* Блок пошуку (із Z-index для випадаючого списку) */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
              style={styles.searchInput}
              placeholder="Пошук кабінету (напр. Лабораторія, 24)..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Випадаючий список результатів */}
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 300 }}>
                {searchResults.map((room) => (
                  <TouchableOpacity 
                    key={`search-${room.building}-${room.floor}-${room.id}`} 
                    style={styles.searchResultItem}
                    onPress={() => handleSelectRoomFromSearch(room)}
                  >
                    <Text style={styles.searchResultText}>{room.label}</Text>
                    <Text style={styles.searchResultSubtext}>
                      Корпус {room.building}, Поверх {room.floor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText} numberOfLines={1}>{formatDate(now)}</Text>
        </View>
      </View>

      {/* ПАНЕЛЬ ВИБОРУ ВХОДУ (тільки якщо на поверсі >1 входу) */}
      {currentStartPoints && currentStartPoints.length > 1 && (
        <View style={styles.startPointsPanel}>
          <Text style={styles.startPointsLabel}>Почати маршрут від:</Text>
          <View style={styles.startPointsButtons}>
            {currentStartPoints.map(sp => (
              <TouchableOpacity
                key={sp.id}
                style={[styles.startBtn, effectiveStartId === sp.id && styles.startBtnActive]}
                onPress={() => setActiveStartId(sp.id)}
              >
                <Text style={[styles.startBtnText, effectiveStartId === sp.id && styles.startBtnTextActive]}>
                  📍 {sp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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
        <MapCanvas 
          rooms={currentRooms}
          kioskPosition={dynamicKioskPosition}
          viewBox={currentViewBox}
          wallsPath={currentWallsPath}
          targetRoomId={targetRoomId}
          routePath={generateRoutePath()}
          onRoomSelect={setTargetRoomId}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 16, zIndex: 50, elevation: 50 },
  
  searchWrapper: { flex: 1, maxWidth: 400, zIndex: 50, elevation: 50 },
  searchContainer: { flexDirection: 'row', backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 18, color: Colors.textMain, outlineStyle: 'none' } as any,
  
  searchResults: { 
    position: 'absolute', 
    top: '100%', 
    left: 0, 
    right: 0, 
    backgroundColor: Colors.white, 
    borderRadius: 12, 
    marginTop: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
    elevation: 5, 
    overflow: 'hidden' 
  },
  searchResultItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchResultText: { fontSize: 18, fontWeight: 'bold', color: Colors.textMain },
  searchResultSubtext: { fontSize: 14, color: Colors.textSecondary },

  dateBadge: { backgroundColor: Colors.primaryGhost, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexShrink: 0, whiteSpace: 'nowrap' } as any,
  dateBadgeText: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  
  startPointsPanel: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 16, zIndex: 1 },
  startPointsLabel: { fontSize: 18, fontWeight: 'bold', color: Colors.textSecondary, marginRight: 16 },
  startPointsButtons: { flexDirection: 'row', gap: 8 },
  startBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: '#CBD5E1' },
  startBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  startBtnText: { fontSize: 16, fontWeight: 'bold', color: Colors.textMain },
  startBtnTextActive: { color: Colors.white },

  mapTitle: { fontSize: 28, color: Colors.textMain, marginBottom: 20 },
  controlPanel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, zIndex: 1 },
  tabSelector: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4 },
  tabButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  tabButtonActive: { 
    backgroundColor: Colors.white, 
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', 
    elevation: 2 
  },
  tabButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.textSecondary },
  tabButtonTextActive: { color: Colors.primary },
  mapArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10, backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#E2E8F0', zIndex: 1 }
});