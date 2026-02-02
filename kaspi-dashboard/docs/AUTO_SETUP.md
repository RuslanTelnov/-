# Автоматическая установка SQL функции

## Способ 1: Через скрипт (рекомендуется)

Запустите команду:

```bash
npm run install-sql-function
```

Скрипт покажет SQL код, который нужно выполнить в Supabase SQL Editor.

## Способ 2: Прямое выполнение SQL

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Нажмите **New Query**
5. Скопируйте содержимое файла `supabase/migration-add-sql-function.sql`
6. Вставьте в редактор
7. Нажмите **Run** (или Ctrl+Enter)

## Способ 3: Через Supabase CLI

Если у вас установлен Supabase CLI:

```bash
supabase db push
```

Или выполните миграцию напрямую:

```bash
supabase migration new add_sql_function
# Скопируйте содержимое supabase/migration-add-sql-function.sql в созданный файл
supabase db push
```

## Проверка установки

После установки проверьте работу функции:

```sql
SELECT * FROM execute_readonly_query('SELECT article, name FROM products LIMIT 5');
```

Должны вернуться результаты в формате JSONB.

## Что делает функция?

- ✅ Разрешает только SELECT запросы
- ✅ Блокирует INSERT, UPDATE, DELETE, DROP и другие опасные команды
- ✅ Валидирует запросы перед выполнением
- ✅ Возвращает результаты в формате JSONB

## Безопасность

Функция использует `SECURITY DEFINER`, что означает выполнение с правами создателя функции. Это безопасно, так как:
- Функция проверяет запросы перед выполнением
- Разрешены только SELECT запросы
- Опасные команды блокируются

---

**После установки SQL запросы в AI чате будут работать автоматически!**

