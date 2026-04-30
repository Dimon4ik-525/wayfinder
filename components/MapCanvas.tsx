import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../constants/theme';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

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

  const zoomRef = useRef<any>(null);
  const currentZoom = useRef<number>(1);
  
  // Додаємо стейт-ключ для ідеального скидання мапи
  const [resetKey, setResetKey] = useState(0);

  if (rooms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          Мапа для цього поверху ще в розробці...
        </Text>
      </View>
    );
  }

  const handleZoomIn = () => {
    zoomRef.current?.zoomBy(0.3);
    currentZoom.current = Math.min(currentZoom.current + 0.3, 4);
  };

  const handleZoomOut = () => {
    // Якщо масштаб близький до початкового (100%)
    if (currentZoom.current <= 1.35) {
      // Змінюємо key: React повністю перемалює компонент, 
      // скидаючи його позицію ІДЕАЛЬНО в центр, як "при запуску поверху"
      setResetKey(prev => prev + 1);
      currentZoom.current = 1;
    } else {
      zoomRef.current?.zoomBy(-0.3);
      currentZoom.current = Math.max(currentZoom.current - 0.3, 1);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ReactNativeZoomableView
        key={resetKey} // 👈 Оновлення цього ключа миттєво повертає мапу в початковий стан
        ref={zoomRef}
        maxZoom={4}
        minZoom={1} 
        zoomStep={0} // Вимкнено зум подвійним кліком
        initialZoom={1}
        bindToBorders={true}
        style={styles.zoomableView}
        // Слідкуємо за реальним зумом, якщо користувач зменшує пальцями/мишкою
        onZoomAfter={(event, gestureState, zoomEventObject) => {
          currentZoom.current = zoomEventObject.zoomLevel;
        }}
      >
        <Svg 
          width="100%" 
          height="100%" 
          viewBox={viewBox} 
          preserveAspectRatio="xMidYMid meet"
        >
          {wallsPath !== "" && (
            <Path d={wallsPath} stroke="#9CA3AF" strokeWidth="6" fill="none" />
          )}

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
                  fontSize={50} fontWeight="bold" textAnchor="middle"
                >
                  {room.label}
                </SvgText>
              </G>
            );
          })}

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

          <G x={kioskPosition.x} y={kioskPosition.y}>
            <Circle cx="0" cy="0" r="80" fill={Colors.error} opacity="0.2" />
            <Circle cx="0" cy="0" r="30" fill={Colors.error} />
            <SvgText x="0" y="140" fill={Colors.error} fontSize="60" fontWeight="bold" textAnchor="middle">ВИ ТУТ</SvgText>
          </G>
        </Svg>
      </ReactNativeZoomableView>

      {/* Лише дві кнопки, жодних зайвих елементів */}
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
  wrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  zoomableView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { 
    fontSize: 24, 
    color: Colors.textSecondary 
  },
  zoomControls: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    gap: 12,
    zIndex: 10,
  },
  zoomBtn: {
    width: 50,
    height: 50,
    backgroundColor: Colors.white,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  zoomBtnText: {
    fontSize: 32,
    color: Colors.textMain,
    fontWeight: '400',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  }
});