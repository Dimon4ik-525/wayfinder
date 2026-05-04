// utils/navigation.ts

export type MapNode = { id: string; x: number; y: number };
export type MapEdge = { from: string; to: string };

// --- ТВІЙ КЛАСИЧНИЙ АЛГОРИТМ (працює ідеально для одного графа) ---
export function findShortestPath(startId: string, endId: string, nodes: MapNode[], edges: MapEdge[]): MapNode[] {
  const graph: Record<string, { node: string; weight: number }[]> = {};
  nodes.forEach(n => graph[n.id] = []);

  const getDistance = (id1: string, id2: string) => {
    const n1 = nodes.find(n => n.id === id1);
    const n2 = nodes.find(n => n.id === id2);
    if (!n1 || !n2) return Infinity;
    return Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
  };

  edges.forEach(edge => {
    const dist = getDistance(edge.from, edge.to);
    if (graph[edge.from]) graph[edge.from].push({ node: edge.to, weight: dist });
    if (graph[edge.to]) graph[edge.to].push({ node: edge.from, weight: dist }); 
  });

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  nodes.forEach(n => {
    distances[n.id] = Infinity;
    previous[n.id] = null;
    unvisited.add(n.id);
  });
  distances[startId] = 0;

  while (unvisited.size > 0) {
    let current: string | null = null;
    let minDistance = Infinity;
    
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        current = nodeId;
      }
    });

    if (current === null || current === endId) break; 

    unvisited.delete(current);

    graph[current].forEach(neighbor => {
      if (unvisited.has(neighbor.node)) {
        const newDist = distances[current!] + neighbor.weight;
        if (newDist < distances[neighbor.node]) {
          distances[neighbor.node] = newDist;
          previous[neighbor.node] = current!;
        }
      }
    });
  }

  const path: MapNode[] = [];
  let curr: string | null = endId;
  if (previous[endId] !== undefined || startId === endId) {
    while (curr) {
      const nodeObj = nodes.find(n => n.id === curr);
      if (nodeObj) path.unshift(nodeObj);
      curr = previous[curr];
    }
  }

  return path.length > 1 ? path : []; 
}


// --- НОВА ЛОГІКА: ГЛОБАЛЬНИЙ МАРШРУТИЗАТОР (Корпуси + Поверхи) ---

export interface RouteStepInfo {
  pathNodes: MapNode[];     
  isMultiFloor: boolean;    
  isMultiBuilding: boolean; // ДОДАНО: Чи потрібен перехід в інший корпус?
  instruction: string;      
  nextFloor: number | null; 
  nextBuilding: number | null; // ДОДАНО: В який корпус ідемо
  nextStartId: string;      
}

export function buildGlobalRoute(
  currentBuilding: number, 
  targetBuilding: number, 
  currentFloor: number, 
  targetFloor: number, 
  startId: string, 
  targetId: string, 
  currentNodes: MapNode[], 
  currentEdges: MapEdge[]
): RouteStepInfo {
  
  const STAIRS_ID = 'stairs_main'; 

  // =====================================================================
  // СЦЕНАРІЙ 1: Нам потрібно в ІНШИЙ КОРПУС
  // =====================================================================
  if (currentBuilding !== targetBuilding) {
    
    // Крок 1.1: Якщо ми не на 1-му поверсі, спершу треба спуститись!
    if (currentFloor !== 1) {
      const pathToStairs = findShortestPath(startId, STAIRS_ID, currentNodes, currentEdges);
      return {
        pathNodes: pathToStairs,
        isMultiFloor: true,
        isMultiBuilding: false, // Корпус поки не міняємо, тільки спускаємось
        instruction: 'Спустіться на 1 поверх ➔',
        nextFloor: 1,
        nextBuilding: currentBuilding,
        nextStartId: STAIRS_ID
      };
    }

    // Крок 1.2: Ми на 1-му поверсі. Йдемо до виходу з корпусу!
    let TRANSIT_EXIT_ID = '';
    let TRANSIT_ENTER_ID = '';

    if (currentBuilding === 1 && targetBuilding === 2) {
      TRANSIT_EXIT_ID = 'start_corp2'; // Йдемо до цих дверей в 1 корпусі
      TRANSIT_ENTER_ID = 'start_corp1'; // З'явимось біля цих дверей у 2 корпусі
    } else if (currentBuilding === 2 && targetBuilding === 1) {
      TRANSIT_EXIT_ID = 'start_corp1'; // Йдемо до цих дверей в 2 корпусі
      TRANSIT_ENTER_ID = 'start_corp2'; // З'явимось біля цих дверей в 1 корпусі
    }

    const pathToTransit = findShortestPath(startId, TRANSIT_EXIT_ID, currentNodes, currentEdges);

    return {
      pathNodes: pathToTransit,
      isMultiFloor: false,
      isMultiBuilding: true,
      instruction: `Перейдіть у Корпус ${targetBuilding} ➔`,
      nextFloor: 1, // Заходимо завжди на 1 поверх
      nextBuilding: targetBuilding,
      nextStartId: TRANSIT_ENTER_ID // Починаємо маршрут від вхідних дверей нового корпусу!
    };
  }

  // =====================================================================
  // СЦЕНАРІЙ 2: Ми у потрібному корпусі, але на ІНШОМУ ПОВЕРСІ
  // =====================================================================
  if (currentFloor !== targetFloor) {
    const pathToStairs = findShortestPath(startId, STAIRS_ID, currentNodes, currentEdges);
    const actionWord = targetFloor > currentFloor ? 'Підніміться' : 'Спустіться';

    return {
      pathNodes: pathToStairs,
      isMultiFloor: true,
      isMultiBuilding: false,
      instruction: `${actionWord} на ${targetFloor} поверх ➔`,
      nextFloor: targetFloor,
      nextBuilding: currentBuilding,
      nextStartId: STAIRS_ID
    };
  }

  // =====================================================================
  // СЦЕНАРІЙ 3: Ми на потрібному поверсі у потрібному корпусі! (Фініш)
  // =====================================================================
  const path = findShortestPath(startId, targetId, currentNodes, currentEdges);
  return {
    pathNodes: path,
    isMultiFloor: false,
    isMultiBuilding: false,
    instruction: 'Ви на місці!',
    nextFloor: null,
    nextBuilding: null,
    nextStartId: targetId
  };
}