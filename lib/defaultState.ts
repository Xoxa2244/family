import { AppState, User, TaskTemplate } from '@/types';

const defaultUsers: User[] = [
  { id: "rodion", name: "Родион", login: "Rodion", role: "parent" },
  { id: "nani",   name: "Нани",   login: "Nani",   role: "child" },
  { id: "roman",  name: "Роман",  login: "Roman",  role: "child" },
  { id: "rolan",  name: "Ролан",  login: "Rolan",  role: "child" },
];

const defaultTaskTemplates: TaskTemplate[] = [
  { id: "english",    title: "Английский",   active: true, assignedUserIds: ["rodion"] },
  { id: "pe",         title: "Физкультура",  active: true, assignedUserIds: ["rodion","nani","roman","rolan"] },
  { id: "reading",    title: "Чтение",       active: true, assignedUserIds: ["nani","roman","rolan"] },
  { id: "math",       title: "Математика",   active: true, assignedUserIds: ["nani","roman","rolan"] },
];

// Пример квот по умолчанию для детей
// Понедельник - 1, Вторник - 3, Среда - 2, Четверг - 3, Пятница - 1, Суббота - 3, Воскресенье - 2
const defaultDailyQuotas = [
  // Дети
  ...["nani", "roman", "rolan"].flatMap(userId => [
    { userId, weekday: 1, tasksRequired: 1 }, // Понедельник
    { userId, weekday: 2, tasksRequired: 3 }, // Вторник
    { userId, weekday: 3, tasksRequired: 2 }, // Среда
    { userId, weekday: 4, tasksRequired: 3 }, // Четверг
    { userId, weekday: 5, tasksRequired: 1 }, // Пятница
    { userId, weekday: 6, tasksRequired: 3 }, // Суббота
    { userId, weekday: 0, tasksRequired: 2 }, // Воскресенье
  ]),
];

export const defaultState: AppState = {
  users: defaultUsers,
  taskTemplates: defaultTaskTemplates,
  dailyQuotas: defaultDailyQuotas,
  taskInstances: [],
  currentUserId: undefined,
};

