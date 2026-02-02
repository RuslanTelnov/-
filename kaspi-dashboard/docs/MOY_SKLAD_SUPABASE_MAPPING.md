# Moy Sklad → Supabase Reference

Цель документа — иметь единый список эндпоинтов «Мой склад», их назначение и сопоставление с таблицами в Supabase. Артикул (`article`) является главным бизнес-ключом: все данные либо напрямую содержат артикул, либо связываются через `moy_sklad_id` и потом резолвятся к артикулу.

## Базовые параметры API

- Базовый URL: `https://api.moysklad.ru/api/remap/1.2`
- Авторизация: Bearer-токен или Basic (`login:password`), передаются в заголовке `Authorization`.
- Пагинация: `limit` (по умолчанию 25, максимум 1000) и `offset`.
- Все суммы приходят в копейках, перед записью в Supabase делим на `100`.

## Обзор эндпоинтов

| API путь | Назначение | Таблица Supabase | Уникальный ключ |
| --- | --- | --- | --- |
| `/entity/product` | Каталог товаров, источник артикула | `products` | `article` |
| `/report/stock/all` | Остатки по складам | `stock` | `product_id + store_id` |
| `/entity/store` | Справочник складов | `stores` | `moy_sklad_id` |
| `/entity/demand` | Продажи/отгрузки | `sales` | `moy_sklad_id` |
| `/entity/supply` | Закупки/поступления | `purchases` | `moy_sklad_id` |
| `/entity/counterparty` | Контрагенты | `counterparties` | `moy_sklad_id` |
| `/entity/customerorder` | Заказы покупателей | `customer_orders` | `moy_sklad_id` |
| `/entity/paymentin` | Входящие платежи | `payments_in` | `moy_sklad_id` |
| `/entity/paymentout` | Исходящие платежи | `payments_out` | `moy_sklad_id` |
| `/entity/cashin` | Приходные кассовые ордера | `cash_in` | `moy_sklad_id` |
| `/entity/cashout` | Расходные кассовые ордера | `cash_out` | `moy_sklad_id` |
| `/entity/loss` | Списания | `losses` | `moy_sklad_id` |
| `/report/turnover/all` | Отчет по оборотам | `turnover` | `article + period` |
| `/report/profit/byproduct` | Прибыль по товарам | `profit_by_product` | `article + period` |
| `/report/money/byaccount` | Деньги по счетам | `money_by_account` | `account_name + period` |
| (расчет) | Метрики на основе данных | `product_metrics` | `article` |

## Сопоставление колонок

### `products` (источник `/entity/product`)
- `article` (`product.article`) — уникальный идентификатор.
- `name` (`product.name`) — наименование.
- `code` (`product.code`) — внутренний код.
- `description` (`product.description`).
- `price` (`product.price / 100` или `salePrices[0].value / 100`).
- `sale_price` (`salePrices[0].value / 100` или `price / 100`).
- `quantity` (`product.quantity` округляется до целого, если поле присутствует).
- `moy_sklad_id` (`product.id`) — служебный ключ для связей.

### `stock` (источник `/report/stock/all`)
- `product_id` — ссылка на запись из `products` через `article`.
- `store_id` — ссылка на `stores` через `stock.store.id`.
- `stock` (`stock.stock`) — остаток на складе.
- `reserve` (`stock.reserve`) — резерв на складе.
- `in_transit` (`stock.inTransit`/`stock.in_transit`) — товары в пути.
- `quantity` (`stock.quantity`) — доступное количество.

### `stores` (источник `/entity/store`)
- `moy_sklad_id` (`store.id`).
- `name` (`store.name`).
- `address` (`store.address`).

### `sales` (источник `/entity/demand`)
- `moy_sklad_id` (`demand.id`).
- `name` (`demand.name`).
- `moment` (`demand.moment`).
- `sum` (`demand.sum / 100`).
- `quantity` (`demand.quantity`).
- `agent_name` (`demand.agent.name`).
- `organization_name` (`demand.organization.name`).

### `purchases` (источник `/entity/supply`)
Колонки аналогичны `sales`, данные берутся из объекта `supply`.

### `counterparties` (источник `/entity/counterparty`)
- `moy_sklad_id`, `name`, `phone`, `email`, `inn`, `kpp`, `legal_address`, `actual_address` — напрямую из ответа.

### `customer_orders` (источник `/entity/customerorder`)
- Основные поля как в `sales`.
- `state_name` (`order.state.name`).
- `positions` — массив, составленный из `order.positions.rows` (артикул, название, количество, цена/100).

### `payments_in` и `payments_out`
- `sum` делим на 100.
- `purpose` (`payment.paymentPurpose`).
- `agent_name` и `organization_name` из вложенных объектов.

### `cash_in` и `cash_out`
- Аналогично платежам, но относятся к кассовым ордерам.

### `losses`
- `positions` — список позиций из `loss.positions.rows` (артикул, название, количество, цена/100).

### `turnover`
- `article` (`turnover.article` или `turnover.assortment.article`).
- `product_name` (`turnover.assortment.name`).
- `quantity`, `sum/100`.
- `data` — полный JSON строки отчета.
- `period_start` / `period_end` задаются параметрами запроса.

### `profit_by_product`
- `article`, `product_name`.
- `revenue` (`profit.revenue / 100`), `cost` (`profit.cost / 100`), `profit` (вычисляется).
- `margin` = `(profit / revenue) * 100`.

### `money_by_account`
- `account_name` (`account.account.name` или `account.name`).
- `account_type` (`account.account.accountType`).
- `balance`, `income`, `outcome` — делим на 100.

### `product_metrics` (расчетная таблица)
- Заполняется после синхронизации скриптами аналитики.
- `article` связывает метрику с товарами.
- Поля `turnover_ratio`, `margin_percent`, `liquidity_score` и т.д. рассчитываются на стороне приложения.

## Скрипт «прохода» по всем эндпоинтам

Файл `scripts/export-moy-sklad-schema.ts` отправляет запросы ко всем перечисленным URL, фиксирует список полей и сохраняет его в `docs/moy-sklad-endpoints.json`.

Запуск:

```bash
npm run moysklad:map
```

Требования:
- В `.env.local` должны быть заданы `MOY_SKLAD_TOKEN` **или** пара `MOY_SKLAD_USERNAME` / `MOY_SKLAD_PASSWORD`.
- Опционально `MOY_SKLAD_API_URL`, если используется нестандартный домен.

Полученный JSON можно использовать при генерации SQL (например, чтобы быстро вспомнить, какие поля есть у конкретного отчета или где хранится нужный показатель).

## Что использовать как первичный ключ

- `article` — единый бизнес-идентификатор товара, на него завязаны `products`, `stock`, `turnover`, `profit_by_product`, `product_metrics` и связанные расчеты.
- `moy_sklad_id` — системный идентификатор документа/справочника. Используйте его для всех таблиц документов, чтобы реализовать `upsert`.
- Для отчетов обязательно добавляйте временные границы (`period_start`, `period_end`) в уникальный ключ.

Этот файл храните неизменным рядом с SQL-скриптами, чтобы команда могла оперативно сверяться, какие поля доступны и как они транслируются в Supabase.

