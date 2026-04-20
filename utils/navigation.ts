// utils/navigation.ts

export type MapNode = { id: string; x: number; y: number };
export type MapEdge = { from: string; to: string };

export function findShortestPath(startId: string, endId: string, nodes: MapNode[], edges: MapEdge[]): MapNode[] {
  // 1. Створюємо структуру графа з відстанями (вагою ребер)
  const graph: Record<string, { node: string; weight: number }[]> = {};
  nodes.forEach(n => graph[n.id] = []);

  // Функція для розрахунку фізичної відстані між двома точками на мапі (Теорема Піфагора)
  const getDistance = (id1: string, id2: string) => {
    const n1 = nodes.find(n => n.id === id1);
    const n2 = nodes.find(n => n.id === id2);
    if (!n1 || !n2) return Infinity;
    return Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
  };

  // Заповнюємо граф (він двонаправлений, тобто коридором можна йти туди і назад)
  edges.forEach(edge => {
    const dist = getDistance(edge.from, edge.to);
    if (graph[edge.from]) graph[edge.from].push({ node: edge.to, weight: dist });
    if (graph[edge.to]) graph[edge.to].push({ node: edge.from, weight: dist }); 
  });

  // 2. Класичний алгоритм Дейкстри
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
    
    // Шукаємо найближчий невідвіданий вузол
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        current = nodeId;
      }
    });

    // Якщо дійшли до цілі або застрягли — зупиняємось
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

  // 3. Відновлюємо шлях від кінця до початку
  const path: MapNode[] = [];
  let curr: string | null = endId;
  if (previous[endId] !== undefined || startId === endId) {
    while (curr) {
      const nodeObj = nodes.find(n => n.id === curr);
      if (nodeObj) path.unshift(nodeObj);
      curr = previous[curr];
    }
  }

  return path.length > 1 ? path : []; // Повертаємо масив точок маршруту
}