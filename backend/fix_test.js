import { normalizePhoneNumber } from './src/utils/phone.utils.js';

console.log(normalizePhoneNumber('3001234567', 'PK'));
console.log(normalizePhoneNumber('03001234567', 'PK'));
console.log(normalizePhoneNumber('923001234567', 'PK'));
console.log(normalizePhoneNumber('+923001234567', 'PK'));

