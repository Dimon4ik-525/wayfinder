import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, LogBox, ScrollView, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
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

// 🔥 РОЗУМНИЙ фільтр для помилок (console.error)
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

// 🔥 РОЗУМНИЙ фільтр для попереджень (console.warn)
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

// 1 ПОВЕРХ (Об'єднаний)
import { 
  ROOMS as COMBINED_F1_ROOMS, VIEW_BOX as COMBINED_F1_VIEWBOX, 
  WALLS_PATH as COMBINED_F1_WALLS, NODES as COMBINED_F1_NODES, EDGES as COMBINED_F1_EDGES, START_POINTS as COMBINED_F1_START_POINTS, KIOSK_POSITION as COMBINED_F1_KIOSK_POSITION,
  STATIC_LABELS as COMBINED_F1_LABELS 
} from '../constants/maps/combined_floor1';

// 2 ПОВЕРХ (Новий об'єднаний)
import { 
  ROOMS as COMBINED_F2_ROOMS, VIEW_BOX as COMBINED_F2_VIEWBOX, 
  WALLS_PATH as COMBINED_F2_WALLS, NODES as COMBINED_F2_NODES, EDGES as COMBINED_F2_EDGES, START_POINTS as COMBINED_F2_START_POINTS,
  STATIC_LABELS as COMBINED_F2_LABELS 
} from '../constants/maps/combined_floor2';

// 3 ПОВЕРХ (Об'єднаний)
import { 
  ROOMS as COMBINED_F3_ROOMS, VIEW_BOX as COMBINED_F3_VIEWBOX, 
  WALLS_PATH as COMBINED_F3_WALLS, NODES as COMBINED_F3_NODES, EDGES as COMBINED_F3_EDGES, START_POINTS as COMBINED_F3_START_POINTS,
  STATIC_LABELS as COMBINED_F3_LABELS 
} from '../constants/maps/combined_floor3'; 

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

