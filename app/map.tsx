import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, LogBox, ScrollView, useWindowDimensions } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

import MapCanvas from '../components/MapCanvas';

LogBox.ignoreLogs([
  'Unknown event handler property',
  'Invalid DOM property',
  '"shadow*" style props are deprecated',
  'TouchableMixin is deprecated',
  'useNativeDriver'
]);

const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  const param1 = typeof args[1] === 'string' ? args[1] : '';
  if (
    msg.includes('Unknown event handler property') ||
    (msg.includes('Invalid DOM property') && param1 === 'transform-origin') 
  ) { return; }
  originalConsoleError(...args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('"shadow*" style props') ||
    msg.includes('TouchableMixin') ||
    msg.includes('useNativeDriver') ||
    msg.includes('pointerEvents')
  ) { return; }
  originalConsoleWarn(...args);
};

import { findShortestPath, buildGlobalRoute, RouteStepInfo } from '../utils/navigation';

import { TERRITORY_BUILDINGS, TERRITORY_VIEWBOX, TERRITORY_WALLS, TERRITORY_ROADS, TERRITORY_LABELS, TERRITORY_NODES, TERRITORY_EDGES, TERRITORY_START_POINTS } from '../constants/maps/territory';
import { ROOMS as COMBINED_F1_ROOMS, VIEW_BOX as COMBINED_F1_VIEWBOX, WALLS_PATH as COMBINED_F1_WALLS, NODES as COMBINED_F1_NODES, EDGES as COMBINED_F1_EDGES, START_POINTS as COMBINED_F1_START_POINTS, STATIC_LABELS as COMBINED_F1_LABELS, ROAD_ZONES } from '../constants/maps/combined_floor1';
import { ROOMS as COMBINED_F2_ROOMS, VIEW_BOX as COMBINED_F2_VIEWBOX, WALLS_PATH as COMBINED_F2_WALLS, NODES as COMBINED_F2_NODES, EDGES as COMBINED_F2_EDGES, START_POINTS as COMBINED_F2_START_POINTS, STATIC_LABELS as COMBINED_F2_LABELS, ROOF_ZONES as COMBINED_F2_ROOFS } from '../constants/maps/combined_floor2';
import { ROOMS as COMBINED_F3_ROOMS, VIEW_BOX as COMBINED_F3_VIEWBOX, WALLS_PATH as COMBINED_F3_WALLS, NODES as COMBINED_F3_NODES, EDGES as COMBINED_F3_EDGES, START_POINTS as COMBINED_F3_START_POINTS, STATIC_LABELS as COMBINED_F3_LABELS, ROOF_ZONES as COMBINED_F3_ROOFS } from '../constants/maps/combined_floor3'; 
import { ROOMS as WORKSHOP_F1_ROOMS, VIEW_BOX as WORKSHOP_F1_VIEWBOX, WALLS_PATH as WORKSHOP_F1_WALLS, NODES as WORKSHOP_F1_NODES, EDGES as WORKSHOP_F1_EDGES, START_POINTS as WORKSHOP_F1_START_POINTS, STATIC_LABELS as WORKSHOP_F1_LABELS, ROOF_ZONES as WORKSHOP_F1_ROOFS } from '../constants/maps/workshop_floor1';
import { ROOMS as WORKSHOP_F2_ROOMS, VIEW_BOX as WORKSHOP_F2_VIEWBOX, WALLS_PATH as WORKSHOP_F2_WALLS, NODES as WORKSHOP_F2_NODES, EDGES as WORKSHOP_F2_EDGES, START_POINTS as WORKSHOP_F2_START_POINTS } from '../constants/maps/workshop_floor2';
import { ROOMS as SPORTS_F1_ROOMS, VIEW_BOX as SPORTS_F1_VIEWBOX, WALLS_PATH as SPORTS_F1_WALLS, NODES as SPORTS_F1_NODES, EDGES as SPORTS_F1_EDGES, START_POINTS as SPORTS_F1_START_POINTS } from '../constants/maps/sports_floor1';
import { ROOMS as SPORTS_F2_ROOMS, VIEW_BOX as SPORTS_F2_VIEWBOX, WALLS_PATH as SPORTS_F2_WALLS, NODES as SPORTS_F2_NODES, EDGES as SPORTS_F2_EDGES, START_POINTS as SPORTS_F2_START_POINTS } from '../constants/maps/sports_floor2';
import { ROOMS as SPORTS_F3_ROOMS, VIEW_BOX as SPORTS_F3_VIEWBOX, WALLS_PATH as SPORTS_F3_WALLS, NODES as SPORTS_F3_NODES, EDGES as SPORTS_F3_EDGES, START_POINTS as SPORTS_F3_START_POINTS } from '../constants/maps/sports_floor3';

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
  points?: string; 
  textX?: number; 
  textY?: number; 
}

