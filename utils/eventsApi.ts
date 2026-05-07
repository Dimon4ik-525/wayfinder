// utils/eventsApi.ts

export interface CollegeEvent {
  id: number;
  title: string;
  startDate: Date;
}

export const fetchUpcomingEvents = async (): Promise<CollegeEvent[]> => {
  // ТИМЧАСОВА ЗАГЛУШКА (Mock data)
  // Використовуємо її, поки сервер коледжу знімає блок 429 з твоєї IP-адреси
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { 
          id: 1, 
          title: 'Засідання гуртка "Web-програмування та дизайн"', 
          startDate: new Date('2026-05-05T15:15:00') 
        },
        { 
          id: 2, 
          title: 'Олімпіада з вищої математики (1-2 курс)', 
          startDate: new Date('2026-05-07T10:00:00') 
        },
        { 
          id: 3, 
          title: 'Зустріч з ІТ-компаніями міста (День кар\'єри)', 
          startDate: new Date('2026-05-12T12:30:00') 
        }
      ]);
    }, 500); // Імітуємо затримку завантаження пів секунди
  });
};