# Быстрый справочник: API → Supabase

Краткая таблица соответствия полей API "Мой склад" и таблиц Supabase.

## Основные таблицы

### 1. Товары (`products`)
- **API:** `/entity/product`
- **Ключ:** `article` (артикул)
- **Основные поля:**
  - `id` → `moy_sklad_id`
  - `article` → `article` ⭐ **УНИКАЛЬНЫЙ КЛЮЧ**
  - `name` → `name`
  - `price` → `price` (копейки → рубли/тенге)
  - `salePrices[0].value` → `sale_price`

### 2. Остатки (`stock`)
- **API:** `/report/stock/all`
- **Ключ:** `(product_id, store_id)`
- **Основные поля:**
  - `assortment.article` → поиск `product_id` в `products`
  - `store.id` → поиск `store_id` в `stores`
  - `stock` → `stock` (доступно)
  - `reserve` → `reserve` (в резерве)
  - `inTransit` → `in_transit` (в пути)
  - `quantity` → `quantity` (общее)

### 3. Продажи (`sales`)
- **API:** `/entity/demand`
- **Ключ:** `moy_sklad_id`
- **Основные поля:**
  - `id` → `moy_sklad_id`
  - `moment` → `moment` (дата продажи)
  - `sum` → `sum` (копейки → рубли/тенге)
  - `agent.name` → `agent_name`
  - `organization.name` → `organization_name`

### 4. Закупки (`purchases`)
- **API:** `/entity/supply`
- **Ключ:** `moy_sklad_id`
- **Структура:** аналогична `sales`

### 5. Контрагенты (`counterparties`)
- **API:** `/entity/counterparty`
- **Ключ:** `moy_sklad_id`
- **Основные поля:**
  - `id` → `moy_sklad_id`
  - `name` → `name`
  - `phone` → `phone`
  - `email` → `email`
  - `inn` → `inn`
  - `legalAddress` → `legal_address`

### 6. Склады (`stores`)
- **API:** `/entity/store`
- **Ключ:** `moy_sklad_id`
- **Основные поля:**
  - `id` → `moy_sklad_id`
  - `name` → `name`
  - `address` → `address`

### 7. Заказы покупателей (`customer_orders`)
- **API:** `/entity/customerorder`
- **Ключ:** `moy_sklad_id`
- **Особенность:** `positions` сохраняется как JSONB с артикулами

### 8. Платежи (`payments_in`, `payments_out`)
- **API:** `/entity/paymentin`, `/entity/paymentout`
- **Ключ:** `moy_sklad_id`
- **Основные поля:**
  - `sum` → `sum` (копейки → рубли/тенге)
  - `paymentPurpose` → `purpose`

### 9. Кассовые ордера (`cash_in`, `cash_out`)
- **API:** `/entity/cashin`, `/entity/cashout`
- **Ключ:** `moy_sklad_id`
- **Структура:** аналогична платежам

### 10. Списания (`losses`)
- **API:** `/entity/loss`
- **Ключ:** `moy_sklad_id`
- **Особенность:** `positions` сохраняется как JSONB

### 11. Обороты (`turnover`)
- **API:** `/report/turnover/all`
- **Ключ:** `(article, period_start, period_end)`
- **Основные поля:**
  - `article` → `article`
  - `quantity` → `quantity`
  - `sum` → `sum` (копейки → рубли/тенге)
  - Параметры: `momentFrom`, `momentTo` → `period_start`, `period_end`

### 12. Прибыль по товарам (`profit_by_product`)
- **API:** `/report/profit/byproduct`
- **Ключ:** `(article, period_start, period_end)`
- **Основные поля:**
  - `revenue` → `revenue` (копейки → рубли/тенге)
  - `cost` → `cost` (копейки → рубли/тенге)
  - Рассчитывается: `profit = revenue - cost`, `margin = (profit / revenue) * 100`

### 13. Деньги по счетам (`money_by_account`)
- **API:** `/report/money/byaccount`
- **Ключ:** `(account_name, period_start, period_end)`
- **Основные поля:**
  - `account.name` → `account_name`
  - `balance` → `balance` (копейки → рубли/тенге)
  - `income` → `income`
  - `outcome` → `outcome`

### 14. Метрики товаров (`product_metrics`)
- **Источник:** Рассчитывается на основе других таблиц
- **Ключ:** `article` (UNIQUE)
- **Основные метрики:**
  - `turnover_ratio` - коэффициент оборачиваемости
  - `margin_percent` - маржа в %
  - `liquidity_score` - оценка ликвидности (0-100)
  - `priority_score` - приоритетный балл (0-100)
  - `recommendation` - текстовая рекомендация

## Важные замечания

### Конвертация валюты
Все суммы из API делятся на 100:
```sql
-- API возвращает: 120000 (копеек)
-- В Supabase сохраняется: 1200.00 (рубли/тенге)
```

### Поиск товаров
Для связи остатков с товарами используется **артикул**:
```sql
-- Найти product_id по артикулу
SELECT id FROM products WHERE article = 'АРТИКУЛ123';
```

### Связи
- `stock.product_id` → `products.id`
- `stock.store_id` → `stores.id`
- Все остальные используют `moy_sklad_id` для связи с внешней системой

### Периодические отчеты
Отчеты (`turnover`, `profit_by_product`, `money_by_account`) имеют уникальность по периоду:
- Один товар/счет может иметь несколько записей для разных периодов
- Уникальный ключ: `(article/account_name, period_start, period_end)`

## Часто используемые SQL запросы

### Найти товар по артикулу
```sql
SELECT * FROM products WHERE article = 'АРТИКУЛ123';
```

### Получить остатки товара на всех складах
```sql
SELECT 
  p.article,
  p.name,
  st.name as store_name,
  s.quantity
FROM stock s
JOIN products p ON s.product_id = p.id
LEFT JOIN stores st ON s.store_id = st.id
WHERE p.article = 'АРТИКУЛ123';
```

### Получить продажи за период
```sql
SELECT 
  DATE(moment) as date,
  SUM(sum) as revenue,
  COUNT(*) as sales_count
FROM sales
WHERE moment >= '2024-01-01' AND moment <= '2024-01-31'
GROUP BY DATE(moment)
ORDER BY date DESC;
```

### Получить метрики товара
```sql
SELECT 
  article,
  product_name,
  margin_percent,
  turnover_ratio,
  liquidity_score,
  priority_score,
  recommendation
FROM product_metrics
WHERE article = 'АРТИКУЛ123';
```

---

**Полная документация:** см. `API_MAPPING.md`

