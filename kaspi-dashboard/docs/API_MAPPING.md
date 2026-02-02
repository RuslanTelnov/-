# Расшифровка API "Мой склад" и маппинг в Supabase

Этот документ описывает все API endpoints "Мой склад", их структуру данных и как они сохраняются в таблицы Supabase.

---

## 1. Товары (Products)

### API Endpoint
```
GET /entity/product
```

### Описание
Получение списка товаров из системы "Мой склад".

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-товара-в-мой-склад",
      "name": "Название товара",
      "code": "Код товара",
      "article": "Артикул товара (УНИКАЛЬНЫЙ КЛЮЧ)",
      "description": "Описание товара",
      "price": 10000,  // Цена в копейках
      "salePrices": [
        {
          "value": 12000  // Цена продажи в копейках
        }
      ],
      "quantity": 100,  // Количество на складе
      "updated": "2024-01-01T00:00:00.000Z",
      "created": "2024-01-01T00:00:00.000Z",
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/entity/product/uuid",
        "type": "product"
      }
    }
  ]
}
```

### Таблица Supabase: `products`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `id` | string | `moy_sklad_id` | TEXT | ID товара в Мой склад | UNIQUE |
| `article` | string | `article` | TEXT | Артикул товара | UNIQUE, PRIMARY KEY для связи |
| `name` | string | `name` | TEXT | Название товара | NOT NULL |
| `code` | string | `code` | TEXT | Код товара | Опционально |
| `description` | string | `description` | TEXT | Описание товара | Опционально |
| `price` или `salePrices[0].value` | number | `price` | DECIMAL(10,2) | Цена товара | Конвертируется из копеек |
| `salePrices[0].value` | number | `sale_price` | DECIMAL(10,2) | Цена продажи | Конвертируется из копеек |
| `quantity` | number | `quantity` | INTEGER | Количество на складе | По умолчанию 0 |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY, генерируется автоматически |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

### SQL запросы для работы с товарами

```sql
-- Получить все товары
SELECT * FROM products ORDER BY name;

-- Найти товар по артикулу
SELECT * FROM products WHERE article = 'АРТИКУЛ123';

-- Получить товары с ценами
SELECT article, name, price, sale_price, quantity 
FROM products 
WHERE price IS NOT NULL 
ORDER BY price DESC;

-- Получить товары без артикула (ошибки синхронизации)
SELECT * FROM products WHERE article IS NULL OR article = '';

-- Обновить цену товара
UPDATE products SET price = 1500.00 WHERE article = 'АРТИКУЛ123';
```

---

## 2. Остатки (Stock)

### API Endpoint
```
GET /report/stock/all
```

### Описание
Получение информации об остатках товаров на складах.

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-остатка",
      "name": "Название товара",
      "article": "Артикул товара",
      "assortment": {
        "id": "uuid-товара",
        "name": "Название товара",
        "article": "Артикул товара"
      },
      "store": {
        "id": "uuid-склада",
        "name": "Название склада"
      },
      "stock": 50,  // Доступно
      "reserve": 10,  // В резерве
      "inTransit": 5,  // В пути
      "quantity": 65,  // Общее количество
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/report/stock/all/uuid",
        "type": "stock"
      }
    }
  ]
}
```

### Таблица Supabase: `stock`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `assortment.article` или `article` | string | - | - | Артикул товара | Используется для поиска `product_id` |
| `store.id` | string | `store_id` | UUID | ID склада | Связь с таблицей `stores` |
| `stock` | number | `stock` | DECIMAL(10,2) | Доступно на складе | По умолчанию 0 |
| `reserve` | number | `reserve` | DECIMAL(10,2) | В резерве | По умолчанию 0 |
| `inTransit` | number | `in_transit` | DECIMAL(10,2) | В пути | По умолчанию 0 |
| `quantity` или `stock` | number | `quantity` | DECIMAL(10,2) | Общее количество | По умолчанию 0 |
| - | - | `product_id` | UUID | ID товара | FOREIGN KEY → `products.id` |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления | Автоматически |

**Важно:** 
- `product_id` находится по артикулу из таблицы `products`
- `store_id` находится по `moy_sklad_id` из таблицы `stores`
- Уникальный ключ: `(product_id, store_id)` - один товар может быть на разных складах

### SQL запросы для работы с остатками

