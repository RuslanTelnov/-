const jwt = require('jsonwebtoken');

const secret = 'your-super-secret-jwt-token-with-at-least-32-characters-long';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

try {
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token is valid:', decoded);
} catch (err) {
    console.error('❌ Token verification failed:', err.message);
}
