import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { fetchUpcomingEvents } from '../utils/eventsApi';

export default function EventsWidget() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [slideWidth, setSlideWidth] = useState(250);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const data = await fetchUpcomingEvents();
        setEvents(data ? data.slice(0, 10) : []);
      } catch (error) {
        console.error('Помилка у віджеті:', error);
        setEvents([]);
      }
      setLoading(false);
    };
    loadEvents();
  }, []);

  const formatEventDate = (dateString: string | undefined, isAllDay?: boolean) => {
    if (!dateString) return 'Невідома дата';
    const validDateString = dateString.replace(' ', 'T');
    const date = new Date(validDateString);
    if (isNaN(date.getTime())) return 'Невідома дата';

    const months = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (isAllDay || (hours === '00' && minutes === '00') || (hours === '08' && minutes === '00')) {
      return `${day} ${month}`; 
    }
    return `${day} ${month}, ${hours}:${minutes}`;
  };

  const getEventTitle = (event: any) => {
    if (typeof event.title === 'string') return event.title;
    if (event.title && event.title.rendered) return event.title.rendered;
    return 'Захід коледжу';
  };

  const groupedEvents = [];
  for (let i = 0; i < events.length; i += 2) {
    groupedEvents.push(events.slice(i, i + 2));
  }

  const handleNext = () => {
    if (currentIndex < groupedEvents.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;
  
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const getItemLayout = (_: any, index: number) => ({
    length: slideWidth,
    offset: slideWidth * index,
    index,
  });

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
        <View>
          <View 
            style={styles.carouselContainer}
            onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}
          >
            {currentIndex > 0 && (
              <TouchableOpacity style={[styles.arrowButton, styles.leftArrow]} onPress={handlePrev}>
                <Text style={styles.arrowText}>{'<'}</Text>
              </TouchableOpacity>
            )}

            <FlatList 
              ref={flatListRef}
              data={groupedEvents}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={slideWidth}
              snapToAlignment="center"
              decelerationRate="fast"
              getItemLayout={getItemLayout}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewConfigRef}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item: group }) => (
                <View style={{ width: slideWidth, paddingHorizontal: 4, gap: 10 }}>
                  {group.map((event: any, index: number) => (
                    <View key={event.id || index} style={styles.eventCard}>
                      <Text style={styles.eventDate}>
                        {formatEventDate(event.start_date || event.startDate, event.all_day)}
                      </Text>
                      <Text style={styles.eventTitle} numberOfLines={3}>
                        {getEventTitle(event)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            />

            {currentIndex < groupedEvents.length - 1 && (
              <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={handleNext}>
                <Text style={styles.arrowText}>{'>'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dotsContainer}>
            {groupedEvents.map((_, index) => (
              <View 
                key={index} 
                style={[styles.dot, currentIndex === index && styles.activeDot]} 
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    width: '100%',
    paddingHorizontal: 0, // 🔥 Видалили 20px, бо в _layout.tsx вже є відступи
    marginTop: 5,         // 🔥 Зменшили з 20 до 5
    marginBottom: 10,     // 🔥 Зменшили з 20 до 10
  },
  widgetTitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  carouselContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  eventCard: {
    width: '100%', 
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6', 
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
    paddingVertical: 20,  // 🔥 Замінили жорсткі height: 100 на гнучкий padding
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  },
  arrowButton: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.9)', 
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
    top: '50%',
    marginTop: -15, 
  },
  leftArrow: {
    left: 0, 
  },
  rightArrow: {
    right: 0, 
  },
  arrowText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2, 
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 6, 
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#475569', 
  },
  activeDot: {
    backgroundColor: '#3B82F6', 
    width: 16, 
  }
});