```sql
-- Получить все остатки с информацией о товарах
SELECT 
  s.*,
  p.article,
  p.name as product_name,
  p.price,
  st.name as store_name
FROM stock s
JOIN products p ON s.product_id = p.id
LEFT JOIN stores st ON s.store_id = st.id
ORDER BY s.quantity DESC;

-- Получить остатки по конкретному складу
SELECT 
  p.article,
  p.name,
  s.quantity,
  s.stock,
  s.reserve
FROM stock s
JOIN products p ON s.product_id = p.id
JOIN stores st ON s.store_id = st.id
WHERE st.name = 'Название склада';

-- Получить товары с низким остатком (менее 10 единиц)
SELECT 
  p.article,
  p.name,
  s.quantity,
  st.name as store_name
FROM stock s
JOIN products p ON s.product_id = p.id
LEFT JOIN stores st ON s.store_id = st.id
WHERE s.quantity < 10
ORDER BY s.quantity ASC;

-- Получить общую стоимость товаров на складе
SELECT 
  st.name as store_name,
  SUM(s.quantity * COALESCE(p.price, p.sale_price, 0)) as total_value
FROM stock s
JOIN products p ON s.product_id = p.id
LEFT JOIN stores st ON s.store_id = st.id
GROUP BY st.name
ORDER BY total_value DESC;

-- Получить остатки без привязки к складу (общие)
SELECT 
  p.article,
  p.name,
  s.quantity
FROM stock s
JOIN products p ON s.product_id = p.id
WHERE s.store_id IS NULL;
```

---

## 3. Продажи (Sales / Demand)

### API Endpoint
```
GET /entity/demand
```

### Описание
Получение документов продаж (отгрузок) товаров.

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-продажи",
      "name": "ОТГ-000001",
      "moment": "2024-01-15T10:30:00.000Z",
      "sum": 120000,  // Сумма в копейках
      "quantity": 5,  // Количество товаров
      "agent": {
        "name": "Имя покупателя"
      },
      "organization": {
        "name": "Название организации"
      },
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/entity/demand/uuid",
        "type": "demand"
      }
    }
  ]
}
```

### Таблица Supabase: `sales`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `id` | string | `moy_sklad_id` | TEXT | ID продажи в Мой склад | UNIQUE |
| `name` | string | `name` | TEXT | Номер документа | NOT NULL |
| `moment` | string (ISO) | `moment` | TIMESTAMP | Дата и время продажи | NOT NULL |
| `sum` | number | `sum` | DECIMAL(10,2) | Сумма продажи | Конвертируется из копеек (/100) |
| `quantity` | number | `quantity` | DECIMAL(10,2) | Количество товаров | По умолчанию 0 |
| `agent.name` | string | `agent_name` | TEXT | Имя покупателя | Опционально |
| `organization.name` | string | `organization_name` | TEXT | Название организации | Опционально |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

### SQL запросы для работы с продажами

```sql
-- Получить все продажи за период
SELECT 
  name,
  moment,
  sum,
  quantity,
  agent_name,
  organization_name
FROM sales
WHERE moment >= '2024-01-01' AND moment <= '2024-01-31'
ORDER BY moment DESC;

-- Получить общую сумму продаж за месяц
SELECT 
  DATE_TRUNC('month', moment) as month,
  SUM(sum) as total_sales,
  SUM(quantity) as total_quantity,
  COUNT(*) as sales_count
FROM sales
GROUP BY DATE_TRUNC('month', moment)
ORDER BY month DESC;

-- Получить топ покупателей по сумме
SELECT 
  agent_name,
  SUM(sum) as total_purchases,
  COUNT(*) as orders_count
FROM sales
WHERE agent_name IS NOT NULL
GROUP BY agent_name
ORDER BY total_purchases DESC
LIMIT 10;

-- Получить продажи по дням
SELECT 
  DATE(moment) as sale_date,
  SUM(sum) as daily_revenue,
  COUNT(*) as sales_count
FROM sales
GROUP BY DATE(moment)
ORDER BY sale_date DESC
LIMIT 30;
```

---

## 4. Закупки (Purchases / Supply)

### API Endpoint
```
GET /entity/supply
```

### Описание
Получение документов закупок (поступлений) товаров.

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-закупки",
      "name": "ПРИХ-000001",
      "moment": "2024-01-10T09:00:00.000Z",
      "sum": 80000,  // Сумма в копейках
      "quantity": 10,  // Количество товаров
      "agent": {
        "name": "Имя поставщика"
      },
      "organization": {
        "name": "Название организации"
      },
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/entity/supply/uuid",
        "type": "supply"
      }
    }
  ]
}
```

