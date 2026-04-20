import { View, Text, StyleSheet } from 'react-native';

export default function Substitutions() {
  return (
    <View style={styles.substitutionsBox}>
      <Text style={styles.subsTitle}>Заміни на сьогодні (2)</Text>
      
      {/* Шапка таблиці */}
      <View style={styles.subsHeader}>
        <Text style={[styles.subsColumnText, { width: 40 }]}>Пара</Text>
        <Text style={[styles.subsColumnText, { flex: 1 }]}>Предмет</Text>
        <Text style={[styles.subsColumnText, { width: 140 }]}>Викладач</Text>
        <Text style={[styles.subsColumnText, { width: 90 }]}>Кабінет</Text>
        <Text style={[styles.subsColumnText, { width: 90 }]}>Тип</Text>
      </View>

      {/* Перша заміна */}
      <View style={styles.subsRow}>
        <Text style={[styles.subsRowTextBold, { width: 40 }]}>3</Text>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.subsRowTextBold, { color: '#10B981' }]}>Основи баз даних</Text>
          <Text style={styles.subsRowSubtext} numberOfLines={1}> (Замість: Рівняння та методи...)</Text>
        </View>
        <Text style={[styles.subsRowText, { width: 140 }]}>Сидоренко В.В.</Text>
        <Text style={[styles.subsRowTextBold, { width: 90 }]}>12</Text>
        <View style={[styles.subsBadge, { backgroundColor: '#FEF3C7' }]}>
          <Text style={{ color: '#D97706', fontSize: 11, fontWeight: 'bold' }}>Заміна</Text>
        </View>
      </View>

      {/* Друга заміна */}
      <View style={[styles.subsRow, { borderBottomWidth: 0 }]}>
        <Text style={[styles.subsRowTextBold, { width: 40 }]}>5</Text>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.subsRowTextBold, { color: '#10B981' }]}>Самостійна робота</Text>
          <Text style={styles.subsRowSubtext} numberOfLines={1}> (Замість: Основи кібербезпеки)</Text>
        </View>
        <Text style={[styles.subsRowText, { width: 140 }]}>—</Text>
        <Text style={[styles.subsRowTextBold, { width: 90 }]}>Б-ка</Text>
        <View style={[styles.subsBadge, { backgroundColor: '#E0E7FF' }]}>
          <Text style={{ color: '#4338CA', fontSize: 11, fontWeight: 'bold' }}>Вичитка</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  substitutionsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12, 
    paddingVertical: 10, // Дуже компактні вертикальні відступи
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  subsTitle: { fontSize: 15, fontWeight: 'bold', color: '#D97706', marginBottom: 8 }, 
  subsHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#FDE68A', paddingBottom: 4, marginBottom: 4 },
  subsColumnText: { fontSize: 12, color: '#9CA3AF', fontWeight: 'bold' },
  subsRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#FDE68A', paddingVertical: 6 }, // Рядки стали вужчими
  subsRowText: { fontSize: 14, color: '#4B5563' },
  subsRowTextBold: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  subsRowSubtext: { fontSize: 12, color: '#9CA3AF', flexShrink: 1 }, 
  subsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, width: 80, alignItems: 'center' },
});