// utils/navigation.ts

export type MapNode = { id: string; x: number; y: number };
export type MapEdge = { from: string; to: string };

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

export interface RouteStepInfo {
  pathNodes: MapNode[];     
  isMultiFloor: boolean;    
  isMultiBuilding: boolean; 
  instruction: string;      
  nextFloor: number | null; 
  nextBuilding: number | null; 
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
): RouteStepInfo | null {
  
  // =====================================================================
  // СЦЕНАРІЙ 0: Користувач знаходиться на території (ВУЛИЦЯ)
  // =====================================================================
  if (currentBuilding === 0) {
      if (targetBuilding === 1) { 
          const path = findShortestPath(startId, 'entrance_b1', currentNodes, currentEdges);
          return {
              instruction: `Прямуйте до Головного корпусу ➔`,
              nextBuilding: 1, nextFloor: 1, 
              nextStartId: 'start_entrance', // З'являємось на Вході 2
              isMultiFloor: false, isMultiBuilding: true,
              pathNodes: path
          };
      }
      if (targetBuilding === 2) { 
          const path = findShortestPath(startId, 'entrance_b2', currentNodes, currentEdges);
          return {
              instruction: `Прямуйте до Майстерень ➔`,
              nextBuilding: 2, nextFloor: 1, 
              nextStartId: 'entrance_b2', // З'являємось в Майстернях
              isMultiFloor: false, isMultiBuilding: true,
              pathNodes: path.length > 0 ? path : [{ id: startId, x: currentNodes.find(n=>n.id===startId)?.x||0, y: currentNodes.find(n=>n.id===startId)?.y||0 }]
          };
      }
  }

  // =====================================================================
  // СЦЕНАРІЙ 1: Нам потрібно в ІНШИЙ КОРПУС
  // =====================================================================
  if (currentBuilding !== targetBuilding && currentBuilding !== 0) {
    
    // Крок 1.1: Якщо ми не на 1-му поверсі, спершу треба спуститись!
    if (currentFloor !== 1) {
      let stairsId = currentBuilding === 1 ? 'stairs_main_b1' : 'stairs_workshop_f2';
      const pathToStairs = findShortestPath(startId, stairsId, currentNodes, currentEdges);
      return {
        pathNodes: pathToStairs,
        isMultiFloor: true,
        isMultiBuilding: false,
        instruction: 'Спустіться на 1 поверх ➔',
        nextFloor: 1,
        nextBuilding: currentBuilding,
        nextStartId: stairsId
      };
    }

    // Крок 1.2: Ми на 1-му поверсі. Йдемо до виходу з корпусу!
    // 🔥 Якщо ми в Корпусі 1, ведемо до Входу 2 (start_entrance). Якщо в Майстернях — до entrance_b2
    let exitId = currentBuilding === 1 ? 'start_entrance' : 'entrance_b2';
    let streetStartId = currentBuilding === 1 ? 'entrance_b1' : 'entrance_b2'; 

    const pathToExit = findShortestPath(startId, exitId, currentNodes, currentEdges);

    return {
      pathNodes: pathToExit,
      isMultiFloor: false,
      isMultiBuilding: true,
      instruction: `Вийдіть на вулицю ➔`,
      nextFloor: 1, 
      nextBuilding: 0, // Перемикаємо на ТЕРИТОРІЮ (0)
      nextStartId: streetStartId 
    };
  }

  // =====================================================================
  // СЦЕНАРІЙ 2: Ми у потрібному корпусі, але на ІНШОМУ ПОВЕРСІ
  // =====================================================================
  if (currentFloor !== targetFloor) {
    let stairsId = '';
    let pathToStairs: MapNode[] = [];

    if (currentBuilding === 1) {
      // 1. Будуємо шляхи до ОБОХ сходів
      const path1 = findShortestPath(startId, 'stairs_main_b1', currentNodes, currentEdges);
      const path2 = findShortestPath(startId, 'stairs_main_b2', currentNodes, currentEdges);
      
      // 2. Визначаємо довжину кожного шляху (якщо шляху немає, ставимо Безкінечність)
      const len1 = path1.length > 0 ? path1.length : Infinity;
      const len2 = path2.length > 0 ? path2.length : Infinity;

      // 3. Порівнюємо і вибираємо КОРОТШИЙ
      if (len1 <= len2 && len1 !== Infinity) {
        pathToStairs = path1;
        stairsId = 'stairs_main_b1';
      } else if (len2 !== Infinity) {
        pathToStairs = path2;
        stairsId = 'stairs_main_b2';
      } else {
        // Запобіжник: якщо раптом немає шляху до жодних, дефолтно ставимо перші
        stairsId = 'stairs_main_b1'; 
      }
    } else {
      // Для майстерень залишаємо одні сходи
      stairsId = 'stairs_workshop_f1'; 
      pathToStairs = findShortestPath(startId, stairsId, currentNodes, currentEdges);
    }

    const actionWord = targetFloor > currentFloor ? 'Підніміться' : 'Спустіться';

    return {
      pathNodes: pathToStairs,
      isMultiFloor: true,
      isMultiBuilding: false,
      instruction: `${actionWord} на ${targetFloor} поверх ➔`,
      nextFloor: targetFloor,
      nextBuilding: currentBuilding,
      nextStartId: stairsId
    };
  }

  // =====================================================================
  // СЦЕНАРІЙ 3: Ми на потрібному поверсі у потрібному корпусі! (Фініш)
  // =====================================================================
  const path = findShortestPath(startId, targetId, currentNodes, currentEdges);
  if (path.length > 0) {
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

  return null;
}