### Таблица Supabase: `purchases`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `id` | string | `moy_sklad_id` | TEXT | ID закупки в Мой склад | UNIQUE |
| `name` | string | `name` | TEXT | Номер документа | NOT NULL |
| `moment` | string (ISO) | `moment` | TIMESTAMP | Дата и время закупки | NOT NULL |
| `sum` | number | `sum` | DECIMAL(10,2) | Сумма закупки | Конвертируется из копеек (/100) |
| `quantity` | number | `quantity` | DECIMAL(10,2) | Количество товаров | По умолчанию 0 |
| `agent.name` | string | `agent_name` | TEXT | Имя поставщика | Опционально |
| `organization.name` | string | `organization_name` | TEXT | Название организации | Опционально |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

### SQL запросы для работы с закупками

```sql
-- Получить все закупки за период
SELECT 
  name,
  moment,
  sum,
  quantity,
  agent_name
FROM purchases
WHERE moment >= '2024-01-01' AND moment <= '2024-01-31'
ORDER BY moment DESC;

-- Получить общую сумму закупок за месяц
SELECT 
  DATE_TRUNC('month', moment) as month,
  SUM(sum) as total_purchases,
  SUM(quantity) as total_quantity
FROM purchases
GROUP BY DATE_TRUNC('month', moment)
ORDER BY month DESC;

-- Получить топ поставщиков
SELECT 
  agent_name,
  SUM(sum) as total_purchases,
  COUNT(*) as orders_count
FROM purchases
WHERE agent_name IS NOT NULL
GROUP BY agent_name
ORDER BY total_purchases DESC
LIMIT 10;
```

---

## 5. Контрагенты (Counterparties)

### API Endpoint
```
GET /entity/counterparty
```

### Описание
Получение списка контрагентов (покупателей и поставщиков).

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-контрагента",
      "name": "Название контрагента",
      "phone": "+7 777 123 4567",
      "email": "email@example.com",
      "inn": "123456789012",
      "kpp": "123456789",
      "legalAddress": "Юридический адрес",
      "actualAddress": "Фактический адрес",
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/entity/counterparty/uuid",
        "type": "counterparty"
      }
    }
  ]
}
```

### Таблица Supabase: `counterparties`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `id` | string | `moy_sklad_id` | TEXT | ID контрагента в Мой склад | UNIQUE |
| `name` | string | `name` | TEXT | Название контрагента | NOT NULL |
| `phone` | string | `phone` | TEXT | Телефон | Опционально |
| `email` | string | `email` | TEXT | Email | Опционально |
| `inn` | string | `inn` | TEXT | ИНН | Опционально |
| `kpp` | string | `kpp` | TEXT | КПП | Опционально |
| `legalAddress` | string | `legal_address` | TEXT | Юридический адрес | Опционально |
| `actualAddress` | string | `actual_address` | TEXT | Фактический адрес | Опционально |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

### SQL запросы для работы с контрагентами

```sql
-- Получить всех контрагентов
SELECT * FROM counterparties ORDER BY name;

-- Найти контрагента по ИНН
SELECT * FROM counterparties WHERE inn = '123456789012';

-- Получить контрагентов с контактами
SELECT 
  name,
  phone,
  email,
  inn
FROM counterparties
WHERE phone IS NOT NULL OR email IS NOT NULL;
```

---

## 6. Склады (Stores)

### API Endpoint
```
GET /entity/store
```

### Описание
Получение списка складов.

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-склада",
      "name": "Основной склад",
      "address": "Адрес склада",
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/entity/store/uuid",
        "type": "store"
      }
    }
  ]
}
```

### Таблица Supabase: `stores`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `id` | string | `moy_sklad_id` | TEXT | ID склада в Мой склад | UNIQUE |
| `name` | string | `name` | TEXT | Название склада | NOT NULL |
| `address` | string | `address` | TEXT | Адрес склада | Опционально |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

### SQL запросы для работы со складами

```sql
-- Получить все склады
SELECT * FROM stores ORDER BY name;

-- Получить склады с количеством товаров
SELECT 
  s.name,
  s.address,
  COUNT(st.id) as products_count,
  SUM(st.quantity) as total_quantity
FROM stores s
LEFT JOIN stock st ON s.id = st.store_id
GROUP BY s.id, s.name, s.address
ORDER BY total_quantity DESC;
```

