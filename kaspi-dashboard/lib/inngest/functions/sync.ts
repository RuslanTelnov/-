import { inngest } from "../client";
import { MoySkladSync } from "@/lib/sync/moy-sklad-sync";

export const syncMoySklad = inngest.createFunction(
    { id: "sync-moysklad" },
    { event: "sync/moysklad.requested" },
    async ({ event, step }) => {
        const { type, periodStart, periodEnd } = event.data;

        const result = await step.run("run-sync-logic", async () => {
            const sync = new MoySkladSync();

            console.log(`🚀 Starting Inngest sync for type: ${type}`);

            switch (type) {
                case 'products': return await sync.syncProducts();
                case 'stock': return await sync.syncStock();
                case 'sales': return await sync.syncSales();
                case 'purchases': return await sync.syncPurchases();
                case 'counterparties': return await sync.syncCounterparties();
                case 'stores': return await sync.syncStores();
                case 'customer_orders': return await sync.syncCustomerOrders();
                case 'payments_in': return await sync.syncPaymentsIn();
                case 'payments_out': return await sync.syncPaymentsOut();
                case 'cash_in': return await sync.syncCashIn();
                case 'cash_out': return await sync.syncCashOut();
                case 'losses': return await sync.syncLosses();
                case 'turnover': return await sync.syncTurnover(periodStart, periodEnd);
                case 'profit_by_product': return await sync.syncProfitByProduct(periodStart, periodEnd);
                case 'money_by_account': return await sync.syncMoneyByAccount(periodStart, periodEnd);
                case 'all': return await sync.syncAll(periodStart, periodEnd);
                default:
                    throw new Error(`Unknown sync type: ${type}`);
            }
        });

        return { success: true, type, result };
    }
);
