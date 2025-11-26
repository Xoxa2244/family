import { supabase } from './supabase';
import { User, TaskTemplate, DailyQuota, TaskInstance, AppState } from '@/types';

// Сервис для работы с базой данных

// ========== Users ==========
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');

  if (error) throw error;
  return data.map(u => ({
    id: u.id,
    name: u.name,
    login: u.login,
    role: u.role as 'parent' | 'child',
  }));
}

export async function createUser(user: User): Promise<void> {
  const { error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      name: user.name,
      login: user.login,
      role: user.role,
    });

  if (error) throw error;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.login !== undefined) updateData.login = updates.login;
  if (updates.role !== undefined) updateData.role = updates.role;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) throw error;
}

export async function deleteUser(userId: string): Promise<void> {
  // Сначала удаляем связанные данные
  await supabase
    .from('task_template_assignments')
    .delete()
    .eq('user_id', userId);

  await supabase
    .from('daily_quotas')
    .delete()
    .eq('user_id', userId);

  await supabase
    .from('task_instances')
    .delete()
    .eq('user_id', userId);

  // Затем удаляем пользователя
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
}

// ========== Task Templates ==========
export async function getTaskTemplates(): Promise<TaskTemplate[]> {
  const { data: templates, error: templatesError } = await supabase
    .from('task_templates')
    .select('*')
    .order('title');

  if (templatesError) throw templatesError;

  const { data: assignments, error: assignmentsError } = await supabase
    .from('task_template_assignments')
    .select('task_template_id, user_id');

  if (assignmentsError) throw assignmentsError;

  // Группируем назначения по шаблонам
  const assignmentsMap = new Map<string, string[]>();
  assignments.forEach(a => {
    if (!assignmentsMap.has(a.task_template_id)) {
      assignmentsMap.set(a.task_template_id, []);
    }
    assignmentsMap.get(a.task_template_id)!.push(a.user_id);
  });

  return templates.map(t => ({
    id: t.id,
    title: t.title,
    condition: t.condition || undefined,
    active: t.active,
    assignedUserIds: assignmentsMap.get(t.id) || [],
  }));
}

export async function createTaskTemplate(template: TaskTemplate): Promise<void> {
  const { error: templateError } = await supabase
    .from('task_templates')
    .insert({
      id: template.id,
      title: template.title,
      condition: template.condition || null,
      active: template.active,
    });

  if (templateError) throw templateError;

  // Создаём назначения
  if (template.assignedUserIds.length > 0) {
    const assignments = template.assignedUserIds.map(userId => ({
      task_template_id: template.id,
      user_id: userId,
    }));

    const { error: assignmentsError } = await supabase
      .from('task_template_assignments')
      .insert(assignments);

    if (assignmentsError) throw assignmentsError;
  }
}

export async function updateTaskTemplate(templateId: string, updates: Partial<TaskTemplate>): Promise<void> {
  if (updates.title !== undefined || updates.condition !== undefined || updates.active !== undefined) {
    const { error } = await supabase
      .from('task_templates')
      .update({
        title: updates.title,
        condition: updates.condition || null,
        active: updates.active,
      })
      .eq('id', templateId);

    if (error) throw error;
  }

  // Обновляем назначения, если они изменились
  if (updates.assignedUserIds !== undefined) {
    // Удаляем старые назначения
    const { error: deleteError } = await supabase
      .from('task_template_assignments')
      .delete()
      .eq('task_template_id', templateId);

    if (deleteError) throw deleteError;

    // Добавляем новые
    if (updates.assignedUserIds.length > 0) {
      const assignments = updates.assignedUserIds.map(userId => ({
        task_template_id: templateId,
        user_id: userId,
      }));

      const { error: insertError } = await supabase
        .from('task_template_assignments')
        .insert(assignments);

      if (insertError) throw insertError;
    }
  }
}

