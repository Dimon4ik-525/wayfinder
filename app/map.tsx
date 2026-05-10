import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, LogBox, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../constants/theme';

import MapCanvas from '../components/MapCanvas';

LogBox.ignoreLogs([
  'Unknown event handler property `onStartShouldSetResponder`',
  'Unknown event handler property `onResponderTerminationRequest`',
  'Unknown event handler property `onResponderGrant`',
  'Unknown event handler property `onResponderMove`',
  'Unknown event handler property `onResponderRelease`',
  'Unknown event handler property `onResponderTerminate`',
]);

const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Unknown event handler property')) {
    return; 
  }
  originalConsoleError(...args);
};

import { findShortestPath, buildGlobalRoute, RouteStepInfo } from '../utils/navigation';

import { 
  ROOMS as COMBINED_F1_ROOMS, VIEW_BOX as COMBINED_F1_VIEWBOX, 
  WALLS_PATH as COMBINED_F1_WALLS, NODES as COMBINED_F1_NODES, EDGES as COMBINED_F1_EDGES, START_POINTS as COMBINED_F1_START_POINTS, KIOSK_POSITION as COMBINED_F1_KIOSK_POSITION
} from '../constants/maps/combined_floor1';

import { 
  ROOMS as B1_F2_ROOMS, VIEW_BOX as B1_F2_VIEWBOX, 
  WALLS_PATH as B1_F2_WALLS, NODES as B1_F2_NODES, EDGES as B1_F2_EDGES, START_POINTS as B1_F2_START_POINTS
} from '../constants/maps/corp1/floor2'; 

import { 
  ROOMS as B1_F3_ROOMS, VIEW_BOX as B1_F3_VIEWBOX, 
  WALLS_PATH as B1_F3_WALLS, NODES as B1_F3_NODES, EDGES as B1_F3_EDGES, START_POINTS as B1_F3_START_POINTS
} from '../constants/maps/corp1/floor3'; 

import { 
  ROOMS as B2_F2_ROOMS, VIEW_BOX as B2_F2_VIEWBOX, 
  WALLS_PATH as B2_F2_WALLS, NODES as B2_F2_NODES, EDGES as B2_F2_EDGES, START_POINTS as B2_F2_START_POINTS
} from '../constants/maps/corp2/floor2'; 

import { 
  ROOMS as B2_F3_ROOMS, VIEW_BOX as B2_F3_VIEWBOX, 
  WALLS_PATH as B2_F3_WALLS, NODES as B2_F3_NODES, EDGES as B2_F3_EDGES, START_POINTS as B2_F3_START_POINTS
} from '../constants/maps/corp2/floor3'; 

const ALL_ROOMS = [
  ...COMBINED_F1_ROOMS,
  ...B1_F2_ROOMS,
  ...B1_F3_ROOMS,
  ...B2_F2_ROOMS,
  ...B2_F3_ROOMS
];

let globalSavedStartId = 'start_main';

export default function MapScreen() {
  const params = useLocalSearchParams();
  
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

  // 🔥 ВИПРАВЛЕНО: Пріоритетний пошук точного збігу для уникнення плутанини (напр. 3 та 13)
  useEffect(() => {
    if (params.room) {
      const roomParam = params.room as string;
      
      // 1. Шукаємо точний збіг по ID або Лейблу
      const exactMatch = ALL_ROOMS.find(r => 
        r.id === roomParam || 
        r.label.toLowerCase() === roomParam.toLowerCase()
      );

      // 2. Якщо точного немає, шукаємо входження підрядка
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

  // 🔥 ОНОВЛЕНО: Сортування результатів пошуку (точні збіги попереду)
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

  if (activeFloor === 1) {
    currentRooms = COMBINED_F1_ROOMS; currentViewBox = COMBINED_F1_VIEWBOX;
    currentWallsPath = COMBINED_F1_WALLS; currentNodes = COMBINED_F1_NODES; currentEdges = COMBINED_F1_EDGES; 
    currentStartPoints = COMBINED_F1_START_POINTS || []; 
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
    currentStartPoints = B2_F2_START_POINTS || [];
  } else if (activeBuilding === 2 && activeFloor === 3) {
    currentRooms = B2_F3_ROOMS; currentViewBox = B2_F3_VIEWBOX;
    currentWallsPath = B2_F3_WALLS; currentNodes = B2_F3_NODES; currentEdges = B2_F3_EDGES;
    currentStartPoints = B2_F3_START_POINTS || [];
  }

  let effectiveStartId = activeStartId;
  let dynamicKioskPosition = { x: 0, y: 0 };

  if (activeFloor > 1) {
    if (activeBuilding === 1) {
      effectiveStartId = 'stairs_main_b1'; 
    } else {
      effectiveStartId = 'stairs_main_b2';
    }
  }

  const startNode = currentNodes.find(n => n.id === effectiveStartId);

  if (startNode) {
    dynamicKioskPosition = { x: startNode.x, y: startNode.y };
  } else if (currentStartPoints && currentStartPoints.length > 0) {
    effectiveStartId = currentStartPoints[0].id;
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
      actualTargetId = targetRoom.building === 1 ? 'stairs_main_b1' : 'stairs_main_b2';
    }

    const info = buildGlobalRoute(
        activeBuilding,
        effectiveTargetBuilding,
        activeFloor, 
        targetRoom.floor, 
        effectiveStartId, 
        actualTargetId, 
        currentNodes, 
        currentEdges
    );

    const guaranteedPath = findShortestPath(effectiveStartId, actualTargetId, currentNodes, currentEdges);
    
    if (info) {
        let finalInstruction = info.instruction;
        let finalNextBuilding = info.nextBuilding;
        let finalNextFloor = info.nextFloor;

        if (activeFloor === 1 && targetRoom.floor > 1) {
            finalInstruction = `Підніміться на ${targetRoom.floor} поверх (Корпус ${targetRoom.building}) ➔`;
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

    if (routeInfo.isMultiBuilding && routeInfo.nextBuilding) {
        setActiveBuilding(routeInfo.nextBuilding);
        setActiveFloor(routeInfo.nextFloor || 1); 
        setActiveStartId(routeInfo.nextStartId); 
    } else if (routeInfo.isMultiFloor && routeInfo.nextFloor) {
        setActiveFloor(routeInfo.nextFloor);
        setActiveStartId(routeInfo.nextStartId); 
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

      {currentStartPoints && currentStartPoints.length > 1 && routeHistory.length === 0 && !targetRoomId && (
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
                  📍 {sp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.mapTitle}>
        {activeFloor === 1 ? '1 поверх' : `Корпус ${activeBuilding}, ${activeFloor} поверх`} — <Text style={{ fontWeight: 'bold' }}>
          {targetRoomId ? `ціль: ${ALL_ROOMS.find(r => r.id === targetRoomId)?.label || 'каб. ' + targetRoomId}` : 'Оберіть кабінет'}
        </Text>
      </Text>

      <View style={styles.controlPanel}>
        <View style={styles.tabSelector}>
          {[1, 2].map((building) => (
            <TouchableOpacity 
              key={`b-${building}`}
              style={[styles.tabButton, activeBuilding === building && styles.tabButtonActive]}
              onPress={() => {
                setActiveBuilding(building);
                setTargetRoomId(null); 
                setActiveFloor(1); 
                setRouteHistory([]); 
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
          kioskPosition={dynamicKioskPosition}
          viewBox={currentViewBox}
          wallsPath={currentWallsPath}
          targetRoomId={targetRoomId}
          routePath={generateRoutePathString()}
          onRoomSelect={handleRoomClick}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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