const ALL_ROOMS = [
  ...COMBINED_F1_ROOMS,
  ...COMBINED_F2_ROOMS, 
  ...COMBINED_F3_ROOMS,
  ...WORKSHOP_F1_ROOMS,
  ...WORKSHOP_F2_ROOMS,
  ...SPORTS_F1_ROOMS,
  ...SPORTS_F2_ROOMS,
  ...SPORTS_F3_ROOMS,
  ...TERRITORY_BUILDINGS
] as RoomData[];

let globalSavedStartId = 'start_main';

const QUICK_LINKS: { label: string; roomId: string; icon?: string }[] = [
  { label: 'Директор', roomId: 'director' },
  { label: 'З.д з навч', roomId: 'deputy_1' },
  { label: 'З.д з н-вих/мет', roomId: 'deputy_2' },
  { label: 'З.д з а-гос', roomId: 'deputy_3' },
  { label: 'З.д з н-вир', roomId: 'deputy_4' },
  { label: 'Приймальна', roomId: 'reception' },
  { label: 'Буфет', roomId: 'bufet' },
  { label: 'Бібліотека', roomId: 'bibl' },
  { label: 'Музей', roomId: 'museum' },
  { label: 'Бухгалтерія', roomId: 'accounting' },
];
const ADMISSION_QUICK_LINKS: { label: string; roomId: string; icon?: string }[] = [
  { label: 'Приймальна комісія Б/ФМБ', roomId: '12' },
  { label: 'Приймальна комісія кваліф. роб', roomId: 'chit' },
];

