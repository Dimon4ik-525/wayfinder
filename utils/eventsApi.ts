// utils/eventsApi.ts

// ВСТАВ СЮДИ СВОЄ ПОВНЕ ПОСИЛАННЯ ВІД VERCEL!
const PROXY_URL = 'https://college-qw5bz45ci-dimon4ik-projects.vercel.app/api/events'; 

export const fetchUpcomingEvents = async () => {
  try {
    const response = await fetch(PROXY_URL);

    if (!response.ok) {
      throw new Error(`Помилка API: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.events || [];

  } catch (error) {
    console.error('Помилка завантаження заходів:', error);
    return [];
  }
};