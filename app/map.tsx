import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, LogBox, ScrollView, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

import MapCanvas from '../components/MapCanvas';

// 🔥 Глушимо візуальні сповіщення на екрані
LogBox.ignoreLogs([
  'Unknown event handler property',
  'Invalid DOM property',
  '"shadow*" style props are deprecated',
  'TouchableMixin is deprecated',
  'useNativeDriver'
]);

// 🔥 РОЗУМНИЙ фільтр для помилок
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  const param1 = typeof args[1] === 'string' ? args[1] : '';

  if (
    msg.includes('Unknown event handler property') ||
    (msg.includes('Invalid DOM property') && param1 === 'transform-origin') 
  ) {
    return; 
  }
  originalConsoleError(...args);
};

// 🔥 РОЗУМНИЙ фільтр для попереджень
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('"shadow*" style props') ||
    msg.includes('TouchableMixin') ||
    msg.includes('useNativeDriver') ||
    msg.includes('pointerEvents')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

import { findShortestPath, buildGlobalRoute, RouteStepInfo } from '../utils/navigation';

// 1 ПОВЕРХ 
import { ROOMS as COMBINED_F1_ROOMS, VIEW_BOX as COMBINED_F1_VIEWBOX, WALLS_PATH as COMBINED_F1_WALLS, NODES as COMBINED_F1_NODES, EDGES as COMBINED_F1_EDGES, START_POINTS as COMBINED_F1_START_POINTS, STATIC_LABELS as COMBINED_F1_LABELS, ROAD_ZONES } from '../constants/maps/combined_floor1';
// 2 ПОВЕРХ 
import { ROOMS as COMBINED_F2_ROOMS, VIEW_BOX as COMBINED_F2_VIEWBOX, WALLS_PATH as COMBINED_F2_WALLS, NODES as COMBINED_F2_NODES, EDGES as COMBINED_F2_EDGES, START_POINTS as COMBINED_F2_START_POINTS, STATIC_LABELS as COMBINED_F2_LABELS, ROOF_ZONES as COMBINED_F2_ROOFS } from '../constants/maps/combined_floor2';
// 3 ПОВЕРХ 
import { ROOMS as COMBINED_F3_ROOMS, VIEW_BOX as COMBINED_F3_VIEWBOX, WALLS_PATH as COMBINED_F3_WALLS, NODES as COMBINED_F3_NODES, EDGES as COMBINED_F3_EDGES, START_POINTS as COMBINED_F3_START_POINTS, STATIC_LABELS as COMBINED_F3_LABELS, ROOF_ZONES as COMBINED_F3_ROOFS } from '../constants/maps/combined_floor3'; 

export interface RoomData {
  id: string;
  label: string;
  description?: string;
  rotateText?: boolean | number;
  building: number;
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
  targetStairs?: string;
}

const ALL_ROOMS = [
  ...COMBINED_F1_ROOMS,
  ...COMBINED_F2_ROOMS, 
  ...COMBINED_F3_ROOMS 
] as RoomData[];

let globalSavedStartId = 'start_main';

// 🔥 ГАРЯЧІ КЛАВІШІ (Шукають строго по ID)
const QUICK_LINKS = [
  { label: 'Директор', roomId: 'director' },
  { label: 'З.д з навч', roomId: 'deputy_1' },
  { label: 'З.д з н-вих/мет', roomId: 'deputy_2' },
  { label: 'З.д з а-гос', roomId: 'deputy_3' },
  { label: 'З.д з н-вир', roomId: 'deputy_4' },
  { label: 'Приймальна', roomId: 'reception' },
  { icon: '☕', label: 'Буфет', roomId: 'bufet' },
  { icon: '📚', label: 'Бібліотека', roomId: 'bibl' },
  { icon: '🏛️', label: 'Музей', roomId: 'museum' },
  
];

