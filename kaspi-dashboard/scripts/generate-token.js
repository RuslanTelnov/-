const jwt = require('jsonwebtoken');

const secret = 'your-super-secret-jwt-token-with-at-least-32-characters-long';

const anonPayload = {
    iss: 'supabase-demo',
    role: 'anon',
    exp: 1983812996
};

const servicePayload = {
    iss: 'supabase-demo',
    role: 'service_role',
    exp: 1983812996
};

const anonToken = jwt.sign(anonPayload, secret, { algorithm: 'HS256' });
const serviceToken = jwt.sign(servicePayload, secret, { algorithm: 'HS256' });

console.log('ANON_KEY=' + anonToken);
console.log('SERVICE_ROLE_KEY=' + serviceToken);
