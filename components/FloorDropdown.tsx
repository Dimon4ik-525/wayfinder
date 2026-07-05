import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface Props {
  activeFloor: number;
  availableFloors: number[];
  onSelect: (floor: number) => void;
}

export default function FloorDropdown({ activeFloor, availableFloors, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.headerText}>{activeFloor} пов.</Text>
        <Text style={styles.icon}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.list}>
          {availableFloors.map((floor) => (
            <TouchableOpacity 
              key={floor}
              style={[styles.item, activeFloor === floor && styles.itemActive]}
              onPress={() => {
                onSelect(floor);
                setIsOpen(false);
              }}
            >
              <Text style={[styles.itemText, activeFloor === floor && styles.itemTextActive]}>
                {floor} пов.
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', zIndex: 100 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0'
  },
  headerText: { fontSize: 16, fontWeight: 'bold', color: Colors.textMain },
  icon: { fontSize: 14, color: Colors.textSecondary },
  list: {
    position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: Colors.white,
    borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: '#E2E8F0', elevation: 10, zIndex: 100
  },
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemActive: { backgroundColor: '#F8FAFC' },
  itemText: { fontSize: 16, color: Colors.textMain, textAlign: 'center' },
  itemTextActive: { color: Colors.primary, fontWeight: 'bold' },
});