import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FooterProps {
  studentName?: string;
  supervisorName?: string;
}

export default function Footer({ 
  studentName = "Малащука Дмитра Олександровича", 
  supervisorName = "Попружук Олександр Миколайович" 
}: FooterProps) {
  
  return (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>Кваліфікаційна робота на тему: Апаратно-програмна платформа «Події, розклад та маршрут до аудиторії» </Text>
      <Text style={styles.footerText}>Студента групи ПМ-4: {studentName}</Text>
      <Text style={styles.footerText}>Науковий керівник: {supervisorName}</Text>
      <Text style={styles.footerYear}>Відокремлений структурний підрозділ “Рівненський технічний фаховий коледж НУВГП” © 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 30, },
  footerText: { fontSize: 14, color: '#64748B', marginBottom: 6, fontWeight: '500' },
  footerYear: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
});