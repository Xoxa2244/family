// Скрипт для очистки всех задач через Supabase API
import { supabase } from '../lib/supabase';

async function clearAllTasks() {
  try {
    const { error } = await supabase
      .from('task_instances')
      .delete()
      .neq('id', ''); // Удаляем все записи

    if (error) {
      console.error('Ошибка при удалении задач:', error);
      return;
    }

    console.log('✅ Все задачи успешно удалены!');
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

clearAllTasks();

