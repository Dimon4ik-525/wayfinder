import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, TSpan, G, Defs, Pattern, Line, Polygon } from 'react-native-svg';
import { Colors } from '../constants/theme';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

export interface MapCanvasProps {
  rooms: any[];
  startPoints?: { id: string; label?: string; x: number; y: number }[];
  activeStartId?: string;
  viewBox: string;
  wallsPath: string;
  targetRoomId: string | null;
  routePath: string;
  onRoomSelect: (roomId: string | null) => void;
  staticLabels?: { id: string, text: string, x: number, y: number, fontSize?: number, color?: string }[];
  roofZones?: any[];
  roadZones?: string[];
  onStartPointSelect?: (startId: string) => void;
  isTerritory?: boolean;
}

export default function MapCanvas({ 
  rooms, 
  startPoints = [], 
  activeStartId,
  viewBox, 
  wallsPath, 
  targetRoomId, 
  routePath, 
  onRoomSelect,
  staticLabels,
  roofZones = [],
  roadZones = [],
  onStartPointSelect,
  isTerritory = false,
}: MapCanvasProps) {

  const zoomRef = useRef<any>(null);
  const currentZoom = useRef<number>(1);
  const [resetKey, setResetKey] = useState(0);

  if (rooms.length === 0 && !wallsPath && roofZones.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Мапа для цього об'єкта ще в розробці...</Text>
      </View>
    );
  }

  const handleZoomIn = () => {
    zoomRef.current?.zoomBy(0.3);
    currentZoom.current = Math.min(currentZoom.current + 0.3, 4);
  };

  const handleZoomOut = () => {
    if (currentZoom.current <= 1.35) {
      setResetKey(prev => prev + 1);
      currentZoom.current = 1;
    } else {
      zoomRef.current?.zoomBy(-0.3);
      currentZoom.current = Math.max(currentZoom.current - 0.3, 1);
    }
  };

  const handleRoomPress = (roomId: string) => {
    if (targetRoomId === roomId) {
      onRoomSelect(null);
    } else {
      onRoomSelect(roomId);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ReactNativeZoomableView
        key={resetKey}
        ref={zoomRef}
        maxZoom={4}
        minZoom={1} 
        zoomStep={0.5} // Додали крок
        initialZoom={1}
        bindToBorders={true}
        // 🔥 Ці пропси допомагають уникнути "мильної" растрової трансформації SVG
        disablePanOnInitialZoom={true}
        visualTouchFeedbackEnabled={false}
        style={styles.zoomableView}
        onZoomAfter={(event, gestureState, zoomEventObject) => {
          currentZoom.current = zoomEventObject.zoomLevel;
        }}
      >
        <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
          
          <Defs>
            <Pattern id="diagonalHatch" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <Line x1="0" y1="0" x2="0" y2="40" stroke="#E2E8F0" strokeWidth="4" />
            </Pattern>

            <Pattern id="roadHatch" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <Line x1="0" y1="0" x2="0" y2="40" stroke="#CBD5E1" strokeWidth="6" />
            </Pattern>
          </Defs>

          {/* ДОРОГИ */}
          {roadZones.map((roadPoints, index) => (
            <Polygon 
              key={`road-${index}`} 
              points={roadPoints} 
              fill="url(#roadHatch)" 
              stroke="#94A3B8" 
              strokeWidth="4" 
              pointerEvents="none"
            />
          ))}

          {/* ДАХИ */}
          {roofZones.map((roof) => {
            let textX = roof.textX !== undefined ? roof.textX : roof.x + (roof.width || 0) / 2;
            let textY = roof.textY !== undefined ? roof.textY : roof.y + (roof.height || 0) / 2;

            if (roof.points && roof.textX === undefined && roof.textY === undefined) {
              const pairs = roof.points.trim().split(/\s+/);
              let sumX = 0, sumY = 0, count = 0;
              pairs.forEach((pair: string) => { 
                const [strX, strY] = pair.split(',');
                const numX = parseFloat(strX);
                const numY = parseFloat(strY);
                if (!isNaN(numX) && !isNaN(numY)) { sumX += numX; sumY += numY; count++; }
              });
              if (count > 0) { textX = sumX / count; textY = sumY / count; }
            }

            const lines = (roof.label || '').split('\n');
            const fontSize = 55;
            const lineHeight = fontSize * 1.3;
            const startY = textY - ((lines.length - 1) * lineHeight / 2) + (fontSize / 3);

            return (
              <G key={roof.id}>
                {roof.points ? (
                  <Polygon points={roof.points} fill="url(#diagonalHatch)" stroke="#CBD5E1" strokeWidth="4" strokeDasharray="15, 10" pointerEvents="none" />
                ) : (
                  <Rect x={roof.x} y={roof.y} width={roof.width || 0} height={roof.height || 0} fill="url(#diagonalHatch)" stroke="#CBD5E1" strokeWidth="4" strokeDasharray="15, 10" rx="8" pointerEvents="none" />
                )}
                <SvgText x={textX} y={startY} fill="#475569" fontSize={fontSize} fontWeight="bold" textAnchor="middle" pointerEvents="none">
                  {lines.map((line: string, index: number) => (
                    <TSpan key={index} x={textX} dy={index === 0 ? 0 : lineHeight}>
                      {line}
                    </TSpan>
                  ))}
                </SvgText>
              </G>
            );
          })}

          {wallsPath !== "" && (
            <Path d={wallsPath} stroke="#9CA3AF" strokeWidth="6" fill="none" />
          )}

          {/* КІМНАТИ ТА БУДІВЛІ */}
          {rooms.map((room) => {
            const isActive = room.id === targetRoomId;
            
            let textX = room.textX !== undefined ? room.textX : room.x + (room.width || 0) / 2;
            let textY = room.textY !== undefined ? room.textY : room.y + (room.height || 0) / 2;

            if (room.points && room.textX === undefined && room.textY === undefined) {
              const pairs = room.points.trim().split(/\s+/);
              let sumX = 0, sumY = 0, count = 0;
              pairs.forEach((pair: string) => { 
                const [strX, strY] = pair.split(',');
                const numX = parseFloat(strX);
                const numY = parseFloat(strY);
                if (!isNaN(numX) && !isNaN(numY)) { sumX += numX; sumY += numY; count++; }
              });
              if (count > 0) { textX = sumX / count; textY = sumY / count; }
            }

            const lines = (room.label || '').split('\n');
            const customFontSize = room.fontSize || 50; 
            const lineHeight = customFontSize * 1.3;
            const startY = textY - ((lines.length - 1) * lineHeight / 2) + (customFontSize / 3);

            return (
              <G key={room.id} onPress={() => handleRoomPress(room.id)}>
                {room.points ? (
                  <Polygon 
                    points={room.points}
                    fill={isActive ? Colors.primary : 'rgba(226, 232, 240, 0.5)'} 
                    stroke={isActive ? Colors.primary : '#CBD5E1'} strokeWidth="4" 
                  />
                ) : (
                  <Rect 
                    x={room.x} y={room.y} width={room.width} height={room.height} 
                    fill={isActive ? Colors.primary : 'rgba(226, 232, 240, 0.5)'} 
                    stroke={isActive ? Colors.primary : '#CBD5E1'} strokeWidth="4" rx="16" 
                  />
                )}
                
                <SvgText 
                  x={textX} y={startY} 
                  fill={isActive ? Colors.white : Colors.textMain} 
                  fontSize={customFontSize} fontWeight="bold" textAnchor="middle"
                  rotation={room.rotateText ? -90 : 0}
                  originX={textX}
                  originY={textY}
                >
                  {lines.map((line: string, index: number) => (
                    <TSpan key={index} x={textX} dy={index === 0 ? 0 : lineHeight}>
                      {line}
                    </TSpan>
                  ))}
                </SvgText>
              </G>
            );
          })}

          {/* СТАТИЧНІ ЛЕЙБЛИ */}
          {staticLabels && staticLabels.map((label) => {
            const lines = (label.text || '').split('\n');
            const fontSize = label.fontSize || 60;
            const lineHeight = fontSize * 1.3;
            const startY = label.y - ((lines.length - 1) * lineHeight / 2) + (fontSize / 3);

            return (
              <SvgText key={label.id} x={label.x} y={startY} fill={label.color || '#9CA3AF'} fontSize={fontSize} fontWeight="bold" textAnchor="middle" pointerEvents="none">
                {lines.map((line: string, index: number) => (
                  <TSpan key={index} x={label.x} dy={index === 0 ? 0 : lineHeight}>
                    {line}
                  </TSpan>
                ))}
              </SvgText>
            );
          })}

          {targetRoomId && routePath !== "" && (
            <Path d={routePath} stroke={Colors.primary} strokeWidth="24" strokeDasharray="40, 30" fill="none" strokeLinejoin="round" />
          )}

          {/* СТАРТОВІ ТОЧКИ */}
          {startPoints.map((sp) => {
            const isActive = sp.id === activeStartId;
            const fillColor = isActive ? Colors.error : Colors.primary;

            let inactiveText = sp.label || 'СХОДИ';
            if (!sp.label && sp.id === 'start_main') inactiveText = 'ВХІД №1';
            if (!sp.label && sp.id === 'start_entrance') inactiveText = 'ВХІД №2';

            const hitboxRadius = isTerritory ? "300" : "120";
            const haloRadius = isTerritory ? "200" : "80";
            const coreRadius = isTerritory ? "80" : "30";
            const textY = isTerritory ? "280" : "100";
            const textSize = isTerritory ? 180 : 42;

            return (
              <G
                key={`start-${sp.id}`}
                x={sp.x}
                y={sp.y}
                onPress={() => !isActive && onStartPointSelect?.(sp.id)}
              >
                <Circle cx="0" cy="0" r={hitboxRadius} fill={fillColor} opacity={0} />
                <Circle cx="0" cy="0" r={haloRadius} fill={fillColor} opacity={isActive ? 0.2 : 0.1} />
                <Circle cx="0" cy="0" r={coreRadius} fill={fillColor} />
                <SvgText x="0" y={textY} fill={fillColor} fontSize={textSize} fontWeight="bold" textAnchor="middle">
                  {isActive ? 'ВИ ТУТ' : inactiveText}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ReactNativeZoomableView>

      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn} activeOpacity={0.7}>
          <Text style={[styles.zoomBtnText, { marginTop: -2 }]}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut} activeOpacity={0.7}>
          <Text style={[styles.zoomBtnText, { marginTop: -4 }]}>−</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, width: '100%', height: '100%', overflow: 'hidden', position: 'relative' },
  zoomableView: { flex: 1, width: '100%', height: '100%' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 24, color: Colors.textSecondary },
  zoomControls: { position: 'absolute', bottom: 30, right: 30, gap: 12, zIndex: 10 },
  zoomBtn: { width: 50, height: 50, backgroundColor: Colors.white, borderRadius: 25, justifyContent: 'center', alignItems: 'center', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)', elevation: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  zoomBtnText: { fontSize: 32, color: Colors.textMain, fontWeight: '400', textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false }
});