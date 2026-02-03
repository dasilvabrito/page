const axios = require('axios');

const API_KEY = "cDZhyrsHpCdEJGbrejbKoTpPcJFe736119337541"; // Public Key for DataJud
const TRIBUNAL = "tjpa"; // Testing with TJPA
const URL = `https://api-publica.datajud.cnj.br/api_publica_${TRIBUNAL}/_search`;

const payload = {
    "query": {
        "match": {
            "numeroProcesso": "0800166-29.2020.8.14.0017" // Formatted or unformatted? API usually takes formatted or unformatted. Let's try unformatted first.
        }
    }
};

// Trying unformatted first based on previous knowledge, but let's send exactly what looks like a process number.
// Clean number: 08001662920208140017
const payloadClean = {
    "query": {
        "match": {
            "numeroProcesso": "08001662920208140017"
        }
    }
};

async function checkPJE() {
    try {
        console.log("Testing DataJud API...");
        const response = await axios.post(URL, payloadClean, {
            headers: {
                'Authorization': `APIKey ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Status:", response.status);
        if (response.data && response.data.hits && response.data.hits.hits.length > 0) {
            const process = response.data.hits.hits[0]._source;
            console.log("Process Found:", process.numeroProcesso);
            console.log("Movimentos count:", process.movimentos.length);
            console.log("Latest Movimento:", JSON.stringify(process.movimentos[0], null, 2));
        } else {
            console.log("No hits found.");
            console.log("Response:", JSON.stringify(response.data, null, 2));
        }

    } catch (error) {
        console.error("Error accessing DataJud:", error.message);
        if (error.response) {
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
        }
    }
}

checkPJE();
