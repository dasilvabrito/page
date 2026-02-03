const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');

const TOKEN = '4f6ab927-3db7-4fe6-9c5c-3bd59f8dadeb434aae01-93b7-4eba-bc07-6a69869cda7f';

async function run() {
    console.log("Iniciando teste de PDF...");
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const html = `<html><body><h1>TESTE ZAPSIGN</h1><p>Este é um teste de envio.</p></body></html>`;
        await page.setContent(html);

        const pdfBuffer = await page.pdf({ format: 'A4' });

        console.log("Tipo de retorno de page.pdf():", typeof pdfBuffer);
        console.log("É Buffer?", Buffer.isBuffer(pdfBuffer));
        console.log("É Array?", Array.isArray(pdfBuffer));

        // Force conversion to Buffer in case it's Uint8Array
        const safeBuffer = Buffer.from(pdfBuffer);
        const base64 = safeBuffer.toString('base64');

        console.log("Tamanho Base64:", base64.length);
        console.log("Header Base64 (primeiros 20):", base64.substring(0, 20));

        // Test Upload to ZapSign
        console.log("Tentando enviar para ZapSign...");
        try {
            const body = {
                name: "Teste Debug Script.pdf",
                signers: [{
                    name: "Teste Signer",
                    email: "teste@example.com"
                }],
                lang: 'pt-br',
                base64_pdf: base64 // Sending RAW BASE64 (no prefix)
            };

            const res = await axios.post(`https://api.zapsign.com.br/api/v1/docs/?api_token=${TOKEN}`, body);
            console.log("SUCESSO ZAPSIGN!", res.status);
            console.log("Link:", res.data.signers[0].sign_url);
        } catch (apiErr) {
            console.error("ERRO ZAPSIGN:", apiErr.response ? apiErr.response.data : apiErr.message);
        }

        await browser.close();
    } catch (err) {
        console.error("Erro geral:", err);
    }
}

run();
