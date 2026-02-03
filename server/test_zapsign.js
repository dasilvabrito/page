const axios = require('axios');

const TOKEN = '4f6ab927-3db7-4fe6-9c5c-3bd59f8dadeb434aae01-93b7-4eba-bc07-6a69869cda7f';

async function testEnvironment(name, baseUrl) {
    console.log(`Testing ${name} (${baseUrl})...`);
    try {
        const url = `${baseUrl}/api/v1/docs/?api_token=${TOKEN}`;
        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${TOKEN}` } }); // Try both just in case, but usually query is enough
        console.log(`[SUCCESS] ${name}: Status ${response.status}`);
        return true;
    } catch (error) {
        if (error.response) {
            console.log(`[FAILED] ${name}: Status ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
            console.log(`[FAILED] ${name}: ${error.message}`);
        }
        return false;
    }
}

async function run() {
    console.log("Checking Token validity...");

    // Test Production
    const isProd = await testEnvironment('PRODUCTION', 'https://api.zapsign.com.br');

    // Test Sandbox
    const isSandbox = await testEnvironment('SANDBOX', 'https://sandbox.api.zapsign.com.br');

    if (isProd) {
        console.log("\n>>> CONCLUSION: Token is for PRODUCTION.");
    } else if (isSandbox) {
        console.log("\n>>> CONCLUSION: Token is for SANDBOX.");
    } else {
        console.log("\n>>> CONCLUSION: Token is INVALID for both environments.");
    }
}

run();
