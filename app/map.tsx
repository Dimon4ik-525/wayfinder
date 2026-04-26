import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, LogBox } from 'react-native';
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

// Корпус 1, Поверх 1
import { 
  ROOMS as B1_F1_ROOMS, KIOSK_POSITION as B1_F1_KIOSK, VIEW_BOX as B1_F1_VIEWBOX, 
  WALLS_PATH as B1_F1_WALLS, NODES as B1_F1_NODES, EDGES as B1_F1_EDGES
} from '../constants/maps/building1_floor1';

// Корпус 1, Поверх 3
import { 
  ROOMS as B1_F3_ROOMS, KIOSK_POSITION as B1_F3_KIOSK, VIEW_BOX as B1_F3_VIEWBOX, 
  WALLS_PATH as B1_F3_WALLS, NODES as B1_F3_NODES, EDGES as B1_F3_EDGES
} from '../constants/maps/building1_floor3';

// Корпус 2, Поверх 2
import { 
  ROOMS as B2_F2_ROOMS, KIOSK_POSITION as B2_F2_KIOSK, VIEW_BOX as B2_F2_VIEWBOX, 
  WALLS_PATH as B2_F2_WALLS, NODES as B2_F2_NODES, EDGES as B2_F2_EDGES
} from '../constants/maps/building2_floor2';

export default function MapScreen() {
  const params = useLocalSearchParams();
  
  const [activeBuilding, setActiveBuilding] = useState(1);
  const [activeFloor, setActiveFloor] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(new Date());
  
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

  // Динамічний вибір даних
  let currentRooms: any[] = [];
  let currentKiosk = { x: 0, y: 0 };
  let currentViewBox = "0 0 800 400";
  let currentWallsPath = "";
  let currentNodes: any[] = [];
  let currentEdges: any[] = [];

  if (activeBuilding === 1 && activeFloor === 1) {
    currentRooms = B1_F1_ROOMS; currentKiosk = B1_F1_KIOSK; currentViewBox = B1_F1_VIEWBOX;
    currentWallsPath = B1_F1_WALLS; currentNodes = B1_F1_NODES; currentEdges = B1_F1_EDGES;
  } else if (activeBuilding === 1 && activeFloor === 3) {
    currentRooms = B1_F3_ROOMS; currentKiosk = B1_F3_KIOSK; currentViewBox = B1_F3_VIEWBOX;
    currentWallsPath = B1_F3_WALLS; currentNodes = B1_F3_NODES; currentEdges = B1_F3_EDGES;
  } else if (activeBuilding === 2 && activeFloor === 2) {
    currentRooms = B2_F2_ROOMS; currentKiosk = B2_F2_KIOSK; currentViewBox = B2_F2_VIEWBOX;
    currentWallsPath = B2_F2_WALLS; currentNodes = B2_F2_NODES; currentEdges = B2_F2_EDGES;
  }

  // Обчислення маршруту
  const generateRoutePath = () => {
    if (!targetRoomId || currentNodes.length === 0) return '';
    const room = currentRooms.find(r => r.id === targetRoomId);
    if (!room) return '';
    const pathNodes = findShortestPath('kiosk', targetRoomId, currentNodes, currentEdges);
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
        <MapCanvas 
          rooms={currentRooms}
          kioskPosition={currentKiosk}
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