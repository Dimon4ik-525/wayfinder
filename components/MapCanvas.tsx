import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, TSpan, G, Defs, Pattern, Line, Polygon } from 'react-native-svg';
import { Colors } from '../constants/theme';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

export interface MapCanvasProps {
  rooms: any[];
  startPoints?: { id: string; label?: string; x: number; y: number }[]; // Масив усіх стартових точок (сходів/входів)
  activeStartId?: string; // ID активної точки (щоб зробити її червоною "ВИ ТУТ")
  viewBox: string;
  wallsPath: string;
  targetRoomId: string | null;
  routePath: string;
  onRoomSelect: (roomId: string | null) => void;
  staticLabels?: { id: string, text: string, x: number, y: number, fontSize?: number, color?: string }[];
  // 🔥 Гнучка підтримка прямокутників та складних багатокутників
  roofZones?: { id: string, label: string, x: number, y: number, width?: number, height?: number, points?: string }[];
  // 🔥 Новий пропс для доріг
  roadZones?: string[];
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
  roadZones = [] // 👈 Дефолтне значення, щоб не було помилок
}: MapCanvasProps) {

  const zoomRef = useRef<any>(null);
  const currentZoom = useRef<number>(1);
  const [resetKey, setResetKey] = useState(0);

  if (rooms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Мапа для цього поверху ще в розробці...</Text>
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
        zoomStep={0}
        initialZoom={1}
        bindToBorders={true}
        style={styles.zoomableView}
        onZoomAfter={(event, gestureState, zoomEventObject) => {
          currentZoom.current = zoomEventObject.zoomLevel;
        }}
      >
        <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
          
          <Defs>
            {/* 🔥 ШАБЛОН ДІАГОНАЛЬНОЇ ШТРИХОВКИ ДЛЯ ДАХІВ */}
            <Pattern id="diagonalHatch" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <Line x1="0" y1="0" x2="0" y2="40" stroke="#E2E8F0" strokeWidth="4" />
            </Pattern>

            {/* 🔥 НОВИЙ ПАТЕРН ДЛЯ ДОРІГ */}
            <Pattern id="roadHatch" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <Line x1="0" y1="0" x2="0" y2="40" stroke="#CBD5E1" strokeWidth="6" />
            </Pattern>
          </Defs>

          {/* 🔥 РЕНДЕР ДОРІГ (Малюється під будівлею) */}
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

          {/* 🔥 РОЗУМНИЙ РЕНДЕРИНГ ЗОН ДАХУ З АВТО-ВИРІВНЮВАННЯМ ЦЕНТРУ */}
          {roofZones.map((roof) => {
            let textX = roof.x;
            let textY = roof.y;

            // 🧮 АВТОМАТИЧНИЙ РОЗРАХУНОК ЦЕНТРОЇДА ДЛЯ СКЛАДНИХ ПОЛІГОНІВ
            if (roof.points) {
              const pairs = roof.points.trim().split(/\s+/);
              let sumX = 0;
              let sumY = 0;
              let count = 0;

              pairs.forEach(pair => {
                const [strX, strY] = pair.split(',');
                const numX = parseFloat(strX);
                const numY = parseFloat(strY);
                
                if (!isNaN(numX) && !isNaN(numY)) {
                  sumX += numX;
                  sumY += numY;
                  count++;
                }
              });

              if (count > 0) {
                textX = sumX / count; // Обчислюємо середній геометричний X
                textY = sumY / count; // Обчислюємо середній геометричний Y
              }
            } else {
              // 📐 Класичний центр для звичайних прямокутників
              textX = roof.x + (roof.width || 0) / 2;
              textY = roof.y + (roof.height || 0) / 2;
            }

            return (
              <G key={roof.id}>
                {roof.points ? (
                  /* 🔷 Рендеринг шестикутника або іншої складної форми */
                  <Polygon
                    points={roof.points}
                    fill="url(#diagonalHatch)"
                    stroke="#CBD5E1"
                    strokeWidth="4"
                    strokeDasharray="15, 10"
                    pointerEvents="none"
                  />
                ) : (
                  /* ⬜️ Рендеринг класичного прямокутника */
                  <Rect 
                    x={roof.x} 
                    y={roof.y} 
                    width={roof.width || 0} 
                    height={roof.height || 0} 
                    fill="url(#diagonalHatch)" 
                    stroke="#CBD5E1" 
                    strokeWidth="4" 
                    strokeDasharray="15, 10"
                    rx="8"
                    pointerEvents="none"
                  />
                )}

                {/* 🔥 АВТОМАТИЧНИЙ НАДПИС: Стає строго в розрахований геометричний центр */}
                <SvgText 
                  x={textX} 
                  y={textY} 
                  fill="#475569" // Чіткий Slate колір, що добре читається поверх ліній штриховки
                  fontSize={55}   
                  fontWeight="bold" 
                  textAnchor="middle"
                  alignmentBaseline="central" 
                  pointerEvents="none"
                >
                  {roof.label}
                </SvgText>
              </G>
            );
          })}

          {wallsPath !== "" && (
            <Path d={wallsPath} stroke="#9CA3AF" strokeWidth="6" fill="none" />
          )}

          {staticLabels && staticLabels.map((label) => (
            <SvgText
              key={label.id}
              x={label.x}
              y={label.y}
              fill={label.color || '#9CA3AF'}
              fontSize={label.fontSize || 60}
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
              pointerEvents="none"
            >
              {label.text}
            </SvgText>
          ))}

          {rooms.map((room) => {
            const isActive = room.id === targetRoomId;
            const lines = (room.label || '').split('\n');
            const lineHeight = 60;
            const startY = room.y + (room.height / 2) - ((lines.length - 1) * lineHeight / 2) + 20;

            return (
              <G key={room.id} onPress={() => handleRoomPress(room.id)}>
                <Rect 
                  x={room.x} y={room.y} width={room.width} height={room.height} 
                  fill={isActive ? Colors.primary : 'rgba(226, 232, 240, 0.5)'} 
                  stroke={isActive ? Colors.primary : '#CBD5E1'} strokeWidth="4" rx="16" 
                />
                
                <SvgText 
                  x={room.x + (room.width / 2)} y={startY} 
                  fill={isActive ? Colors.white : Colors.textMain} 
                  fontSize={45} fontWeight="bold" textAnchor="middle"
                  rotation={room.rotateText ? -90 : 0}
                  originX={room.x + (room.width / 2)}
                  originY={room.y + (room.height / 2)}
                >
                  {lines.map((line: string, index: number) => (
                    <TSpan key={index} x={room.x + (room.width / 2)} dy={index === 0 ? 0 : lineHeight}>
                      {line}
                    </TSpan>
                  ))}
                </SvgText>
              </G>
            );
          })}

          {targetRoomId && routePath !== "" && (
            <Path d={routePath} stroke={Colors.primary} strokeWidth="24" strokeDasharray="40, 30" fill="none" strokeLinejoin="round" />
          )}

          {/* ЛОГІКА ВІДОБРАЖЕННЯ ТОЧОК — ТЕПЕР ТІЛЬКИ ЧИСТІ START_POINTS */}
          {startPoints.map((sp) => {
            const isActive = sp.id === activeStartId;
            const fillColor = isActive ? Colors.error : Colors.primary;

            let inactiveText = sp.label || 'СХОДИ';
            if (!sp.label && sp.id === 'start_main') inactiveText = 'ВХІД №1';
            if (!sp.label && sp.id === 'start_entrance') inactiveText = 'ВХІД №2';

            return (
              <G key={`start-${sp.id}`} x={sp.x} y={sp.y}>
                <Circle cx="0" cy="0" r="80" fill={fillColor} opacity="0.2" />
                <Circle cx="0" cy="0" r="30" fill={fillColor} />
                <SvgText x="0" y="100" fill={fillColor} fontSize={42} fontWeight="bold" textAnchor="middle">
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