---

## 7. Заказы покупателей (Customer Orders)

### API Endpoint
```
GET /entity/customerorder
```

### Описание
Получение заказов покупателей.

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-заказа",
      "name": "ЗАКАЗ-000001",
      "moment": "2024-01-20T14:00:00.000Z",
      "sum": 150000,  // Сумма в копейках
      "quantity": 3,  // Количество позиций
      "agent": {
        "name": "Имя покупателя"
      },
      "organization": {
        "name": "Название организации"
      },
      "state": {
        "name": "Новый"
      },
      "positions": {
        "rows": [
          {
            "assortment": {
              "article": "АРТИКУЛ123",
              "name": "Название товара"
            },
            "quantity": 2,
            "price": 50000  // В копейках
          }
        ]
      },
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/entity/customerorder/uuid",
        "type": "customerorder"
      }
    }
  ]
}
```

### Таблица Supabase: `customer_orders`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `id` | string | `moy_sklad_id` | TEXT | ID заказа в Мой склад | UNIQUE |
| `name` | string | `name` | TEXT | Номер заказа | NOT NULL |
| `moment` | string (ISO) | `moment` | TIMESTAMP | Дата и время заказа | NOT NULL |
| `sum` | number | `sum` | DECIMAL(10,2) | Сумма заказа | Конвертируется из копеек (/100) |
| `quantity` | number | `quantity` | DECIMAL(10,2) | Количество позиций | По умолчанию 0 |
| `agent.name` | string | `agent_name` | TEXT | Имя покупателя | Опционально |
| `organization.name` | string | `organization_name` | TEXT | Название организации | Опционально |
| `state.name` | string | `state_name` | TEXT | Статус заказа | Опционально |
| `positions.rows[]` | array | `positions` | JSONB | Позиции заказа | Массив объектов с артикулами |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

**Структура JSONB `positions`:**
```json
[
  {
    "article": "АРТИКУЛ123",
    "name": "Название товара",
    "quantity": 2,
    "price": 500.00
  }
]
```

### SQL запросы для работы с заказами

```sql
-- Получить все заказы
SELECT 
  name,
  moment,
  sum,
  state_name,
  agent_name
FROM customer_orders
ORDER BY moment DESC;

-- Получить заказы по статусу
SELECT 
  state_name,
  COUNT(*) as orders_count,
  SUM(sum) as total_sum
FROM customer_orders
GROUP BY state_name
ORDER BY orders_count DESC;

-- Получить позиции из заказа (развернуть JSONB)
SELECT 
  name,
  moment,
  jsonb_array_elements(positions) as position
FROM customer_orders
WHERE positions IS NOT NULL;

-- Получить заказы с конкретным товаром
SELECT 
  co.name,
  co.moment,
  co.sum,
  pos->>'article' as article,
  pos->>'name' as product_name,
  (pos->>'quantity')::numeric as quantity
FROM customer_orders co,
  jsonb_array_elements(co.positions) pos
WHERE pos->>'article' = 'АРТИКУЛ123';
```

---

## 8. Входящие платежи (Payments In)

### API Endpoint
```
GET /entity/paymentin
```

### Описание
Получение входящих платежей (поступления денег).

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-платежа",
      "name": "ПЛАТ-000001",
      "moment": "2024-01-15T12:00:00.000Z",
      "sum": 120000,  // Сумма в копейках
      "agent": {
        "name": "Имя плательщика"
      },
      "organization": {
        "name": "Название организации"
      },
      "paymentPurpose": "Оплата за товар",
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/entity/paymentin/uuid",
        "type": "paymentin"
      }
    }
  ]
}
```

### Таблица Supabase: `payments_in`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `id` | string | `moy_sklad_id` | TEXT | ID платежа в Мой склад | UNIQUE |
| `name` | string | `name` | TEXT | Номер платежа | NOT NULL |
| `moment` | string (ISO) | `moment` | TIMESTAMP | Дата и время платежа | NOT NULL |
| `sum` | number | `sum` | DECIMAL(10,2) | Сумма платежа | Конвертируется из копеек (/100) |
| `agent.name` | string | `agent_name` | TEXT | Имя плательщика | Опционально |
| `organization.name` | string | `organization_name` | TEXT | Название организации | Опционально |
| `paymentPurpose` | string | `purpose` | TEXT | Назначение платежа | Опционально |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

