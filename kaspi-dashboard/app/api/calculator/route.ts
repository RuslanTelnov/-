import { NextRequest, NextResponse } from 'next/server'
import { Calculator } from '@/lib/utils/calculator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, params } = body

    let result: any

    switch (operation) {
      case 'calculateTotalValue':
        result = Calculator.calculateTotalValue(params.quantity, params.price)
        break

      case 'calculateMargin':
        result = Calculator.calculateMargin(params.salePrice, params.purchasePrice)
        break

      case 'calculateMarginPercent':
        result = Calculator.calculateMarginPercent(params.salePrice, params.purchasePrice)
        break

      case 'calculateMarkupPercent':
        result = Calculator.calculateMarkupPercent(params.salePrice, params.purchasePrice)
        break

      case 'calculateTurnover':
        result = Calculator.calculateTurnover(params.sales, params.averageStock)
        break

      case 'calculateLiquidity':
        result = Calculator.calculateLiquidity(
          params.sales,
          params.stock,
          params.days || 30
        )
        break

      case 'calculatePriority':
        result = Calculator.calculatePriority(
          params.turnover,
          params.margin,
          params.liquidity
        )
        break

      case 'calculateWarehouseValue':
        result = Calculator.calculateWarehouseValue(params.products)
        break

      case 'calculateAveragePrice':
        result = Calculator.calculateAveragePrice(params.products)
        break

      case 'calculateFinancials':
        result = Calculator.calculateFinancials(
          params.totalBalance,
          params.logisticsReserve
        )
        break

      case 'calculateROI':
        result = Calculator.calculateROI(params.profit, params.investment)
        break

      case 'calculateBreakEven':
        result = Calculator.calculateBreakEven(
          params.fixedCosts,
          params.price,
          params.variableCosts
        )
        break

      case 'calculateDiscountedPrice':
        result = Calculator.calculateDiscountedPrice(
          params.originalPrice,
          params.discountPercent
        )
        break

      case 'calculateEOQ':
        result = Calculator.calculateEOQ(
          params.demand,
          params.orderingCost,
          params.holdingCost
        )
        break

      case 'calculateOrderTotal':
        result = Calculator.calculateOrderTotal(params.items)
        break

      case 'calculateShippingCostPerUnit':
        result = Calculator.calculateShippingCostPerUnit(
          params.totalShippingCost,
          params.totalQuantity
        )
        break

      case 'calculateNetProfit':
        result = Calculator.calculateNetProfit(
          params.revenue,
          params.costOfGoods,
          params.operatingExpenses,
          params.taxes
        )
        break

      case 'calculateProfitMargin':
        result = Calculator.calculateProfitMargin(params.revenue, params.profit)
        break

      case 'formatCurrency':
        result = Calculator.formatCurrency(
          params.amount,
          params.currency,
          params.locale
        )
        break

      case 'formatNumber':
        result = Calculator.formatNumber(
          params.number,
          params.decimals,
          params.locale
        )
        break

      case 'calculateWarehouseDistribution':
        result = Calculator.calculateWarehouseDistribution(params.warehouses)
        break

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('Calculator error:', error)
    return NextResponse.json(
      { error: error.message || 'Calculation failed' },
      { status: 500 }
    )
  }
}

