// Quick script to test if CONVENER_INVITATION_CODE is loaded
require('dotenv').config();

console.log('=== Environment Variable Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CONVENER_INVITATION_CODE:', process.env.CONVENER_INVITATION_CODE);
console.log('CONVENER_INVITATION_CODE (with default):', process.env.CONVENER_INVITATION_CODE || 'COHORTLE_CONVENER_2024');
console.log('=================================');

// Test the exact logic from auth.js
const invitationCode = 'COHORTLE_CONVENER_2024';
const convenerInvitationCode = process.env.CONVENER_INVITATION_CODE || 'COHORTLE_CONVENER_2024';

console.log('\n=== Validation Test ===');
console.log('Input code:', invitationCode);
console.log('Expected code:', convenerInvitationCode);
console.log('Match:', invitationCode === convenerInvitationCode);
console.log('======================');
