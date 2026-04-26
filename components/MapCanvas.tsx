import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, G } from 'react-native-svg';
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
      <Text style={styles.emptyText}>
        Мапа для цього поверху ще в розробці...
      </Text>
    );
  }

  return (
    <Svg width="100%" height="100%" viewBox={viewBox}>
      {/* Креслення стін */}
      {wallsPath !== "" && (
        <Path d={wallsPath} stroke="#9CA3AF" strokeWidth="6" fill="none" />
      )}

      {/* КАБІНЕТИ */}
      {rooms.map((room) => {
        const isActive = room.id === targetRoomId;
        return (
          <G key={room.id} onPress={() => onRoomSelect(room.id)}>
            <Rect 
              x={room.x} y={room.y} width={room.width} height={room.height} 
              fill={isActive ? Colors.primary : 'rgba(226, 232, 240, 0.5)'} 
              stroke={isActive ? Colors.primary : '#CBD5E1'} strokeWidth="4" rx="16" 
            />
            <SvgText 
              x={room.x + (room.width / 2)} y={room.y + (room.height / 2) + 20} 
              fill={isActive ? Colors.white : Colors.textMain} 
              fontSize={60} fontWeight="bold" textAnchor="middle"
            >
              {room.label}
            </SvgText>
          </G>
        );
      })}

      {/* МАРШРУТ */}
      {targetRoomId && routePath !== "" && (
        <Path 
          d={routePath} 
          stroke={Colors.primary} 
          strokeWidth="24" 
          strokeDasharray="40, 30" 
          fill="none" 
          strokeLinejoin="round"
        />
      )}

      {/* ТОЧКА ВИ ТУТ */}
      <G x={kioskPosition.x} y={kioskPosition.y}>
        <Circle cx="0" cy="0" r="80" fill={Colors.error} opacity="0.2" />
        <Circle cx="0" cy="0" r="30" fill={Colors.error} />
        <SvgText x="0" y="140" fill={Colors.error} fontSize="60" fontWeight="bold" textAnchor="middle">ВИ ТУТ</SvgText>
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  emptyText: { 
    fontSize: 24, 
    color: Colors.textSecondary 
  }
});