// components/EventsWidget.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { fetchUpcomingEvents, CollegeEvent } from '../utils/eventsApi';

export default function EventsWidget() {
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      const data = await fetchUpcomingEvents();
      setEvents(data);
      setLoading(false);
    };
    loadEvents();
  }, []);

  // Красиве форматування дати (напр. "16 Лют, 15:15")
  const formatEventDate = (date: Date) => {
    const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Якщо час 00:00, значить це подія на весь день
    if (hours === '00' && minutes === '00') {
      return `${day} ${month}`;
    }
    return `${day} ${month}, ${hours}:${minutes}`;
  };

  return (
    <View style={styles.widgetContainer}>
      <Text style={styles.widgetTitle}>✨ Анонси заходів</Text>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Поки немає анонсів</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventDate}>{formatEventDate(event.startDate)}</Text>
              <Text style={styles.eventTitle} numberOfLines={3}>
                {event.title}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    flex: 1, // Займе весь вільний простір між меню і годинником!
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  widgetTitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 10,
    gap: 10,
  },
  eventCard: {
    backgroundColor: '#334155', // Трохи світліший за фон сайдбару
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6', // Синя смужка зліва для стилю
  },
  eventDate: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 18,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  }
});