export default function MapScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrowSearch = width < 850; 

  const [activeBuilding, setActiveBuilding] = useState(1); 
  const [activeFloor, setActiveFloor] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null);
  const [activeStartId, setActiveStartId] = useState(globalSavedStartId);
  const [isAdmissionMode, setIsAdmissionMode] = useState(false);
  const [lastScheduleGroup, setLastScheduleGroup] = useState<any>(null);

  const [routeInfo, setRouteInfo] = useState<RouteStepInfo | null>(null);
  const [initialRouteConfig, setInitialRouteConfig] = useState<{building: number, floor: number, startId: string} | null>(null);
  const [routeHistory, setRouteHistory] = useState<{building: number, floor: number, startId: string}[]>([]);
  const [pendingRoom, setPendingRoom] = useState<RoomData | null>(null);

  // 🔥 Стан та Refs для клікабельних стрілочок
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const layoutWidth = useRef(0); // Ширина самого вікна скролу
  const contentWidth = useRef(0); // Загальна ширина всіх кнопок
  
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  // За замовчуванням ставимо false, щоб стрілка не блимала на широких екранах
  const [showRightArrow, setShowRightArrow] = useState(false); 

  // Розумна функція перевірки видимості стрілок
  const checkArrowsVisibility = (offsetX: number) => {
    if (contentWidth.current <= layoutWidth.current) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }

    const isStartReached = offsetX <= 5;
    const isEndReached = offsetX + layoutWidth.current >= contentWidth.current - 15;

    setShowLeftArrow(!isStartReached);
    setShowRightArrow(!isEndReached);
  };

  const handleScroll = (event: any) => {
    scrollX.current = event.nativeEvent.contentOffset.x;
    checkArrowsVisibility(scrollX.current);
  };

  const handleScrollLeft = () => {
    scrollViewRef.current?.scrollTo({ x: Math.max(0, scrollX.current - 250), animated: true });
  };
  const handleScrollRight = () => {
    scrollViewRef.current?.scrollTo({ x: scrollX.current + 250, animated: true });
  };

  useEffect(() => {
    const loadStartPoint = async () => {
      try {
        const saved = await AsyncStorage.getItem('userStartEntrance');
        if (saved) {
          setActiveStartId(saved);
          globalSavedStartId = saved;
        }
        const admissionSaved = await AsyncStorage.getItem('admissionMode');
        if (admissionSaved === 'true') setIsAdmissionMode(true);
        const savedGroup = await AsyncStorage.getItem('lastSelectedGroup');
        if (savedGroup) setLastScheduleGroup(JSON.parse(savedGroup));
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
          setActiveStartId(globalSavedStartId);
          setInitialRouteConfig({ building: activeBuilding, floor: activeFloor, startId: globalSavedStartId });
        }
        setPendingRoom(foundRoom);
        setTargetRoomId(foundRoom.id);
      } else {
        setSearchQuery(roomParam);
      }
    }
  }, [params.room]);

  useEffect(() => {
    if (!routeInfo || !pendingRoom) return;
    if (!routeInfo.isMultiFloor && !routeInfo.isMultiBuilding) {
      if (activeBuilding !== pendingRoom.building || activeFloor !== pendingRoom.floor) {
        setActiveBuilding(pendingRoom.building);
        setActiveFloor(pendingRoom.floor);
      }
    }
  }, [routeInfo]);

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
    setPendingRoom(room as RoomData);
    setTargetRoomId(room.id);
    setSearchQuery('');
  };

  const handleQuickLink = (targetId: string) => {
    const foundRoom = ALL_ROOMS.find(r => r.id === targetId);
    if (foundRoom) {
      handleSelectRoomFromSearch(foundRoom);
    } else {
      console.warn(`Кабінет з ID "${targetId}" не знайдено на жодному поверсі`);
    }
  };

  const handleStartPointClick = (startId: string) => {
    setActiveStartId(startId);
    globalSavedStartId = startId;
  };

  const handleRoomClick = (roomId: string | null) => {
    if (activeBuilding === 0) {
      if (roomId === 'b_main') {
        setActiveBuilding(1); setActiveFloor(1); setTargetRoomId(null); return;
      }
      if (roomId === 'b_workshop') {
        setActiveBuilding(2); setActiveFloor(1); setTargetRoomId(null); return;
      }
      if (roomId === 'b_sports') {
        setActiveBuilding(3); setActiveFloor(1); setTargetRoomId(null); return;
      }
      
      if (roomId && roomId.startsWith('b_') && roomId !== 'b_sports' && roomId !== 'b_main' && roomId !== 'b_workshop') {
        alert("Детальна мапа для цього об'єкта ще в розробці!");
        return;
      }
    }

    if (roomId) {
      if (!initialRouteConfig) {
        setInitialRouteConfig({ building: activeBuilding, floor: activeFloor, startId: activeStartId });
      }
      setTargetRoomId(roomId);
    } else {
      setTargetRoomId(null);
      setInitialRouteConfig(null);
      setPendingRoom(null);
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
  let currentRoads: any[] = []; 

  if (activeBuilding === 0) {
    currentRooms = TERRITORY_BUILDINGS;
    currentViewBox = TERRITORY_VIEWBOX;
    currentWallsPath = TERRITORY_WALLS;
    currentRoads = TERRITORY_ROADS; 
    currentLabels = TERRITORY_LABELS; 
    currentNodes = TERRITORY_NODES;
    currentEdges = TERRITORY_EDGES;
    currentStartPoints = TERRITORY_START_POINTS;
    currentRoofs = []; 
  } else if (activeBuilding === 1) {
    if (activeFloor === 1) {
      currentRooms = COMBINED_F1_ROOMS; currentViewBox = COMBINED_F1_VIEWBOX; currentWallsPath = COMBINED_F1_WALLS; currentNodes = COMBINED_F1_NODES; currentEdges = COMBINED_F1_EDGES; currentStartPoints = COMBINED_F1_START_POINTS || []; currentLabels = COMBINED_F1_LABELS || []; currentRoofs = []; currentRoads = ROAD_ZONES; 
    } else if (activeFloor === 2) {
      currentRooms = COMBINED_F2_ROOMS; currentViewBox = COMBINED_F2_VIEWBOX; currentWallsPath = COMBINED_F2_WALLS; currentNodes = COMBINED_F2_NODES; currentEdges = COMBINED_F2_EDGES; currentStartPoints = COMBINED_F2_START_POINTS || []; currentLabels = COMBINED_F2_LABELS || []; currentRoofs = COMBINED_F2_ROOFS || []; currentRoads = ROAD_ZONES; 
    } else if (activeFloor === 3) {
      currentRooms = COMBINED_F3_ROOMS; currentViewBox = COMBINED_F3_VIEWBOX; currentWallsPath = COMBINED_F3_WALLS; currentNodes = COMBINED_F3_NODES; currentEdges = COMBINED_F3_EDGES; currentStartPoints = COMBINED_F3_START_POINTS || []; currentLabels = COMBINED_F3_LABELS || []; currentRoofs = COMBINED_F3_ROOFS || []; currentRoads = ROAD_ZONES; 
    }
  } else if (activeBuilding === 2) {
    if (activeFloor === 1) {
      currentRooms = WORKSHOP_F1_ROOMS; currentViewBox = WORKSHOP_F1_VIEWBOX; currentWallsPath = WORKSHOP_F1_WALLS; currentNodes = WORKSHOP_F1_NODES; currentEdges = WORKSHOP_F1_EDGES; currentStartPoints = WORKSHOP_F1_START_POINTS || []; currentLabels = WORKSHOP_F1_LABELS || []; currentRoofs = WORKSHOP_F1_ROOFS || []; currentRoads = []; 
    } else if (activeFloor === 2) {
      currentRooms = WORKSHOP_F2_ROOMS; currentViewBox = WORKSHOP_F2_VIEWBOX; currentWallsPath = WORKSHOP_F2_WALLS; currentNodes = WORKSHOP_F2_NODES; currentEdges = WORKSHOP_F2_EDGES; currentStartPoints = WORKSHOP_F2_START_POINTS || []; currentLabels = []; currentRoofs = []; currentRoads = []; 
    }
  } else if (activeBuilding === 3) {
    if (activeFloor === 1) {
      currentRooms = SPORTS_F1_ROOMS; currentViewBox = SPORTS_F1_VIEWBOX; currentWallsPath = SPORTS_F1_WALLS; currentNodes = SPORTS_F1_NODES; currentEdges = SPORTS_F1_EDGES; currentStartPoints = SPORTS_F1_START_POINTS || []; currentLabels = []; currentRoofs = []; currentRoads = []; 
    } else if (activeFloor === 2) {
      currentRooms = SPORTS_F2_ROOMS; currentViewBox = SPORTS_F2_VIEWBOX; currentWallsPath = SPORTS_F2_WALLS; currentNodes = SPORTS_F2_NODES; currentEdges = SPORTS_F2_EDGES; currentStartPoints = SPORTS_F2_START_POINTS || []; currentLabels = []; currentRoofs = []; currentRoads = []; 
    } else if (activeFloor === 3) {
      currentRooms = SPORTS_F3_ROOMS; currentViewBox = SPORTS_F3_VIEWBOX; currentWallsPath = SPORTS_F3_WALLS; currentNodes = SPORTS_F3_NODES; currentEdges = SPORTS_F3_EDGES; currentStartPoints = SPORTS_F3_START_POINTS || []; currentLabels = []; currentRoofs = []; currentRoads = []; 
    }
  }

  const ADMISSION_OVERRIDES: Record<string, { label: string; description: string }> = {
    '12':   { label: 'Приймальна\nкомісія\nдля Б/ФМБ',            description: 'Приймальна комісія для бакалаврів / фахових молодших бакалаврів' },
    'chit': { label: 'Приймальна\nкомісія\nдля\nкваліф. роб', description: 'Приймальна комісія для кваліфікованих робітників' },
  };
  const displayRooms = isAdmissionMode
    ? currentRooms.map(r =>
        ADMISSION_OVERRIDES[r.id]
          ? { ...r, label: ADMISSION_OVERRIDES[r.id].label, description: ADMISSION_OVERRIDES[r.id].description }
          : r
      )
    : currentRooms;

  let effectiveStartId = activeStartId;
  if (currentStartPoints && currentStartPoints.length > 0) {
    const isValidStart = currentStartPoints.some(sp => sp.id === effectiveStartId);
    if (!isValidStart) {
      const isValidNode = currentNodes.some(n => n.id === effectiveStartId);
      if (!isValidNode) {
        effectiveStartId = currentStartPoints[0].id;
      }
    }
  } else {
    effectiveStartId = 'none';
  }

  useEffect(() => {
    if (!targetRoomId || currentNodes.length === 0) {
      setRouteInfo(null); return;
    }

    const targetRoom = ALL_ROOMS.find(r => r.id === targetRoomId);
    if (!targetRoom) { setRouteInfo(null); return; }

    const effectiveTargetBuilding = targetRoom.building;

    let actualTargetId = targetRoomId;
    
    if (activeBuilding === 0) {
        if (targetRoom.building === 0) {
            actualTargetId = targetRoom.id;
        } else {
            actualTargetId = targetRoom.building === 1 ? 'entrance_b1' : 
                             targetRoom.building === 2 ? 'entrance_b2' : 
                             'entrance_b3';
        }
    } 
    else if (activeBuilding !== targetRoom.building) {
        if (activeFloor !== 1) {
             actualTargetId = activeBuilding === 1 ? `stairs_main_b${activeFloor}` : 
                              activeBuilding === 2 ? `stairs_workshop_f${activeFloor}` : 
                              `stairs_sports_f${activeFloor}`;
        } else {
             actualTargetId = activeBuilding === 1 ? 'entrance_b1' : 
                              activeBuilding === 2 ? 'entrance_b2' : 
                              'entrance_b3'; 
        }
    }
    else if (activeBuilding === targetRoom.building && activeFloor !== targetRoom.floor) {
        actualTargetId = targetRoom.targetStairs || (
            targetRoom.building === 1 ? `stairs_main_b${activeFloor}` : 
            targetRoom.building === 2 ? `stairs_workshop_f${activeFloor}` : 
            `stairs_sports_f${activeFloor}`
        );
    }

    let bestStartId = effectiveStartId;
    let guaranteedPath = findShortestPath(bestStartId, actualTargetId, currentNodes, currentEdges);

    if (guaranteedPath.length === 0 && currentStartPoints.length > 1 && bestStartId !== actualTargetId) {
      for (const sp of currentStartPoints) {
        if (sp.id === bestStartId) continue;
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
      let finalIsMultiBuilding = info.isMultiBuilding;
      let finalNextStartId = info.nextStartId;
      let finalIsMultiFloor = info.isMultiFloor; 

      if (activeBuilding === 0 && targetRoom.building !== 0) {
        finalIsMultiBuilding = true;
        finalNextBuilding = targetRoom.building;
        finalNextFloor = 1;
        finalInstruction = 'Увійдіть в корпус ➔';
        
        finalNextStartId = targetRoom.building === 1 ? 'entrance_b1' : 
                           targetRoom.building === 2 ? 'entrance_b2' : 
                           'entrance_b3';
      }
      else if (activeBuilding === 0 && targetRoom.building === 0) {
        finalIsMultiBuilding = false;
        finalIsMultiFloor = false;
      }
      else if (activeFloor === 1 && targetRoom.floor > 1 && activeBuilding === targetRoom.building) {
        finalInstruction = `Підніміться на ${targetRoom.floor} поверх ➔`;
        finalNextBuilding = targetRoom.building;
        finalNextFloor = targetRoom.floor;
      }

      setRouteInfo({ 
        ...info, 
        instruction: finalInstruction, 
        nextBuilding: finalNextBuilding, 
        nextFloor: finalNextFloor, 
        isMultiBuilding: finalIsMultiBuilding,
        isMultiFloor: finalIsMultiFloor,
        nextStartId: finalNextStartId,
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
    setRouteHistory(prev => [...prev, { building: activeBuilding, floor: activeFloor, startId: effectiveStartId }]);

    let nextStart = routeInfo.nextStartId;
    if (targetRoomId) {
      const targetRoom = ALL_ROOMS.find(r => r.id === targetRoomId);
      if (targetRoom && targetRoom.targetStairs && activeBuilding === targetRoom.building && routeInfo.isMultiFloor) {
          nextStart = targetRoom.targetStairs; 
      }
    }

    if (routeInfo.isMultiBuilding && routeInfo.nextBuilding !== null && routeInfo.nextBuilding !== undefined) {
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

  const handleResetRoute = async () => {
    if (initialRouteConfig) {
      setActiveBuilding(initialRouteConfig.building); setActiveFloor(initialRouteConfig.floor); setActiveStartId(initialRouteConfig.startId);
    } else {
      setActiveFloor(1); setActiveBuilding(1); setActiveStartId(globalSavedStartId); 
    }
    setTargetRoomId(null); setSearchQuery(''); setRouteInfo(null); setRouteHistory([]); setInitialRouteConfig(null); setPendingRoom(null);
    try {
      await AsyncStorage.removeItem('lastSelectedGroup');
      setLastScheduleGroup(null);
    } catch (e) {}
  };

  const handleGoToSchedule = async () => {
  await AsyncStorage.setItem('returnToSchedule', 'true');
  router.push('/schedule');
  };

  const showInstructionBar = targetRoomId !== null;

  return (
    <View style={styles.container}>
      
      <Text style={styles.mapTitle}>
        {activeBuilding === 0 ? 'Територія коледжу — ' : `${activeFloor} поверх — `}
        <Text style={{ fontWeight: 'bold' }}>
          {activeBuilding === 0 
            ? (pendingRoom ? `ціль: ${(pendingRoom.description || pendingRoom.label).replace('\n', ' ')}` : 'Оберіть корпус')
            : (targetRoomId 
                ? `ціль: ${(() => {
                    const r = ALL_ROOMS.find(r => r.id === targetRoomId);
                    const name = isAdmissionMode && ADMISSION_OVERRIDES[targetRoomId]
                      ? ADMISSION_OVERRIDES[targetRoomId].description
                      : (r?.description || r?.label || 'каб. ' + targetRoomId);
                    return name.replaceAll('\n', ' ');
                  })()}` 
                : 'Оберіть кабінет')}
        </Text>
      </Text>

      <View style={styles.topBar}>
        
        <View style={styles.searchWrapper}>
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

        <View style={styles.selectorsWrapper}>
          
          <View style={styles.tabSelector}>
            <TouchableOpacity 
              style={[styles.tabButton, activeBuilding === 1 && styles.tabButtonActive]} 
              onPress={() => setActiveBuilding(1)}
            >
              <Text style={[styles.tabButtonText, activeBuilding === 1 && styles.tabButtonTextActive]}>Корпуси 1/2</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeBuilding === 2 && styles.tabButtonActive]} 
              onPress={() => setActiveBuilding(2)}
            >
              <Text style={[styles.tabButtonText, activeBuilding === 2 && styles.tabButtonTextActive]}>Майстерні</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeBuilding === 3 && styles.tabButtonActive]} 
              onPress={() => setActiveBuilding(3)}
            >
              <Text style={[styles.tabButtonText, activeBuilding === 3 && styles.tabButtonTextActive]}>Спорткомплекс</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeBuilding === 0 && styles.tabButtonActive]} 
              onPress={() => { setActiveBuilding(0); setTargetRoomId(null); setPendingRoom(null); }}
            >
              <Text style={[styles.tabButtonText, activeBuilding === 0 && styles.tabButtonTextActive]}>Територія</Text>
            </TouchableOpacity>
          </View>

          {activeBuilding !== 0 && (
            <View style={styles.tabSelector}>
              {[1, 2, (activeBuilding === 1 || activeBuilding === 3) ? 3 : null].map((floor) => {
                if (floor === null) return null;
                return (
                  <TouchableOpacity 
                    key={`f-${floor}`}
                    style={[styles.tabButton, activeFloor === floor && styles.tabButtonActive]}
                    onPress={() => setActiveFloor(floor)}
                  >
                    <Text style={[styles.tabButtonText, activeFloor === floor && styles.tabButtonTextActive]}>
                      {floor} пов.
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </View>

      </View>

      <View style={styles.hotkeysPanel}>
        <Text style={styles.hotkeysTitle}>Швидкий пошук:</Text>
        
        {/* 🔥 Обгортаючий контейнер */}
        <View style={{ flex: 1, position: 'relative', justifyContent: 'center' }}>
          
          {/* 🔥 ЛІВА СТРІЛКА */}
          {showLeftArrow && (
            <TouchableOpacity style={styles.scrollArrowContainerLeft} onPress={handleScrollLeft}>
              <Text style={styles.scrollArrowText}>‹</Text>
            </TouchableOpacity>
          )}

          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.hotkeysScroll}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onLayout={(e) => { layoutWidth.current = e.nativeEvent.layout.width; checkArrowsVisibility(scrollX.current); }}
            onContentSizeChange={(w) => { contentWidth.current = w; checkArrowsVisibility(scrollX.current); }}
          >
            {isAdmissionMode && ADMISSION_QUICK_LINKS.map((link, idx) => (
              <TouchableOpacity
                key={`admission-${idx}`}
                style={[styles.hotkeyBtn, styles.hotkeyBtnAdmission]}
                onPress={() => handleQuickLink(link.roomId)}
              >
                <Text style={styles.hotkeyIcon}>{link.icon}</Text>
                <Text style={[styles.hotkeyText, styles.hotkeyTextAdmission]}>{link.label}</Text>
              </TouchableOpacity>
            ))}
            {QUICK_LINKS.map((link, idx) => (
              <TouchableOpacity 
                key={`quick-${idx}`} 
                style={styles.hotkeyBtn} 
                onPress={() => handleQuickLink(link.roomId)} 
              >
                {link.icon && <Text style={styles.hotkeyIcon}>{link.icon}</Text>}
                <Text style={styles.hotkeyText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 🔥 ПРАВА СТРІЛКА */}
          {showRightArrow && (
            <TouchableOpacity style={styles.scrollArrowContainerRight} onPress={handleScrollRight}>
              <Text style={styles.scrollArrowText}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.mapArea}>
        <MapCanvas 
          rooms={displayRooms}
          startPoints={currentStartPoints}
          activeStartId={effectiveStartId}
          viewBox={currentViewBox}
          wallsPath={currentWallsPath}
          targetRoomId={targetRoomId}
          routePath={generateRoutePathString()}
          onRoomSelect={handleRoomClick}
          onStartPointSelect={activeBuilding === 1 && activeFloor === 1 ? undefined : handleStartPointClick}
          staticLabels={currentLabels} 
          roofZones={currentRoofs} 
          roadZones={currentRoads}
          isTerritory={activeBuilding === 0}
        />
      </View>

      {showInstructionBar && (
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
            <>
              <TouchableOpacity style={[styles.instructionButton, styles.returnButton]} onPress={handleResetRoute}>
                <Text style={styles.instructionText}> Завершити маршрут</Text>
              </TouchableOpacity>
              {lastScheduleGroup && (
                <TouchableOpacity style={[styles.instructionButton, styles.scheduleButton]} onPress={handleGoToSchedule}>
                  <Text style={styles.instructionText}> {lastScheduleGroup.name}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: Colors.background, height: '100%' },
  mapTitle: { fontSize: 20, color: Colors.textMain, marginBottom: 12, fontWeight: '500' },
  
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    marginBottom: 12, 
    zIndex: 50, 
    elevation: 50, 
    width: '100%', 
    gap: 16, 
    flexWrap: 'wrap' 
  },
  
  searchWrapper: { 
    width: '100%', 
    maxWidth: 320, 
    zIndex: 50, 
    elevation: 50 
  },
  
  searchContainer: { flexDirection: 'row', backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textMain, outlineStyle: 'none' } as any,
  searchResults: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: Colors.white, borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', elevation: 5, overflow: 'hidden' },
  searchResultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchResultText: { fontSize: 16, fontWeight: 'bold', color: Colors.textMain, flexShrink: 1, marginRight: 10 }, 
  searchResultSubtext: { fontSize: 12, color: Colors.textSecondary },
  
  selectorsWrapper: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10 
  },
  
  tabSelector: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 3 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  tabButtonActive: { backgroundColor: Colors.white, boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', elevation: 2 },
  tabButtonText: { fontSize: 14, fontWeight: 'bold', color: Colors.textSecondary },
  tabButtonTextActive: { color: Colors.primary },
  
  hotkeysPanel: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '100%', zIndex: 1 },
  hotkeysTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.textSecondary, marginRight: 10, flexShrink: 0 },
  hotkeysScroll: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 25 }, 
  hotkeyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  hotkeyIcon: { fontSize: 14 },
  hotkeyText: { fontSize: 14, fontWeight: '600', color: Colors.textMain },
  
  scrollArrowContainerRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  scrollArrowContainerLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  scrollArrowText: {
    fontSize: 26,
    color: Colors.primary,
    fontWeight: 'bold',
    marginTop: -4,
  },

  mapArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 0, backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#E2E8F0', zIndex: 1, position: 'relative' },
  
  instructionContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 16, zIndex: 10 }, 
  instructionButton: { backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)', elevation: 8 }, 
  returnButton: { backgroundColor: '#475569' },
  instructionText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' }, 
  stepBackButton: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.primary, paddingVertical: 10 }, 
  stepBackText: { color: Colors.primary, fontSize: 16, fontWeight: 'bold' },
  scheduleButton: { backgroundColor: Colors.primary },
  hotkeyBtnAdmission: { borderColor: Colors.primary, backgroundColor: Colors.primaryGhost },
  hotkeyTextAdmission: { color: Colors.primary },
});