### SQL запросы для работы с входящими платежами

```sql
-- Получить все входящие платежи за период
SELECT 
  name,
  moment,
  sum,
  agent_name,
  purpose
FROM payments_in
WHERE moment >= '2024-01-01' AND moment <= '2024-01-31'
ORDER BY moment DESC;

-- Получить общую сумму входящих платежей
SELECT 
  DATE_TRUNC('month', moment) as month,
  SUM(sum) as total_income
FROM payments_in
GROUP BY DATE_TRUNC('month', moment)
ORDER BY month DESC;
```

---

## 9. Исходящие платежи (Payments Out)

### API Endpoint
```
GET /entity/paymentout
```

### Описание
Получение исходящих платежей (выплаты денег).

### Структура данных API

Аналогична `paymentin`, но для исходящих платежей.

### Таблица Supabase: `payments_out`

Структура идентична `payments_in`.

### SQL запросы для работы с исходящими платежами

```sql
-- Получить все исходящие платежи за период
SELECT 
  name,
  moment,
  sum,
  agent_name,
  purpose
FROM payments_out
WHERE moment >= '2024-01-01' AND moment <= '2024-01-31'
ORDER BY moment DESC;

-- Получить баланс (входящие - исходящие)
SELECT 
  DATE_TRUNC('month', moment) as month,
  (SELECT COALESCE(SUM(sum), 0) FROM payments_in WHERE DATE_TRUNC('month', moment) = month) as income,
  (SELECT COALESCE(SUM(sum), 0) FROM payments_out WHERE DATE_TRUNC('month', moment) = month) as outcome,
  (SELECT COALESCE(SUM(sum), 0) FROM payments_in WHERE DATE_TRUNC('month', moment) = month) - 
  (SELECT COALESCE(SUM(sum), 0) FROM payments_out WHERE DATE_TRUNC('month', moment) = month) as balance
FROM payments_in
GROUP BY DATE_TRUNC('month', moment)
ORDER BY month DESC;
```

---

## 10. Приходные ордера (Cash In)

### API Endpoint
```
GET /entity/cashin
```

### Описание
Получение приходных кассовых ордеров.

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-ордера",
      "name": "ПКО-000001",
      "moment": "2024-01-15T10:00:00.000Z",
      "sum": 50000,  // Сумма в копейках
      "agent": {
        "name": "Имя контрагента"
      },
      "organization": {
        "name": "Название организации"
      },
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/entity/cashin/uuid",
        "type": "cashin"
      }
    }
  ]
}
```

### Таблица Supabase: `cash_in`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `id` | string | `moy_sklad_id` | TEXT | ID ордера в Мой склад | UNIQUE |
| `name` | string | `name` | TEXT | Номер ордера | NOT NULL |
| `moment` | string (ISO) | `moment` | TIMESTAMP | Дата и время | NOT NULL |
| `sum` | number | `sum` | DECIMAL(10,2) | Сумма | Конвертируется из копеек (/100) |
| `agent.name` | string | `agent_name` | TEXT | Имя контрагента | Опционально |
| `organization.name` | string | `organization_name` | TEXT | Название организации | Опционально |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

---

## 11. Расходные ордера (Cash Out)

### API Endpoint
```
GET /entity/cashout
```

### Описание
Получение расходных кассовых ордеров.

### Структура данных API

Аналогична `cashin`, но для расходных ордеров.

### Таблица Supabase: `cash_out`

Структура идентична `cash_in`.

---

## 12. Списания (Losses)

### API Endpoint
```
GET /entity/loss
```

### Описание
Получение документов списания товаров.

### Структура данных API

```json
{
  "rows": [
    {
      "id": "uuid-списания",
      "name": "СПИС-000001",
      "moment": "2024-01-10T08:00:00.000Z",
      "sum": 30000,  // Сумма в копейках
      "quantity": 2,  // Количество позиций
      "positions": {
        "rows": [
          {
            "assortment": {
              "article": "АРТИКУЛ123",
              "name": "Название товара"
            },
            "quantity": 1,
            "price": 15000  // В копейках
          }
        ]
      },
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/entity/loss/uuid",
        "type": "loss"
      }
    }
  ]
}
```

### Таблица Supabase: `losses`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `id` | string | `moy_sklad_id` | TEXT | ID списания в Мой склад | UNIQUE |
| `name` | string | `name` | TEXT | Номер документа | NOT NULL |
| `moment` | string (ISO) | `moment` | TIMESTAMP | Дата и время | NOT NULL |
| `sum` | number | `sum` | DECIMAL(10,2) | Сумма списания | Конвертируется из копеек (/100) |
| `quantity` | number | `quantity` | DECIMAL(10,2) | Количество позиций | По умолчанию 0 |
| `positions.rows[]` | array | `positions` | JSONB | Позиции списания | Массив объектов с артикулами |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

---

## 13. Обороты (Turnover Report)

### API Endpoint
```
GET /report/turnover/all
```

### Описание
Получение отчета по оборотам товаров за период.

### Параметры запроса
- `momentFrom` - начало периода (ISO string)
- `momentTo` - конец периода (ISO string)

### Структура данных API

```json
{
  "rows": [
    {
      "article": "АРТИКУЛ123",
      "assortment": {
        "name": "Название товара",
        "article": "АРТИКУЛ123"
      },
      "quantity": 50,  // Количество проданных единиц
      "sum": 600000,  // Сумма оборота в копейках
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/report/turnover/all/uuid",
        "type": "turnover"
      }
    }
  ]
}
```

### Таблица Supabase: `turnover`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `article` или `assortment.article` | string | `article` | TEXT | Артикул товара | NOT NULL, часть UNIQUE ключа |
| `assortment.name` или `name` | string | `product_name` | TEXT | Название товара | Опционально |
| `quantity` | number | `quantity` | DECIMAL(10,2) | Количество проданных единиц | По умолчанию 0 |
| `sum` | number | `sum` | DECIMAL(10,2) | Сумма оборота | Конвертируется из копеек (/100) |
| - | - | `period_start` | TIMESTAMP | Начало периода | Часть UNIQUE ключа |
| - | - | `period_end` | TIMESTAMP | Конец периода | Часть UNIQUE ключа |
| - | - | `data` | JSONB | Полные данные из API | Сохраняется для справки |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

**Уникальный ключ:** `(article, period_start, period_end)` - один товар может иметь несколько записей для разных периодов.

### SQL запросы для работы с оборотами

```sql
-- Получить обороты за период
SELECT 
  article,
  product_name,
  quantity,
  sum,
  period_start,
  period_end
