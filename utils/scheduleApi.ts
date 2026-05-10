// utils/scheduleApi.ts

// 🔥 ОБОВ'ЯЗКОВО ЗАМІНИ ЦЕ ПОСИЛАННЯ НА СВОЄ З VERCEL!
// (Те саме, куди ти деплоїв college-api, тільки без /api/... в кінці)
const BASE_URL = process.env.EXPO_PUBLIC_VERCEL_API_URL;

/**
 * Отримує список всіх груп (або груп для конкретного навчального року)
 */
export const fetchGroups = async (academicYearId?: number) => {
  try {
    let url = `${BASE_URL}/api/groups`;
    if (academicYearId) {
      url += `?academic_year_id=${academicYearId}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Помилка при завантаженні груп:', error);
    return null;
  }
};

/**
 * Отримує розклад для конкретної групи (або викладача)
 */
export const fetchSchedule = async (groupId?: number, teacherId?: number) => {
  try {
    let url = `${BASE_URL}/api/schedules`;
    
    // Перевіряємо, що саме шукаємо
    if (groupId) {
      url += `?group_id=${groupId}`;
    } else if (teacherId) {
      url += `?teacher_id=${teacherId}`;
    } else {
      throw new Error('Потрібно вказати group_id або teacher_id');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Помилка при завантаженні розкладу:', error);
    return null;
  }
};