// ========== Daily Quotas ==========
export async function getDailyQuotas(): Promise<DailyQuota[]> {
  const { data, error } = await supabase
    .from('daily_quotas')
    .select('*');

  if (error) throw error;
  return data.map(q => ({
    userId: q.user_id,
    weekday: q.weekday,
    tasksRequired: q.tasks_required,
  }));
}

export async function upsertDailyQuota(quota: DailyQuota): Promise<void> {
  const { error } = await supabase
    .from('daily_quotas')
    .upsert({
      user_id: quota.userId,
      weekday: quota.weekday,
      tasks_required: quota.tasksRequired,
    }, {
      onConflict: 'user_id,weekday',
    });

  if (error) throw error;
}

// ========== Task Instances ==========
export async function getTaskInstances(): Promise<TaskInstance[]> {
  const { data, error } = await supabase
    .from('task_instances')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data.map(i => ({
    id: i.id,
    userId: i.user_id,
    templateId: i.template_id,
    date: i.date,
    status: i.status as 'pending' | 'done' | 'moved',
    moveCount: i.move_count,
  }));
}

export async function createTaskInstance(instance: TaskInstance): Promise<void> {
  const { error } = await supabase
    .from('task_instances')
    .insert({
      id: instance.id,
      user_id: instance.userId,
      template_id: instance.templateId,
      date: instance.date,
      status: instance.status,
      move_count: instance.moveCount,
    });

  if (error) throw error;
}

export async function updateTaskInstance(instanceId: string, updates: Partial<TaskInstance>): Promise<void> {
  const updateData: any = {};
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.moveCount !== undefined) updateData.move_count = updates.moveCount;
  if (updates.date !== undefined) updateData.date = updates.date;

  const { error } = await supabase
    .from('task_instances')
    .update(updateData)
    .eq('id', instanceId);

  if (error) throw error;
}

export async function deleteAllTaskInstances(): Promise<void> {
  const { error } = await supabase
    .from('task_instances')
    .delete()
    .neq('id', ''); // Удаляем все записи

  if (error) throw error;
}

// ========== App State ==========
export async function getCurrentUserId(): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('app_state')
    .select('current_user_id')
    .eq('id', 'main')
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data?.current_user_id || undefined;
}

export async function setCurrentUserId(userId: string | undefined): Promise<void> {
  const { error } = await supabase
    .from('app_state')
    .upsert({
      id: 'main',
      current_user_id: userId || null,
    }, {
      onConflict: 'id',
    });

  if (error) throw error;
}

// ========== Инициализация данных ==========
export async function initializeDefaultData(): Promise<void> {
  // Проверяем, есть ли уже пользователи
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    return; // Данные уже инициализированы
  }

  // Создаём пользователей по умолчанию
  const defaultUsers: User[] = [
    { id: "rodion", name: "Родион", login: "Rodion", role: "parent" },
    { id: "nani", name: "Нани", login: "Nani", role: "child" },
    { id: "roman", name: "Роман", login: "Roman", role: "child" },
    { id: "rolan", name: "Ролан", login: "Rolan", role: "child" },
  ];

  for (const user of defaultUsers) {
    await createUser(user);
  }

  // Создаём шаблоны дел по умолчанию
  const defaultTemplates: TaskTemplate[] = [
    { id: "english", title: "Английский", active: true, assignedUserIds: ["rodion"] },
    { id: "pe", title: "Физкультура", active: true, assignedUserIds: ["rodion", "nani", "roman", "rolan"] },
    { id: "reading", title: "Чтение", active: true, assignedUserIds: ["nani", "roman", "rolan"] },
    { id: "math", title: "Математика", active: true, assignedUserIds: ["nani", "roman", "rolan"] },
  ];

  for (const template of defaultTemplates) {
    await createTaskTemplate(template);
  }

  // Создаём квоты по умолчанию
  const defaultQuotas: DailyQuota[] = [
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

  for (const quota of defaultQuotas) {
    await upsertDailyQuota(quota);
  }
}

