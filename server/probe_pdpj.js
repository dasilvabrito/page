const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log("[Probe] Starting...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Go to PDPJ
        console.log("[Probe] Navigating...");
        await page.goto('https://portaldeservicos.pdpj.jus.br/central-comunicacoes', { waitUntil: 'networkidle0', timeout: 60000 });

        await new Promise(r => setTimeout(r, 5000)); // Wait for valid render

        // Allow some time for dynamic content loading
        const html = await page.content();

        const dumpPath = path.join(__dirname, 'pdpj_dump.html');
        fs.writeFileSync(dumpPath, html);
        console.log(`[Probe] HTML dumped to ${dumpPath}`);

        // Also take a screenshot
        await page.screenshot({ path: path.join(__dirname, 'pdpj_dump.png') });
        console.log(`[Probe] Screenshot saved.`);

    } catch (e) {
        console.error("[Probe] Error:", e);
    } finally {
        await browser.close();
    }
})();
