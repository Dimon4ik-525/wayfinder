// utils/eventsApi.ts

declare var process: any;

const BASE_URL = process.env.EXPO_PUBLIC_VERCEL_API_URL;

export const fetchUpcomingEvents = async () => {
  try {
    // Доклеюємо шлях до ендпоінту прямо тут
    const response = await fetch(`${BASE_URL}/api/events`);

    if (!response.ok) {
      throw new Error(`Помилка API: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Повертаємо масив подій (у Tribe Events це зазвичай data.events)
    return data.events || [];

  } catch (error) {
    console.error('Помилка завантаження заходів:', error);
    return [];
  }
};