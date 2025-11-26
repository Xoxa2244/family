-- Скрипт для очистки всех задач (для тестирования)
-- ВНИМАНИЕ: Это удалит ВСЕ задачи по всем пользователям и дням!

-- Удаляем все инстансы задач
DELETE FROM task_instances;

-- Также можно сбросить текущего пользователя (опционально)
-- UPDATE app_state SET current_user_id = NULL WHERE id = 'main';

-- Проверка: должно быть 0 строк
-- SELECT COUNT(*) FROM task_instances;

