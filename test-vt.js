
const fs = require('fs');
const https = require('https');

// Simple env parser
function parseEnv() {
    try {
        const content = fs.readFileSync('.env.local', 'utf8');
        const lines = content.split('\n');
        const env = {};
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        }
        return env;
    } catch (e) {
        return {};
    }
}

const envConfig = parseEnv();
const apiKey = envConfig.VIRUSTOTAL_API_KEY;

if (!apiKey) {
    console.error('❌ VIRUSTOTAL_API_KEY not found in .env.local');
    process.exit(1);
}

const urlToScan = 'https://secure.eicar.org/eicar.com.txt';

async function fetchJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    console.error(`Status: ${res.statusCode}`);
                    console.error(`Body: ${data}`);
                    reject(new Error(`Request failed with status ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function testVirusTotal() {
    console.log(`🔍 Scanning: ${urlToScan}`);
    // console.log(`🔑 Key: ${apiKey.substring(0, 4)}...`);

    const formData = new URLSearchParams();
    formData.append('url', urlToScan);
    const body = formData.toString();

    try {
        console.log('Sending submission...');
        const submitData = await fetchJson('https://www.virustotal.com/api/v3/urls', {
            method: 'POST',
            headers: {
                'x-apikey': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            },
            body: body
        });

        const analysisId = submitData.data.id;
        console.log(`✅ Submitted. Analysis ID: ${analysisId}`);

        console.log('⏳ Waiting 5 seconds...');
        await new Promise(r => setTimeout(r, 5000));

        console.log('Fetching results...');
        const analysisData = await fetchJson(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
            headers: { 'x-apikey': apiKey },
            method: 'GET'
        });

        const stats = analysisData.data.attributes.stats;
        console.log('📊 Result Stats:', JSON.stringify(stats, null, 2));

        const status = analysisData.data.attributes.status;
        console.log(`ℹ️ Analysis Status: ${status}`);

    } catch (error) {
        console.error('❌ Error details:', error);
    }
}

testVirusTotal();