export default function MapScreen() {
  const params = useLocalSearchParams();
  
  const { width } = useWindowDimensions();
  const isNarrowSearch = width < 850; 

  const [activeBuilding, setActiveBuilding] = useState(1);
  const [activeFloor, setActiveFloor] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(new Date());
  
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null);
  const [activeStartId, setActiveStartId] = useState(globalSavedStartId);

  const [routeInfo, setRouteInfo] = useState<RouteStepInfo | null>(null);
  const [initialRouteConfig, setInitialRouteConfig] = useState<{building: number, floor: number, startId: string} | null>(null);
  const [routeHistory, setRouteHistory] = useState<{building: number, floor: number, startId: string}[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const changeStartPoint = (id: string) => {
    setActiveStartId(id);
    globalSavedStartId = id; 
  };

  useEffect(() => {
    if (params.room) {
      const roomParam = params.room as string;
      
      const exactMatch = ALL_ROOMS.find(r => 
        r.id === roomParam || 
        r.label.toLowerCase() === roomParam.toLowerCase()
      );

      const foundRoom = exactMatch || ALL_ROOMS.find(r => 
        r.label.toLowerCase().includes(roomParam.toLowerCase())
      );

      if (foundRoom) {
        if (!initialRouteConfig) {
          setActiveBuilding(1);
          setActiveFloor(1);
          setActiveStartId(globalSavedStartId);
          
          setInitialRouteConfig({
            building: 1,
            floor: 1,
            startId: globalSavedStartId
          });
        }
        setTargetRoomId(foundRoom.id);
      } else {
        setSearchQuery(roomParam);
      }
    }
  }, [params.room]);

  const formatDate = (date: Date) => {
    const months = ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];
    return `📅 ${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

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
      setInitialRouteConfig({
        building: activeBuilding,
        floor: activeFloor,
        startId: activeStartId
      });
    }
    setTargetRoomId(room.id);
    setSearchQuery('');
  };

  const handleRoomClick = (roomId: string | null) => {
    if (roomId) {
      if (!initialRouteConfig) {
        setInitialRouteConfig({
          building: activeBuilding,
          floor: activeFloor,
          startId: activeStartId
        });
      }
      setTargetRoomId(roomId);
    } else {
      setTargetRoomId(null);
      setInitialRouteConfig(null);
      setRouteHistory([]);
    }
  };

  let currentRooms: any[] = [];
  let currentViewBox = "0 0 800 400";
  let currentWallsPath = "";
  let currentNodes: any[] = [];
  let currentEdges: any[] = [];
  let currentStartPoints: any[] = []; 
  let currentLabels: any[] = [];

  if (activeFloor === 1) {
    currentRooms = COMBINED_F1_ROOMS; currentViewBox = COMBINED_F1_VIEWBOX;
    currentWallsPath = COMBINED_F1_WALLS; currentNodes = COMBINED_F1_NODES; currentEdges = COMBINED_F1_EDGES; 
    currentStartPoints = COMBINED_F1_START_POINTS || []; 
    currentLabels = COMBINED_F1_LABELS || []; 
  } else if (activeFloor === 2) {
    currentRooms = COMBINED_F2_ROOMS; currentViewBox = COMBINED_F2_VIEWBOX;
    currentWallsPath = COMBINED_F2_WALLS; currentNodes = COMBINED_F2_NODES; currentEdges = COMBINED_F2_EDGES;
    currentStartPoints = COMBINED_F2_START_POINTS || [];
    currentLabels = COMBINED_F2_LABELS || [];
  } else if (activeFloor === 3) {
    currentRooms = COMBINED_F3_ROOMS; currentViewBox = COMBINED_F3_VIEWBOX;
    currentWallsPath = COMBINED_F3_WALLS; currentNodes = COMBINED_F3_NODES; currentEdges = COMBINED_F3_EDGES;
    currentStartPoints = COMBINED_F3_START_POINTS || [];
    currentLabels = COMBINED_F3_LABELS || [];
  }

  let effectiveStartId = activeStartId;
  let dynamicKioskPosition = { x: 0, y: 0 };

  if (currentStartPoints && currentStartPoints.length > 0) {
    const isValidStart = currentStartPoints.some(sp => sp.id === effectiveStartId);
    if (!isValidStart) {
      effectiveStartId = currentStartPoints[0].id;
    }
  }

  const startNode = currentNodes.find(n => n.id === effectiveStartId);

  if (startNode) {
    dynamicKioskPosition = { x: startNode.x, y: startNode.y };
  } else if (currentStartPoints && currentStartPoints.length > 0) {
    dynamicKioskPosition = { x: currentStartPoints[0].x, y: currentStartPoints[0].y };
  } else {
    effectiveStartId = 'none';
    dynamicKioskPosition = activeFloor === 1 && typeof COMBINED_F1_KIOSK_POSITION !== 'undefined' 
        ? COMBINED_F1_KIOSK_POSITION 
        : { x: 0, y: 0 };
  }

  useEffect(() => {
    if (!targetRoomId || currentNodes.length === 0) {
      setRouteInfo(null);
      return;
    }

    const targetRoom = ALL_ROOMS.find(r => r.id === targetRoomId);
    
    if (!targetRoom) {
      setRouteInfo(null);
      return;
    }

    const effectiveTargetBuilding = (activeFloor === 1 && targetRoom.floor === 1) 
      ? activeBuilding 
      : targetRoom.building;

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
                  setTimeout(() => {
                    setActiveStartId(bestStartId);
                    globalSavedStartId = bestStartId;
                  }, 0);
                }
                break;
            }
        }
    }

    const info = buildGlobalRoute(
        activeBuilding,
        effectiveTargetBuilding,
        activeFloor, 
        targetRoom.floor, 
        bestStartId, 
        actualTargetId, 
        currentNodes, 
        currentEdges
    );
    
    if (info) {
        let finalInstruction = info.instruction;
        let finalNextBuilding = info.nextBuilding;
        let finalNextFloor = info.nextFloor;

        if (activeFloor === 1 && targetRoom.floor > 1) {
            finalInstruction = `Підніміться на ${targetRoom.floor} поверх ➔`;
            finalNextBuilding = targetRoom.building;
            finalNextFloor = targetRoom.floor;
        }

        setRouteInfo({
            ...info,
            instruction: finalInstruction,
            nextBuilding: finalNextBuilding,
            nextFloor: finalNextFloor,
            pathNodes: guaranteedPath 
        });
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

    setRouteHistory(prev => [...prev, {
      building: activeBuilding,
      floor: activeFloor,
      startId: effectiveStartId
    }]);

    let nextStart = routeInfo.nextStartId;
    if (targetRoomId) {
      const targetRoom = ALL_ROOMS.find(r => r.id === targetRoomId);
      if (targetRoom && targetRoom.targetStairs) {
        nextStart = targetRoom.targetStairs; 
      }
    }

    if (routeInfo.isMultiBuilding && routeInfo.nextBuilding) {
        setActiveBuilding(routeInfo.nextBuilding);
        setActiveFloor(routeInfo.nextFloor || 1); 
        setActiveStartId(nextStart); 
        globalSavedStartId = nextStart;
    } else if (routeInfo.isMultiFloor && routeInfo.nextFloor) {
        setActiveFloor(routeInfo.nextFloor);
        setActiveStartId(nextStart); 
        globalSavedStartId = nextStart;
    }
  };

  const handleStepBack = () => {
    if (routeHistory.length === 0) return;

    const newHistory = [...routeHistory];
    const previousState = newHistory.pop();

    if (previousState) {
        setActiveBuilding(previousState.building);
        setActiveFloor(previousState.floor);
        setActiveStartId(previousState.startId);
        setRouteHistory(newHistory); 
    }
  };

  const handleResetRoute = () => {
    if (initialRouteConfig) {
      setActiveBuilding(initialRouteConfig.building);
      setActiveFloor(initialRouteConfig.floor);
      setActiveStartId(initialRouteConfig.startId);
    } else {
      setActiveFloor(1); 
      setActiveBuilding(1); 
      setActiveStartId(globalSavedStartId); 
    }
    
    setTargetRoomId(null);
    setSearchQuery('');
    setRouteInfo(null);
    setRouteHistory([]); 
    setInitialRouteConfig(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        
        <View style={[styles.searchWrapper, { flex: 1, marginRight: 16 }]}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
              style={styles.searchInput}
              placeholder={isNarrowSearch ? "Пошук..." : "Пошук кабінету (напр. Лабораторія, 24)"}
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

        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText} numberOfLines={1}>{formatDate(now)}</Text>
        </View>
      </View>

      {/* 🔥 ОНОВЛЕНО: Перемикач з'являється ТІЛЬКИ на 1 поверсі */}
      {activeFloor === 1 && currentStartPoints && currentStartPoints.length > 1 && routeHistory.length === 0 && !targetRoomId && (
        <View style={styles.startPointsPanel}>
          <Text style={styles.startPointsLabel}>Почати маршрут від:</Text>
          <View style={styles.startPointsButtons}>
            {currentStartPoints.map(sp => (
              <TouchableOpacity
                key={sp.id}
                style={[styles.startBtn, effectiveStartId === sp.id && styles.startBtnActive]}
                onPress={() => changeStartPoint(sp.id)}
              >
                <Text style={[styles.startBtnText, effectiveStartId === sp.id && styles.startBtnTextActive]}>
                  📍 {sp.label || 'Вхід'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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

      <View style={styles.controlPanel}>
        <View style={styles.tabSelector}>
            <TouchableOpacity 
              style={[styles.tabButton, styles.tabButtonActive]}
              disabled={true} 
            >
              <Text style={[styles.tabButtonText, styles.tabButtonTextActive]}>
                Головний корпус
              </Text>
            </TouchableOpacity>
        </View>

        <View style={styles.tabSelector}>
          {[1, 2, 3].map((floor) => (
            <TouchableOpacity 
              key={`f-${floor}`}
              style={[styles.tabButton, activeFloor === floor && styles.tabButtonActive]}
              onPress={() => {
                setActiveFloor(floor);
              }}
            >
              <Text style={[styles.tabButtonText, activeFloor === floor && styles.tabButtonTextActive]}>
                {floor} пов.
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.mapArea}>
        <MapCanvas 
          rooms={currentRooms}
          startPoints={currentStartPoints}
          activeStartId={effectiveStartId}
          kioskPosition={dynamicKioskPosition}
          viewBox={currentViewBox}
          wallsPath={currentWallsPath}
          targetRoomId={targetRoomId}
          routePath={generateRoutePathString()}
          onRoomSelect={handleRoomClick}
          staticLabels={currentLabels} 
        />
      </View>

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
  topBar: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'nowrap', marginBottom: 20, zIndex: 50, elevation: 50 },
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
  searchResultText: { fontSize: 18, fontWeight: 'bold', color: Colors.textMain, flexShrink: 1, marginRight: 10 }, 
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
  mapArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10, backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#E2E8F0', zIndex: 1, position: 'relative' },
  instructionContainer: {
    flexDirection: 'row', 
    justifyContent: 'center',
    gap: 16, 
    marginTop: 20, 
    zIndex: 10,
  },
  instructionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  returnButton: {
    backgroundColor: '#475569', 
  },
  instructionText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepBackButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 14, 
  },
  stepBackText: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  }
});