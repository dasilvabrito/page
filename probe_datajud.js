const axios = require('axios');

async function probe() {
    const urls = [
        "https://datajud.cnj.jus.br",
        "https://datajud.cnj.jus.br/api-publica-master/api_publica_tjpa/_search" // Possible path mapping
    ];

    for (const url of urls) {
        try {
            console.log(`Probing ${url}...`);
            const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
            console.log(`[${res.status}] ${url}`);
        } catch (err) {
            console.log(`[FAILED] ${url}: ${err.message}`);
        }
    }
}

probe();
