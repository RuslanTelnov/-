import { Calculator } from '../lib/utils/calculator';

function testCalculator() {
    console.log('🚀 Testing Calculator Margin Logic');

    const cases = [
        { sale: 150, cost: 100, expectedMargin: 33.33, expectedMarkup: 50 },
        { sale: 100, cost: 100, expectedMargin: 0, expectedMarkup: 0 },
        { sale: 80, cost: 100, expectedMargin: -25, expectedMarkup: -20 },
    ];

    for (const c of cases) {
        const margin = Calculator.calculateMarginPercent(c.sale, c.cost);
        const markup = Calculator.calculateMarkupPercent(c.sale, c.cost);

        console.log(`\nTest Case: Sale ${c.sale}, Cost ${c.cost}`);
        console.log(`  Margin (Expected ~${c.expectedMargin}%): ${margin.toFixed(2)}%`);
        console.log(`  Markup (Expected ~${c.expectedMarkup}%): ${markup.toFixed(2)}%`);

        if (Math.abs(margin - c.expectedMargin) > 0.1) console.error('  ❌ Margin Mismatch');
        else console.log('  ✅ Margin OK');

        if (Math.abs(markup - c.expectedMarkup) > 0.1) console.error('  ❌ Markup Mismatch');
        else console.log('  ✅ Markup OK');
    }
}

testCalculator();
