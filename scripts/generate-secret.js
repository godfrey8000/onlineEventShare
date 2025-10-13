#!/usr/bin/env node
// Generate secure JWT secret

const crypto = require('crypto');

console.log('\n🔐 JWT Secret Generator\n');
console.log('Add this to your .env file:\n');
console.log('JWT_SECRET="' + crypto.randomBytes(64).toString('hex') + '"\n');
console.log('Keep this secret and never commit it to version control!\n');