FROM turnover
WHERE period_start >= '2024-01-01' AND period_end <= '2024-01-31'
ORDER BY sum DESC;

-- Получить топ товаров по обороту
SELECT 
  article,
  product_name,
  SUM(quantity) as total_quantity,
  SUM(sum) as total_turnover
FROM turnover
WHERE period_start >= '2024-01-01' AND period_end <= '2024-01-31'
GROUP BY article, product_name
ORDER BY total_turnover DESC
LIMIT 20;
```

---

## 14. Прибыль по товарам (Profit by Product)

### API Endpoint
```
GET /report/profit/byproduct
```

### Описание
Получение отчета по прибыли по каждому товару за период.

### Параметры запроса
- `momentFrom` - начало периода (ISO string)
- `momentTo` - конец периода (ISO string)

### Структура данных API

```json
{
  "rows": [
    {
      "article": "АРТИКУЛ123",
      "assortment": {
        "name": "Название товара",
        "article": "АРТИКУЛ123"
      },
      "revenue": 600000,  // Выручка в копейках
      "cost": 400000,  // Себестоимость в копейках
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/report/profit/byproduct/uuid",
        "type": "profit"
      }
    }
  ]
}
```

### Таблица Supabase: `profit_by_product`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `article` или `assortment.article` | string | `article` | TEXT | Артикул товара | NOT NULL, часть UNIQUE ключа |
| `assortment.name` или `name` | string | `product_name` | TEXT | Название товара | Опционально |
| `revenue` | number | `revenue` | DECIMAL(10,2) | Выручка | Конвертируется из копеек (/100) |
| `cost` | number | `cost` | DECIMAL(10,2) | Себестоимость | Конвертируется из копеек (/100) |
| - | - | `profit` | DECIMAL(10,2) | Прибыль | Рассчитывается: revenue - cost |
| - | - | `margin` | DECIMAL(5,2) | Маржа в % | Рассчитывается: (profit / revenue) * 100 |
| - | - | `period_start` | TIMESTAMP | Начало периода | Часть UNIQUE ключа |
| - | - | `period_end` | TIMESTAMP | Конец периода | Часть UNIQUE ключа |
| - | - | `data` | JSONB | Полные данные из API | Сохраняется для справки |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

**Уникальный ключ:** `(article, period_start, period_end)`

### SQL запросы для работы с прибылью

```sql
-- Получить прибыль по товарам за период
SELECT 
  article,
  product_name,
  revenue,
  cost,
  profit,
  margin
