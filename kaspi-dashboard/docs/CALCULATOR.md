# Калькулятор для работы с товарами и деньгами

Калькулятор предоставляет набор функций для выполнения различных финансовых и товарных расчетов в системе.

## Использование

### В коде (TypeScript/JavaScript)

```typescript
import { Calculator } from '@/lib/utils/calculator'

// Общая стоимость товара
const totalValue = Calculator.calculateTotalValue(10, 1000) // 10000

// Маржа
const margin = Calculator.calculateMargin(1500, 1000) // 500

// Процент маржи
const marginPercent = Calculator.calculateMarginPercent(1500, 1000) // 33.33

// Форматирование денег
const formatted = Calculator.formatCurrency(10000, '₸') // "10 000,00 ₸"
```

### Через API

```typescript
const response = await fetch('/api/calculator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'calculateTotalValue',
    params: { quantity: 10, price: 1000 }
  })
})

const { result } = await response.json()
console.log(result) // 10000
```

## Доступные операции

### Базовые расчеты

#### `calculateTotalValue(quantity, price)`
Рассчитывает общую стоимость товара.
- **Параметры:**
  - `quantity` (number) - количество товара
  - `price` (number) - цена за единицу
- **Возвращает:** общая стоимость

#### `calculateMargin(salePrice, purchasePrice)`
Рассчитывает маржу (разница между ценой продажи и закупки).
- **Параметры:**
  - `salePrice` (number) - цена продажи
  - `purchasePrice` (number) - цена закупки
- **Возвращает:** маржа

#### `calculateMarginPercent(salePrice, purchasePrice)`
Рассчитывает процент маржи.
- **Параметры:**
  - `salePrice` (number) - цена продажи
  - `purchasePrice` (number) - цена закупки
- **Возвращает:** процент маржи (0-100)

### Аналитические расчеты

#### `calculateTurnover(sales, averageStock)`
Рассчитывает оборачиваемость товара.
- **Параметры:**
  - `sales` (number) - объем продаж
  - `averageStock` (number) - средний остаток
- **Возвращает:** коэффициент оборачиваемости

#### `calculateLiquidity(sales, stock, days)`
Рассчитывает ликвидность товара (дней на продажу остатка).
- **Параметры:**
  - `sales` (number) - объем продаж за период
  - `stock` (number) - текущий остаток
  - `days` (number, опционально) - период в днях (по умолчанию 30)
- **Возвращает:** дней на продажу остатка

#### `calculatePriority(turnover, margin, liquidity)`
Рассчитывает приоритет товара.
- **Параметры:**
  - `turnover` (number) - оборачиваемость
  - `margin` (number) - маржа
  - `liquidity` (number) - ликвидность
- **Возвращает:** приоритетный балл

### Финансовые расчеты

#### `calculateFinancials(totalBalance, logisticsReserve)`
Рассчитывает финансовые показатели.
- **Параметры:**
  - `totalBalance` (number) - общий баланс
  - `logisticsReserve` (number) - резерв на логистику
- **Возвращает:** объект с полями:
  - `totalBalance` - общий баланс
  - `logisticsReserve` - резерв на логистику
  - `balanceMinusReserve` - баланс за минусом резерва
  - `reservePercent` - процент резерва

#### `calculateROI(profit, investment)`
Рассчитывает ROI (Return on Investment).
- **Параметры:**
  - `profit` (number) - прибыль
  - `investment` (number) - инвестиции
- **Возвращает:** ROI в процентах

#### `calculateNetProfit(revenue, costOfGoods, operatingExpenses, taxes)`
Рассчитывает чистую прибыль.
- **Параметры:**
  - `revenue` (number) - выручка
  - `costOfGoods` (number) - себестоимость
  - `operatingExpenses` (number) - операционные расходы
  - `taxes` (number, опционально) - налоги
- **Возвращает:** чистая прибыль

