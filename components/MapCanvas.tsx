import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, TSpan, G } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface MapCanvasProps {
  rooms: any[];
  kioskPosition: { x: number; y: number };
  viewBox: string;
  wallsPath: string;
  targetRoomId: string | null;
  routePath: string;
  onRoomSelect: (roomId: string) => void;
}

export default function MapCanvas({ 
  rooms, 
  kioskPosition, 
  viewBox, 
  wallsPath, 
  targetRoomId, 
  routePath, 
  onRoomSelect 
}: MapCanvasProps) {

  if (rooms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Мапа для цього поверху ще в розробці...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Для 3D-ізометрії ми прибрали індивідуальний зум, 
          бо всі 3 поверхи мають залишатися жорстко зафіксованими один над одним */}
      <Svg 
        width="100%" 
        height="100%" 
        viewBox={viewBox} 
        preserveAspectRatio="xMidYMid meet"
        style={{ backgroundColor: 'transparent' }} // Обов'язково прозорий фон!
      >
        {wallsPath !== "" && (
          <Path d={wallsPath} stroke="#9CA3AF" strokeWidth="6" fill="none" />
        )}

        {rooms.map((room) => {
          const isActive = room.id === targetRoomId;
          const lines = (room.label || '').split('\n');
          const lineHeight = 60;
          const startY = room.y + (room.height / 2) - ((lines.length - 1) * lineHeight / 2) + 20;

          return (
            <G key={room.id} onPress={() => onRoomSelect(room.id)}>
              <Rect 
                x={room.x} y={room.y} width={room.width} height={room.height} 
                fill={isActive ? Colors.primary : 'rgba(226, 232, 240, 0.8)'} // Зробили фон кімнат трохи щільнішим
                stroke={isActive ? Colors.primary : '#CBD5E1'} strokeWidth="4" rx="16" 
              />
              
              <SvgText 
                x={room.x + (room.width / 2)} y={startY} 
                fill={isActive ? Colors.white : Colors.textMain} 
                fontSize={45} fontWeight="bold" textAnchor="middle"
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

        {/* Малюємо маркер ВИ ТУТ тільки якщо є реальні координати (щоб не малювало в кутку 0,0) */}
        {kioskPosition.x !== 0 && kioskPosition.y !== 0 && (
          <G x={kioskPosition.x} y={kioskPosition.y}>
            <Circle cx="0" cy="0" r="80" fill={Colors.error} opacity="0.2" />
            <Circle cx="0" cy="0" r="30" fill={Colors.error} />
            <SvgText x="0" y="140" fill={Colors.error} fontSize="60" fontWeight="bold" textAnchor="middle">ВИ ТУТ</SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, width: '100%', height: '100%', overflow: 'hidden', position: 'relative' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 24, color: Colors.textSecondary },
});