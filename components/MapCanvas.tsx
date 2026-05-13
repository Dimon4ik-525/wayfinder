import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, TSpan, G } from 'react-native-svg';
import { Colors } from '../constants/theme';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

interface MapCanvasProps {
  rooms: any[];
  kioskPosition: { x: number; y: number };
  viewBox: string;
  wallsPath: string;
  targetRoomId: string | null;
  routePath: string;
  onRoomSelect: (roomId: string | null) => void;
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
          {wallsPath !== "" && (
            <Path d={wallsPath} stroke="#9CA3AF" strokeWidth="6" fill="none" />
          )}

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
                
                {/* 🔥 ОНОВЛЕНО: Додано логіку повороту тексту */}
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

          <G x={kioskPosition.x} y={kioskPosition.y}>
            <Circle cx="0" cy="0" r="80" fill={Colors.error} opacity="0.2" />
            <Circle cx="0" cy="0" r="30" fill={Colors.error} />
            <SvgText x="0" y="140" fill={Colors.error} fontSize="60" fontWeight="bold" textAnchor="middle">ВИ ТУТ</SvgText>
          </G>
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