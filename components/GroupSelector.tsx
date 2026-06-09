import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SectionList, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { fetchGroups } from '../utils/scheduleApi'; 

interface Group {
  id: number;
  name: string;
}

interface GroupSelectorProps {
  onSelectGroup: (group: Group) => void;
  currentWeek?: string; // Приймаємо тиждень з головного екрана
}

const QUALIFIED_GROUPS: Record<string, string[]> = {
  'Кваліфіковані / 1 курс': ['7', '8', '9', '10', '11'],
  'Кваліфіковані / 2 курс': ['1', '2', '3', '4', '5'],
  'Кваліфіковані / 3 курс': ['13', '14', '15', '16', '17'],
  'Кваліфіковані / ТУ-I': ['20', '22', '6'],
  'Кваліфіковані / ТУ-II': ['12', '18', '19', '21'],
};

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
  'Інші групи'
];

export default function GroupSelector({ onSelectGroup, currentWeek }: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [sections, setSections] = useState<{title: string, data: Group[]}[]>([]);
  const [loading, setLoading] = useState(true);

  const categorizeGroups = (groups: Group[]) => {
    const sectionsMap = new Map<string, Group[]>();

    const addToSection = (title: string, group: Group) => {
      if (!sectionsMap.has(title)) sectionsMap.set(title, []);
      sectionsMap.get(title)!.push(group);
    };

    const addedNames = new Set<string>();

    groups.forEach(group => {
      const name = String(group.name).trim(); 

      if (name.includes(',')) return; 
      if (name.toLowerCase().includes('гурток')) return;
      if (addedNames.has(name)) return;
      addedNames.add(name);

      let categorized = false;

      for (const [sectionTitle, groupNames] of Object.entries(QUALIFIED_GROUPS)) {
        if (groupNames.includes(name)) {
          addToSection(sectionTitle, group);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        if (name.includes('-')) {
          const parts = name.split('-');
          const courseNumber = parts[parts.length - 1]; 
          
          if (!isNaN(Number(courseNumber))) {
            addToSection(`ФМБ / ${courseNumber} курс`, group);
          } else {
            addToSection('Інші групи', group);
          }
        } else {
          addToSection('Інші групи', group);
        }
      }
    });

    const finalSections = SECTION_ORDER.map(title => {
      const data = sectionsMap.get(title) || [];
      data.sort((a, b) => a.name.localeCompare(b.name));
      return { title, data };
    }).filter(section => section.data.length > 0);

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
          {/* Контейнер для тексту групи та тижня */}
          <View style={styles.selectedContent}>
            <Text style={styles.selectedText}>
              {selectedGroup ? selectedGroup.name : 'Оберіть групу'}
            </Text>
            
            {/* 🔥 ТИЖДЕНЬ ТЕПЕР ТУТ, ВСЕРЕДИНІ РАМКИ */}
            {selectedGroup && currentWeek ? (
              <Text style={styles.weekText}>({currentWeek})</Text>
            ) : null}
          </View>

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
  container: { position: 'relative', minWidth: 250, zIndex: 1000 },
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 16, color: '#475569', fontWeight: '500' },
  
  dropdownButton: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#6366F1', 
    borderRadius: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    backgroundColor: '#FFFFFF' 
  },
  
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 // Відстань між "ОФ-1" та "(Знаменник)"
  },
  
  selectedText: { fontSize: 16, color: '#1E293B', fontWeight: 'bold' },
  weekText: { fontSize: 14, color: '#64748B', marginTop: 1 }, // Сірий колір, щоб не зливався з групою
  arrowIcon: { fontSize: 10, color: '#64748B' },
  
  dropdownMenu: { position: 'absolute', top: '100%', left: 45, right: 0, marginTop: 4, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, ...Platform.select({ web: { boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }, default: { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 } }) },
  sectionHeader: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  sectionHeaderText: { fontWeight: 'bold', fontSize: 13, color: '#0F172A' },
  itemRow: { paddingHorizontal: 24, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  selectedItemRow: { backgroundColor: '#E2E8F0' },
  itemText: { fontSize: 14, color: '#334155' },
});