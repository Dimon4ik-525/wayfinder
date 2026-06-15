import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface Props {
  activeBuilding: number;
  onSelect: (building: number) => void;
}

export default function BuildingDropdown({ activeBuilding, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  
  const buildingNames: Record<number, string> = {
    1: 'Корпуси 1/2',
    2: 'Майстерні',
    3: 'Спорткомплекс',
    0: 'Територія'
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.headerText}>{buildingNames[activeBuilding]}</Text>
        <Text style={styles.icon}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.list}>
          {[1, 2, 3, 0].map((bld) => (
            <TouchableOpacity 
              key={bld}
              style={[styles.item, activeBuilding === bld && styles.itemActive]}
              onPress={() => {
                onSelect(bld);
                setIsOpen(false);
              }}
            >
              <Text style={[styles.itemText, activeBuilding === bld && styles.itemTextActive]}>
                {buildingNames[bld]}
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
  itemText: { fontSize: 16, color: Colors.textMain },
  itemTextActive: { color: Colors.primary, fontWeight: 'bold' },
});