#### `calculateProfitMargin(revenue, profit)`
Рассчитывает процент прибыли.
- **Параметры:**
  - `revenue` (number) - выручка
  - `profit` (number) - прибыль
- **Возвращает:** процент прибыли (0-100)

### Расчеты для закупок

#### `calculateBreakEven(fixedCosts, price, variableCosts)`
Рассчитывает точку безубыточности.
- **Параметры:**
  - `fixedCosts` (number) - постоянные затраты
  - `price` (number) - цена продажи
  - `variableCosts` (number) - переменные затраты
- **Возвращает:** количество единиц для безубыточности

#### `calculateEOQ(demand, orderingCost, holdingCost)`
Рассчитывает оптимальный размер заказа (Economic Order Quantity).
- **Параметры:**
  - `demand` (number) - спрос
  - `orderingCost` (number) - стоимость заказа
  - `holdingCost` (number) - стоимость хранения
- **Возвращает:** оптимальный размер заказа

#### `calculateDiscountedPrice(originalPrice, discountPercent)`
Рассчитывает цену со скидкой.
- **Параметры:**
  - `originalPrice` (number) - исходная цена
  - `discountPercent` (number) - процент скидки
- **Возвращает:** цена со скидкой

### Расчеты для складов

#### `calculateWarehouseValue(products)`
Рассчитывает общую стоимость товаров на складе.
- **Параметры:**
  - `products` (ProductCalculation[]) - массив товаров
- **Возвращает:** общая стоимость

#### `calculateAveragePrice(products)`
Рассчитывает среднюю цену товара.
- **Параметры:**
  - `products` (ProductCalculation[]) - массив товаров
- **Возвращает:** средняя цена

#### `calculateWarehouseDistribution(warehouses)`
Рассчитывает распределение товаров по складам.
- **Параметры:**
  - `warehouses` (WarehouseCalculation[]) - массив складов
- **Возвращает:** объект с распределением

### Утилиты форматирования

#### `formatCurrency(amount, currency, locale)`
Форматирует число как денежную сумму.
- **Параметры:**
  - `amount` (number) - сумма
  - `currency` (string, опционально) - валюта ('₸' или '$', по умолчанию '₸')
  - `locale` (string, опционально) - локаль (по умолчанию 'ru-RU')
- **Возвращает:** отформатированная строка

#### `formatNumber(number, decimals, locale)`
Форматирует число.
- **Параметры:**
  - `number` (number) - число
  - `decimals` (number, опционально) - количество знаков после запятой (по умолчанию 2)
  - `locale` (string, опционально) - локаль (по умолчанию 'ru-RU')
- **Возвращает:** отформатированная строка

## Примеры использования

### Пример 1: Расчет стоимости заказа

```typescript
const items = [
  { quantity: 10, price: 1000 },
  { quantity: 5, price: 2000 }
]

const total = Calculator.calculateOrderTotal(items)
console.log(total) // 20000
```

### Пример 2: Расчет финансовых показателей

```typescript
const financials = Calculator.calculateFinancials(1000000, 150000)
console.log(financials)
// {
//   totalBalance: 1000000,
//   logisticsReserve: 150000,
//   balanceMinusReserve: 850000,
//   reservePercent: 15
// }
```

### Пример 3: Расчет маржи и ROI

```typescript
const salePrice = 1500
const purchasePrice = 1000
const margin = Calculator.calculateMargin(salePrice, purchasePrice)
const marginPercent = Calculator.calculateMarginPercent(salePrice, purchasePrice)

console.log(`Маржа: ${margin} ₸ (${marginPercent.toFixed(2)}%)`)
```

## Интеграция в Dashboard

Калькулятор автоматически используется в Dashboard для:
- Расчетов общей стоимости товаров
- Расчетов финансовых показателей
- Форматирования денежных сумм

## Интеграция в AI Chat

AI помощник может использовать калькулятор через API для выполнения расчетов при ответах на вопросы пользователя.