export default function MapScreen() {
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isNarrowSearch = width < 850; 

  const [activeBuilding, setActiveBuilding] = useState(1);
  const [activeFloor, setActiveFloor] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null);
  const [activeStartId, setActiveStartId] = useState(globalSavedStartId);

  const [routeInfo, setRouteInfo] = useState<RouteStepInfo | null>(null);
  const [initialRouteConfig, setInitialRouteConfig] = useState<{building: number, floor: number, startId: string} | null>(null);
  const [routeHistory, setRouteHistory] = useState<{building: number, floor: number, startId: string}[]>([]);

  useEffect(() => {
    const loadStartPoint = async () => {
      try {
        const saved = await AsyncStorage.getItem('userStartEntrance');
        if (saved) {
          setActiveStartId(saved);
          globalSavedStartId = saved;
        }
      } catch (e) {
        console.warn("Не вдалося завантажити налаштування входу", e);
      }
    };
    loadStartPoint();
  }, []);

  useEffect(() => {
    if (params.room) {
      const roomParam = params.room as string;
      const exactMatch = ALL_ROOMS.find(r => r.id === roomParam || r.label.toLowerCase() === roomParam.toLowerCase());
      const foundRoom = exactMatch || ALL_ROOMS.find(r => r.label.toLowerCase().includes(roomParam.toLowerCase()));

      if (foundRoom) {
        if (!initialRouteConfig) {
          setActiveBuilding(1);
          setActiveFloor(1);
          setActiveStartId(globalSavedStartId);
          setInitialRouteConfig({ building: 1, floor: 1, startId: globalSavedStartId });
        }
        setTargetRoomId(foundRoom.id);
      } else {
        setSearchQuery(roomParam);
      }
    }
  }, [params.room]);

  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : ALL_ROOMS
        .filter(room => room.label.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
          const aExact = a.label.toLowerCase() === searchQuery.toLowerCase();
          const bExact = b.label.toLowerCase() === searchQuery.toLowerCase();
          return aExact === bExact ? 0 : aExact ? -1 : 1;
        });

  const handleSelectRoomFromSearch = (room: any) => {
    if (!initialRouteConfig) {
      setInitialRouteConfig({ building: activeBuilding, floor: activeFloor, startId: activeStartId });
    }
    setTargetRoomId(room.id);
    setSearchQuery('');
  };

  // 🔥 Оновлений обробник для гарячих кнопок (Шукає по ID)
  const handleQuickLink = (targetId: string) => {
    const foundRoom = ALL_ROOMS.find(r => r.id === targetId);
    if (foundRoom) {
      handleSelectRoomFromSearch(foundRoom);
    } else {
      console.warn(`Кабінет з ID "${targetId}" не знайдено на жодному поверсі`);
    }
  };

  const handleRoomClick = (roomId: string | null) => {
    if (roomId) {
      if (!initialRouteConfig) {
        setInitialRouteConfig({ building: activeBuilding, floor: activeFloor, startId: activeStartId });
      }
      setTargetRoomId(roomId);
    } else {
      setTargetRoomId(null);
      setInitialRouteConfig(null);
      setRouteHistory([]);
    }
  };

  let currentRooms: any[] = [];
  let currentViewBox = "0 0 6029 3163"; 
  let currentWallsPath = "";
  let currentNodes: any[] = [];
  let currentEdges: any[] = [];
  let currentStartPoints: any[] = []; 
  let currentLabels: any[] = [];
  let currentRoofs: any[] = []; 

  if (activeFloor === 1) {
    currentRooms = COMBINED_F1_ROOMS; currentViewBox = COMBINED_F1_VIEWBOX; currentWallsPath = COMBINED_F1_WALLS; currentNodes = COMBINED_F1_NODES; currentEdges = COMBINED_F1_EDGES; currentStartPoints = COMBINED_F1_START_POINTS || []; currentLabels = COMBINED_F1_LABELS || []; currentRoofs = []; 
  } else if (activeFloor === 2) {
    currentRooms = COMBINED_F2_ROOMS; currentViewBox = COMBINED_F2_VIEWBOX; currentWallsPath = COMBINED_F2_WALLS; currentNodes = COMBINED_F2_NODES; currentEdges = COMBINED_F2_EDGES; currentStartPoints = COMBINED_F2_START_POINTS || []; currentLabels = COMBINED_F2_LABELS || []; currentRoofs = COMBINED_F2_ROOFS || []; 
  } else if (activeFloor === 3) {
    currentRooms = COMBINED_F3_ROOMS; currentViewBox = COMBINED_F3_VIEWBOX; currentWallsPath = COMBINED_F3_WALLS; currentNodes = COMBINED_F3_NODES; currentEdges = COMBINED_F3_EDGES; currentStartPoints = COMBINED_F3_START_POINTS || []; currentLabels = COMBINED_F3_LABELS || []; currentRoofs = COMBINED_F3_ROOFS || []; 
  }

  let effectiveStartId = activeStartId;
  if (currentStartPoints && currentStartPoints.length > 0) {
    const isValidStart = currentStartPoints.some(sp => sp.id === effectiveStartId);
    if (!isValidStart) { effectiveStartId = currentStartPoints[0].id; }
  } else {
    effectiveStartId = 'none';
  }

  useEffect(() => {
    if (!targetRoomId || currentNodes.length === 0) {
      setRouteInfo(null); return;
    }

    const targetRoom = ALL_ROOMS.find(r => r.id === targetRoomId);
    if (!targetRoom) { setRouteInfo(null); return; }

    const effectiveTargetBuilding = (activeFloor === 1 && targetRoom.floor === 1) ? activeBuilding : targetRoom.building;
    let actualTargetId = targetRoomId;
    if (activeFloor === 1 && targetRoom.floor > 1) {
      actualTargetId = targetRoom.targetStairs || (targetRoom.building === 1 ? 'stairs_main_b1' : 'stairs_main_b2');
    }

    let bestStartId = effectiveStartId;
    let guaranteedPath = findShortestPath(bestStartId, actualTargetId, currentNodes, currentEdges);

    if (guaranteedPath.length === 0 && currentStartPoints.length > 1) {
        for (const sp of currentStartPoints) {
            const altPath = findShortestPath(sp.id, actualTargetId, currentNodes, currentEdges);
            if (altPath.length > 0) {
                bestStartId = sp.id;
                guaranteedPath = altPath;
                if (activeStartId !== bestStartId) {
                  setTimeout(() => { setActiveStartId(bestStartId); globalSavedStartId = bestStartId; }, 0);
                }
                break;
            }
        }
    }

    const info = buildGlobalRoute(activeBuilding, effectiveTargetBuilding, activeFloor, targetRoom.floor, bestStartId, actualTargetId, currentNodes, currentEdges);
    
    if (info) {
        let finalInstruction = info.instruction;
        let finalNextBuilding = info.nextBuilding;
        let finalNextFloor = info.nextFloor;

        if (activeFloor === 1 && targetRoom.floor > 1) {
            finalInstruction = `Підніміться на ${targetRoom.floor} поверх ➔`;
            finalNextBuilding = targetRoom.building;
            finalNextFloor = targetRoom.floor;
        }

        setRouteInfo({ ...info, instruction: finalInstruction, nextBuilding: finalNextBuilding, nextFloor: finalNextFloor, pathNodes: guaranteedPath });
    }
  }, [targetRoomId, activeBuilding, activeFloor, effectiveStartId, currentNodes, currentEdges]); 

  const generateRoutePathString = () => {
    if (!routeInfo || routeInfo.pathNodes.length === 0) return '';
    const { pathNodes } = routeInfo;
    let pathString = `M ${pathNodes[0].x} ${pathNodes[0].y} `;
    for (let i = 1; i < pathNodes.length; i++) {
      pathString += `L ${pathNodes[i].x} ${pathNodes[i].y} `;
    }
    return pathString;
  };

  const handleFloorChangeInstruction = () => {
    if (!routeInfo) return;
    setRouteHistory(prev => [...prev, { building: activeBuilding, floor: activeFloor, startId: effectiveStartId }]);

    let nextStart = routeInfo.nextStartId;
    if (targetRoomId) {
      const targetRoom = ALL_ROOMS.find(r => r.id === targetRoomId);
      if (targetRoom && targetRoom.targetStairs) nextStart = targetRoom.targetStairs; 
    }

    if (routeInfo.isMultiBuilding && routeInfo.nextBuilding) {
        setActiveBuilding(routeInfo.nextBuilding); setActiveFloor(routeInfo.nextFloor || 1); setActiveStartId(nextStart); globalSavedStartId = nextStart;
    } else if (routeInfo.isMultiFloor && routeInfo.nextFloor) {
        setActiveFloor(routeInfo.nextFloor); setActiveStartId(nextStart); globalSavedStartId = nextStart;
    }
  };

  const handleStepBack = () => {
    if (routeHistory.length === 0) return;
    const newHistory = [...routeHistory];
    const previousState = newHistory.pop();
    if (previousState) {
        setActiveBuilding(previousState.building); setActiveFloor(previousState.floor); setActiveStartId(previousState.startId); setRouteHistory(newHistory); 
    }
  };

  const handleResetRoute = () => {
    if (initialRouteConfig) {
      setActiveBuilding(initialRouteConfig.building); setActiveFloor(initialRouteConfig.floor); setActiveStartId(initialRouteConfig.startId);
    } else {
      setActiveFloor(1); setActiveBuilding(1); setActiveStartId(globalSavedStartId); 
    }
    setTargetRoomId(null); setSearchQuery(''); setRouteInfo(null); setRouteHistory([]); setInitialRouteConfig(null);
  };

  return (
    <View style={styles.container}>
      
      {/* ЗАГОЛОВОК */}
      <Text style={styles.mapTitle}>
        {activeFloor} поверх — <Text style={{ fontWeight: 'bold' }}>
          {targetRoomId 
            ? `ціль: ${(() => {
                const r = ALL_ROOMS.find(r => r.id === targetRoomId);
                const name = r?.description || r?.label || 'каб. ' + targetRoomId;
                return name.replace('\n', ' ');
              })()}` 
            : 'Оберіть кабінет'}
        </Text>
      </Text>

      {/* 🔥 ЄДИНИЙ РЯДОК: ПОШУК + КОРПУС + ПОВЕРХИ */}
      <View style={styles.topBar}>
        
        {/* Пошуковий рядок */}
        <View style={[styles.searchWrapper, { flex: 1, minWidth: 250, maxWidth: 370 }]}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
              style={styles.searchInput}
              placeholder={isNarrowSearch ? "Пошук..." : "Пошук кабінету (напр. Кабінет 25)"}
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 300 }}>
                {searchResults.map((room) => (
                  <TouchableOpacity 
                    key={`search-${room.building}-${room.floor}-${room.id}`} 
                    style={styles.searchResultItem}
                    onPress={() => handleSelectRoomFromSearch(room)}
                  >
                    <Text style={styles.searchResultText}>
                      {(room.description || room.label).replace('\n', ' ')}
                    </Text>
                    <Text style={styles.searchResultSubtext}>
                      Корпус {room.building}, Поверх {room.floor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Перемикачі корпусу та поверхів */}
        <View style={styles.selectorsWrapper}>
          <View style={styles.tabSelector}>
            <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]} disabled={true}>
              <Text style={[styles.tabButtonText, styles.tabButtonTextActive]}>Головний корпус</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabSelector}>
            {[1, 2, 3].map((floor) => (
              <TouchableOpacity 
                key={`f-${floor}`}
                style={[styles.tabButton, activeFloor === floor && styles.tabButtonActive]}
                onPress={() => setActiveFloor(floor)}
              >
                <Text style={[styles.tabButtonText, activeFloor === floor && styles.tabButtonTextActive]}>
                  {floor} пов.
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>

      {/* 🔥 ГАРЯЧІ КНОПКИ ШВИДКОГО ДОСТУПУ */}
      <View style={styles.hotkeysPanel}>
        <Text style={styles.hotkeysTitle}>Швидкий пошук:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hotkeysScroll}>
          {QUICK_LINKS.map((link, idx) => (
            <TouchableOpacity 
              key={`quick-${idx}`} 
              style={styles.hotkeyBtn} 
              onPress={() => handleQuickLink(link.roomId)} 
            >
              <Text style={styles.hotkeyIcon}>{link.icon}</Text>
              <Text style={styles.hotkeyText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* КАРТА */}
      <View style={styles.mapArea}>
        <MapCanvas 
          rooms={currentRooms}
          startPoints={currentStartPoints}
          activeStartId={effectiveStartId}
          viewBox={currentViewBox}
          wallsPath={currentWallsPath}
          targetRoomId={targetRoomId}
          routePath={generateRoutePathString()}
          onRoomSelect={handleRoomClick}
          staticLabels={currentLabels} 
          roofZones={currentRoofs} 
          roadZones={ROAD_ZONES}
        />
      </View>

      {/* ПАНЕЛЬ ІНСТРУКЦІЙ ДЛЯ МАРШРУТУ */}
      {(routeInfo?.isMultiFloor || routeInfo?.isMultiBuilding || targetRoomId) && (
        <View style={styles.instructionContainer}>
          {routeHistory.length > 0 && (
              <TouchableOpacity style={[styles.instructionButton, styles.stepBackButton]} onPress={handleStepBack}>
                  <Text style={styles.stepBackText}>⬅ Крок назад</Text>
              </TouchableOpacity>
          )}

          {routeInfo?.isMultiFloor || routeInfo?.isMultiBuilding ? (
              <TouchableOpacity style={styles.instructionButton} onPress={handleFloorChangeInstruction}>
                  <Text style={styles.instructionText}>{routeInfo.instruction}</Text>
              </TouchableOpacity>
          ) : (
              <TouchableOpacity style={[styles.instructionButton, styles.returnButton]} onPress={handleResetRoute}>
                  <Text style={styles.instructionText}> Завершити маршрут</Text>
              </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, backgroundColor: Colors.background },
  
  mapTitle: { 
    fontSize: 22, 
    color: Colors.textMain, 
    marginBottom: 16, 
    fontWeight: '500'
  },
  
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 20, 
    zIndex: 50, 
    elevation: 50,
    width: '100%',
    gap: 16, 
    flexWrap: 'wrap', 
  },
  
  searchWrapper: { flex: 1, zIndex: 50, elevation: 50 },
  searchContainer: { flexDirection: 'row', backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 18, color: Colors.textMain, outlineStyle: 'none' } as any,
  searchResults: { 
    position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: Colors.white, 
    borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0', 
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', elevation: 5, overflow: 'hidden' 
  },
  searchResultItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchResultText: { fontSize: 18, fontWeight: 'bold', color: Colors.textMain, flexShrink: 1, marginRight: 10 }, 
  searchResultSubtext: { fontSize: 14, color: Colors.textSecondary },
  
  selectorsWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tabSelector: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4 },
  tabButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  tabButtonActive: { backgroundColor: Colors.white, boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', elevation: 2 },
  tabButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.textSecondary },
  tabButtonTextActive: { color: Colors.primary },

  hotkeysPanel: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%', zIndex: 1 },
  hotkeysTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textSecondary, marginRight: 12 },
  hotkeysScroll: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingRight: 20 },
  hotkeyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  hotkeyIcon: { fontSize: 16 },
  hotkeyText: { fontSize: 15, fontWeight: '600', color: Colors.textMain },

  mapArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 0, backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#E2E8F0', zIndex: 1, position: 'relative' },
  instructionContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 20, zIndex: 10 },
  instructionButton: { backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)', elevation: 8 },
  returnButton: { backgroundColor: '#475569' },
  instructionText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  stepBackButton: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.primary, paddingVertical: 14 },
  stepBackText: { color: Colors.primary, fontSize: 20, fontWeight: 'bold' }
});