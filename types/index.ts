// Один пользователь (член семьи)
export type UserRole = "parent" | "child";

export interface User {
  id: string;        // "rodion", "nani", ...
  name: string;      // "Родион"
  login: string;     // "Rodion"
  role: UserRole;    // "parent" для главы семьи, остальные "child"
}

// Шаблон дела из справочника
export interface TaskTemplate {
  id: string;
  title: string;        // "Английский", "Физкультура"
  condition?: string;   // Условие выполнения дела
  active: boolean;
  assignedUserIds: string[]; // кому доступно это дело
}

// Квота дел в день для пользователя
// Пример: по понедельникам у Романа 1 дело, по вторникам — 3
export interface DailyQuota {
  userId: string;
  weekday: number;   // 0-6 (0 = Sunday, 1 = Monday, ...)
  tasksRequired: number; // 0-3
}

// Конкретный инстанс дела в календаре
export type TaskStatus = "pending" | "done" | "moved";

export interface TaskInstance {
  id: string;
  userId: string;
  templateId: string;
  date: string;      // "YYYY-MM-DD"
  status: TaskStatus;
  moveCount: number; // сколько раз переносили
}

// Общий стейт приложения
export interface AppState {
  users: User[];
  taskTemplates: TaskTemplate[];
  dailyQuotas: DailyQuota[];
  taskInstances: TaskInstance[];

  // Техническое
  currentUserId?: string;
}