FROM profit_by_product
WHERE period_start >= '2024-01-01' AND period_end <= '2024-01-31'
ORDER BY profit DESC;

-- Получить товары с высокой маржой (>20%)
SELECT 
  article,
  product_name,
  revenue,
  profit,
  margin
FROM profit_by_product
WHERE margin > 20
ORDER BY margin DESC;

-- Получить товары с убытком
SELECT 
  article,
  product_name,
  revenue,
  cost,
  profit
FROM profit_by_product
WHERE profit < 0
ORDER BY profit ASC;
```

---

## 15. Деньги по счетам (Money by Account)

### API Endpoint
```
GET /report/money/byaccount
```

### Описание
Получение отчета по движению денег по счетам за период.

### Параметры запроса
- `momentFrom` - начало периода (ISO string)
- `momentTo` - конец периода (ISO string)

### Структура данных API

```json
{
  "rows": [
    {
      "account": {
        "name": "Расчетный счет",
        "accountType": "CURRENT"
      },
      "balance": 1000000,  // Остаток в копейках
      "income": 500000,  // Поступления в копейках
      "outcome": 300000,  // Выплаты в копейках
      "meta": {
        "href": "https://api.moysklad.ru/api/remap/1.2/report/money/byaccount/uuid",
        "type": "money"
      }
    }
  ]
}
```

### Таблица Supabase: `money_by_account`

| Поле API | Тип API | Поле Supabase | Тип Supabase | Описание | Примечание |
|---------|---------|--------------|--------------|----------|------------|
| `account.name` или `name` | string | `account_name` | TEXT | Название счета | NOT NULL, часть UNIQUE ключа |
| `account.accountType` | string | `account_type` | TEXT | Тип счета | Опционально |
| `balance` | number | `balance` | DECIMAL(10,2) | Остаток на счете | Конвертируется из копеек (/100) |
| `income` | number | `income` | DECIMAL(10,2) | Поступления | Конвертируется из копеек (/100) |
| `outcome` | number | `outcome` | DECIMAL(10,2) | Выплаты | Конвертируется из копеек (/100) |
| - | - | `period_start` | TIMESTAMP | Начало периода | Часть UNIQUE ключа |
| - | - | `period_end` | TIMESTAMP | Конец периода | Часть UNIQUE ключа |
| - | - | `data` | JSONB | Полные данные из API | Сохраняется для справки |
| - | - | `id` | UUID | Внутренний ID | PRIMARY KEY |
| - | - | `created_at` | TIMESTAMP | Дата создания записи | Автоматически |
| - | - | `updated_at` | TIMESTAMP | Дата обновления записи | Автоматически |

**Уникальный ключ:** `(account_name, period_start, period_end)`

### SQL запросы для работы с деньгами по счетам

```sql
-- Получить состояние счетов за период
SELECT 
  account_name,
  account_type,
  balance,
  income,
  outcome,
  balance + income - outcome as calculated_balance
FROM money_by_account
WHERE period_start >= '2024-01-01' AND period_end <= '2024-01-31'
ORDER BY balance DESC;

-- Получить общий баланс по всем счетам
SELECT 
  SUM(balance) as total_balance,
  SUM(income) as total_income,
  SUM(outcome) as total_outcome
