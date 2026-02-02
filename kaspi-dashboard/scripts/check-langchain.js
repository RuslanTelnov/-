const langchain = require('langchain');
console.log(Object.keys(langchain));
try {
    const agents = require('langchain/agents');
    console.log('Agents found:', Object.keys(agents));
} catch (e) {
    console.log('Agents not found:', e.message);
}
