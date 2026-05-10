import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SectionList, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { fetchGroups } from '../utils/scheduleApi'; 

interface Group {
  id: number;
  name: string;
}

interface GroupSelectorProps {
  onSelectGroup: (group: Group) => void;
}

// 🔥 Жорстко задані групи для "Кваліфікованих" (бо вони не мають дефісів)
const QUALIFIED_GROUPS: Record<string, string[]> = {
  'Кваліфіковані / 1 курс': ['7', '8', '9', '10', '11'],
  'Кваліфіковані / 2 курс': ['1', '2', '3', '4', '5'],
  'Кваліфіковані / 3 курс': ['13', '14', '15', '16', '17'],
  'Кваліфіковані / ТУ-I': ['20', '22', '6'],
  'Кваліфіковані / ТУ-II': ['12', '18', '19', '21'],
};

// 🔥 Порядок, у якому секції будуть відображатися в меню
const SECTION_ORDER = [
  'Кваліфіковані / 1 курс',
  'Кваліфіковані / 2 курс',
  'Кваліфіковані / 3 курс',
  'Кваліфіковані / ТУ-I',
  'Кваліфіковані / ТУ-II',
  'ФМБ / 1 курс',
  'ФМБ / 2 курс',
  'ФМБ / 3 курс',
  'ФМБ / 4 курс',
  'Інші групи' // Сюди падатиме те, що не підійшло під жодне правило
];

export default function GroupSelector({ onSelectGroup }: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [sections, setSections] = useState<{title: string, data: Group[]}[]>([]);
  const [loading, setLoading] = useState(true);

  // 🧠 Головний алгоритм сортування
  const categorizeGroups = (groups: Group[]) => {
    const sectionsMap = new Map<string, Group[]>();

    const addToSection = (title: string, group: Group) => {
      if (!sectionsMap.has(title)) sectionsMap.set(title, []);
      sectionsMap.get(title)!.push(group);
    };

    // 🔥 Сет для захисту від 100% точних дублікатів
    const addedNames = new Set<string>();

    groups.forEach(group => {
      // Перетворюємо на рядок і забираємо зайві пробіли
      const name = String(group.name).trim(); 

      // 🔥 ПРАВИЛО 1: Відкидаємо об'єднані потокові групи (ті, що мають кому)
      if (name.includes(',')) {
        return; 
      }

      // 🔥 ПРАВИЛО 2: Відкидаємо "Гурток" (ігноруючи регістр)
      if (name.toLowerCase().includes('гурток')) {
        return;
      }

      // 🔥 ПРАВИЛО 3: Захист від дублікатів (якщо група вже є в списку, пропускаємо)
      if (addedNames.has(name)) {
        return;
      }
      addedNames.add(name);

      let categorized = false;

      // 1. Шукаємо серед "Кваліфікованих"
      for (const [sectionTitle, groupNames] of Object.entries(QUALIFIED_GROUPS)) {
        if (groupNames.includes(name)) {
          addToSection(sectionTitle, group);
          categorized = true;
          break;
        }
      }

      // 2. Якщо це не кваліфіковані, застосовуємо логіку ФМБ (шукаємо дефіс)
      if (!categorized) {
        if (name.includes('-')) {
          const parts = name.split('-');
          const courseNumber = parts[parts.length - 1]; // Беремо цифру після останнього дефіса
          
          // Перевіряємо, чи справді після дефіса йде цифра курсу (1, 2, 3, 4)
          if (!isNaN(Number(courseNumber))) {
            addToSection(`ФМБ / ${courseNumber} курс`, group);
          } else {
            addToSection('Інші групи', group);
          }
        } else {
          // Якщо немає дефіса і немає в масивах вище
          addToSection('Інші групи', group);
        }
      }
    });

    // 3. Формуємо масив для SectionList у правильному порядку (SECTION_ORDER)
    const finalSections = SECTION_ORDER.map(title => {
      const data = sectionsMap.get(title) || [];
      // Сортуємо групи за алфавітом всередині курсу (щоб ЕМ йшло перед КН)
      data.sort((a, b) => a.name.localeCompare(b.name));
      return { title, data };
    }).filter(section => section.data.length > 0);

    // Додаємо будь-які "заблукавші" секції (якщо раптом з'явиться 5 курс)
    sectionsMap.forEach((data, title) => {
      if (!SECTION_ORDER.includes(title)) {
        data.sort((a, b) => a.name.localeCompare(b.name));
        finalSections.push({ title, data });
      }
    });

    return finalSections;
  };

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      const data = await fetchGroups(); 
      
      if (data && Array.isArray(data)) {
        const structuredData = categorizeGroups(data);
        setSections(structuredData);
      }
      setLoading(false);
    };
    loadGroups();
  }, []);

  const handleSelect = (group: Group) => {
    setSelectedGroup(group);
    setIsOpen(false);
    onSelectGroup(group); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.selectorRow}>
        <Text style={styles.label}>Група</Text>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setIsOpen(!isOpen)}
          activeOpacity={0.7}
        >
          <Text style={styles.selectedText}>
            {selectedGroup ? selectedGroup.name : 'Оберіть групу'}
          </Text>
          <Text style={styles.arrowIcon}>{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          {loading ? (
            <ActivityIndicator size="small" color="#6366F1" style={{ margin: 20 }} />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 350 }}
              showsVerticalScrollIndicator={true}
              renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{title}</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.itemRow, 
                    selectedGroup?.id === item.id && styles.selectedItemRow
                  ]} 
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.itemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', width: 250, zIndex: 1000 },
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 14, color: '#475569' },
  dropdownButton: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#6366F1', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  selectedText: { fontSize: 14, color: '#1E293B' },
  arrowIcon: { fontSize: 10, color: '#64748B' },
  dropdownMenu: { position: 'absolute', top: '100%', left: 45, right: 0, marginTop: 4, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, ...Platform.select({ web: { boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }, default: { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 } }) },
  sectionHeader: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  sectionHeaderText: { fontWeight: 'bold', fontSize: 13, color: '#0F172A' },
  itemRow: { paddingHorizontal: 24, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  selectedItemRow: { backgroundColor: '#E2E8F0' },
  itemText: { fontSize: 14, color: '#334155' },
});