FROM money_by_account
WHERE period_start >= '2024-01-01' AND period_end <= '2024-01-31';
```

---

## 16. Метрики товаров (Product Metrics)

### Описание
Таблица `product_metrics` содержит рассчитанные метрики для каждого товара на основе данных из других таблиц.

### Таблица Supabase: `product_metrics`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | PRIMARY KEY |
| `article` | TEXT | Артикул товара (UNIQUE) |
| `product_name` | TEXT | Название товара |
| `turnover_ratio` | DECIMAL(10,4) | Коэффициент оборачиваемости |
| `turnover_days` | DECIMAL(10,2) | Дни оборота |
| `margin_percent` | DECIMAL(5,2) | Маржа в процентах |
| `margin_amount` | DECIMAL(10,2) | Сумма маржи |
| `liquidity_score` | DECIMAL(5,2) | Оценка ликвидности (0-100) |
| `sales_velocity` | DECIMAL(10,2) | Скорость продаж (единиц/день) |
| `total_revenue` | DECIMAL(10,2) | Общая выручка |
| `avg_revenue_per_day` | DECIMAL(10,2) | Средняя выручка в день |
| `current_stock` | DECIMAL(10,2) | Текущий остаток |
| `avg_stock` | DECIMAL(10,2) | Средний остаток |
| `recommendation` | TEXT | Рекомендация по товару |
| `priority_score` | DECIMAL(5,2) | Приоритетный балл (0-100) |
| `period_start` | TIMESTAMP | Начало периода расчета |
| `period_end` | TIMESTAMP | Конец периода расчета |
| `calculated_at` | TIMESTAMP | Время расчета метрик |
| `created_at` | TIMESTAMP | Дата создания записи |
| `updated_at` | TIMESTAMP | Дата обновления записи |

### SQL запросы для работы с метриками

```sql
-- Получить все метрики товаров
SELECT 
  article,
  product_name,
  margin_percent,
  turnover_ratio,
  liquidity_score,
  priority_score,
  recommendation
FROM product_metrics
ORDER BY priority_score DESC;

-- Получить товары с высоким приоритетом (>70)
SELECT 
  article,
  product_name,
  margin_percent,
  turnover_ratio,
  recommendation
FROM product_metrics
WHERE priority_score > 70
ORDER BY priority_score DESC;

-- Получить товары с низкой ликвидностью
SELECT 
  article,
  product_name,
  liquidity_score,
  current_stock,
  sales_velocity,
  recommendation
FROM product_metrics
WHERE liquidity_score < 40
ORDER BY liquidity_score ASC;
```

---

## Общие замечания

### Конвертация валюты
Все суммы в API "Мой склад" приходят в **копейках** (или минимальных единицах валюты). При сохранении в Supabase они конвертируются в основные единицы путем деления на 100:
```javascript
sum: sale.sum / 100  // Из копеек в рубли/тенге
```

### Уникальные ключи
- **products**: `article` (артикул) - основной ключ для связи
- **stock**: `(product_id, store_id)` - один товар может быть на разных складах
- **sales, purchases, etc.**: `moy_sklad_id` - ID из системы "Мой склад"
- **turnover, profit_by_product, money_by_account**: `(article/account_name, period_start, period_end)` - уникальность по периоду

### Связи между таблицами
- `stock.product_id` → `products.id`
- `stock.store_id` → `stores.id`
- Все остальные таблицы используют `moy_sklad_id` для связи с внешней системой

### Автоматические поля
Все таблицы имеют:
- `id` (UUID) - первичный ключ
- `created_at` (TIMESTAMP) - дата создания
- `updated_at` (TIMESTAMP) - дата обновления (обновляется автоматически триггером)

---

## Полезные SQL запросы для анализа

### Общая статистика по товарам
```sql
SELECT 
  COUNT(*) as total_products,
  COUNT(DISTINCT article) as unique_articles,
  SUM(quantity) as total_quantity,
  AVG(price) as avg_price
FROM products;
```

### Товары с остатками по складам
```sql
SELECT 
  p.article,
  p.name,
  st.name as store_name,
  s.quantity,
  s.stock,
  s.reserve,
  (s.quantity * COALESCE(p.price, p.sale_price, 0)) as total_value
FROM stock s
JOIN products p ON s.product_id = p.id
LEFT JOIN stores st ON s.store_id = st.id
ORDER BY total_value DESC;
```

### Продажи с детализацией по товарам
```sql
SELECT 
  DATE(s.moment) as sale_date,
  COUNT(*) as sales_count,
  SUM(s.sum) as total_revenue,
  SUM(s.quantity) as total_quantity
FROM sales s
GROUP BY DATE(s.moment)
ORDER BY sale_date DESC
LIMIT 30;
```

### Анализ прибыльности
```sql
SELECT 
  p.article,
  p.name,
  pp.margin,
  pp.profit,
  pp.revenue,
  t.quantity as turnover_quantity
FROM profit_by_product pp
JOIN products p ON pp.article = p.article
LEFT JOIN turnover t ON pp.article = t.article AND pp.period_start = t.period_start
WHERE pp.period_start >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY pp.margin DESC;
```

---

**Дата создания документа:** 2024-01-20  
**Версия:** 1.0

