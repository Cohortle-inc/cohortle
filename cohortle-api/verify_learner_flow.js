const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const COMMUNITY_CODE = 'YyjoUFDB9D53';

async function runTest() {
    const email = `test_learner_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`--- Starting Test with email: ${email} ---`);

    try {
        // 1. Register
        console.log('1. Registering user...');
        const registerRes = await axios.post(`${BASE_URL}/v1/api/auth/register-email`, {
            email,
            password,
            first_name: 'Test',
            last_name: 'Learner'
        });
        const registerToken = registerRes.data.token;
        console.log('   Registration successful.');

        // 2. Set Role to Learner (since registration starts with role: null)
        console.log('2. Setting role to learner...');
        const setRoleRes = await axios.patch(
            `${BASE_URL}/v1/api/profile/set-role`,
            { role: 'learner' },
            { headers: { Authorization: `Bearer ${registerToken}` } }
        );
        const learnerToken = setRoleRes.data.token; // This token has role: learner
        console.log('   Role set to learner.');

        // 3. Verify Email (This was where the bug was - it used to strip the role)
        console.log('3. Verifying email...');
        const verifyRes = await axios.post(`${BASE_URL}/v1/api/auth/verify-email`, {
            verify_token: learnerToken
        });
        const verifiedToken = verifyRes.data.token;
        console.log('   Email verified. New token received.');

        // 4. Test Profile (Check if 403 occurs)
        console.log('4. Fetching profile (Testing 403 fix)...');
        try {
            const profileRes = await axios.get(`${BASE_URL}/v1/api/profile`, {
                headers: { Authorization: `Bearer ${verifiedToken}` }
            });
            console.log('   Profile fetched successfully! Role:', profileRes.data.message.role);
        } catch (err) {
            console.error('   FAILED: Profile fetch returned', err.response?.status, err.response?.data);
            process.exit(1);
        }

        // 5. Join Community
        console.log(`5. Joining community with code ${COMMUNITY_CODE}...`);
        try {
            const joinRes = await axios.post(
                `${BASE_URL}/v1/api/communities/join`,
                { code: COMMUNITY_CODE },
                { headers: { Authorization: `Bearer ${verifiedToken}` } }
            );
            console.log('   Joined community successfully!', joinRes.data.message);
        } catch (err) {
            console.error('   FAILED: Join community returned', err.response?.status, err.response?.data);
            process.exit(1);
        }

        // 6. Fetch Joined Communities
        console.log('6. Fetching joined communities...');
        try {
            const joinedRes = await axios.get(`${BASE_URL}/v1/api/communities/joined`, {
                headers: { Authorization: `Bearer ${verifiedToken}` }
            });
            console.log('   Joined communities fetched successfully! Count:', joinedRes.data.communities.length);
        } catch (err) {
            console.error('   FAILED: Fetched joined communities returned', err.response?.status, err.response?.data);
            process.exit(1);
        }

        console.log('--- TEST COMPLETED SUCCESSFULLY! ---');
    } catch (err) {
        console.error('Test failed with unexpected error:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
        process.exit(1);
    }
}

runTest();
