const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function scrapePDPJ({ oab, uf, startDate, endDate }) {
    console.log(`[PDPJ Scraper] Interactive Mode. OAB: ${oab}/${uf} | Dates: ${startDate} - ${endDate}`);

    // Launch visible browser
    const browser = await puppeteer.launch({
        headless: false, // User sees the browser
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Load cookies if exist
        const cookiesPath = path.join(__dirname, 'cookies.json');
        if (fs.existsSync(cookiesPath)) {
            try {
                const cookies = JSON.parse(fs.readFileSync(cookiesPath));
                await page.setCookie(...cookies);
                console.log("[PDPJ] Cookies loaded.");
            } catch (e) {
                console.error("Error loading cookies:", e);
            }
        }

        // Load Session/Local Storage if exist
        const storagePath = path.join(__dirname, 'session_storage.json');
        if (fs.existsSync(storagePath)) {
            try {
                const storageData = JSON.parse(fs.readFileSync(storagePath));
                await page.evaluateOnNewDocument((data) => {
                    if (data.localStorage) {
                        for (const key in data.localStorage) {
                            localStorage.setItem(key, data.localStorage[key]);
                        }
                    }
                    if (data.sessionStorage) {
                        for (const key in data.sessionStorage) {
                            sessionStorage.setItem(key, data.sessionStorage[key]);
                        }
                    }
                }, storageData);
                console.log("[PDPJ] Local/Session Storage restored.");
            } catch (e) {
                console.error("Error loading storage:", e);
            }
        }

        // Navigate
        console.log("[PDPJ] Navigating to portal...");
        await page.goto('https://portaldeservicos.pdpj.jus.br/central-comunicacoes', { waitUntil: 'domcontentloaded' });

        // Check for login (Resilient logic)
        let needsLogin = false;
        try {
            await new Promise(r => setTimeout(r, 2000));
            // Check if redirected to SSO or if login form is present
            if (page.url().includes('sso.cloud.pje.jus.br') || (await page.$('#kc-form-login'))) {
                needsLogin = true;
            }
        } catch (e) {
            console.log("[PDPJ] Navigation check error (likely redirecting):", e.message);
            needsLogin = true;
        }

        if (needsLogin) {
            console.log("[PDPJ] Login screen detected. Waiting for user to login...");

            // Polling loop for login success
            const maxTime = Date.now() + 300000; // 5 minutes
            while (Date.now() < maxTime) {
                if (page.isClosed()) throw new Error("Browser closed by user.");

                try {
                    const currentUrl = page.url();
                    // Check if back on central-comunicacoes and NOT on SSO
                    if (currentUrl.includes('central-comunicacoes') && !currentUrl.includes('sso.cloud.pje.jus.br')) {
                        const loginForm = await page.$('#kc-form-login');
                        if (!loginForm) {
                            console.log("[PDPJ] Login successful (URL: " + currentUrl + ")");
                            break;
                        }
                    }
                } catch (innerErr) {
                    // Ignore transient errors
                }
                await new Promise(r => setTimeout(r, 1000));
            }
            if (Date.now() >= maxTime) throw new Error("Login timeout.");
        }

        console.log("[PDPJ] Logged in. Waiting for dashboard stability...");
        await new Promise(r => setTimeout(r, 5000));

        // Save cookies & Storage
        try {
            if (!page.isClosed()) {
                const cookies = await page.cookies();
                fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));

                const storageData = await page.evaluate(() => {
                    return {
                        localStorage: { ...localStorage },
                        sessionStorage: { ...sessionStorage }
                    };
                });
                const storagePath = path.join(__dirname, 'session_storage.json');
                fs.writeFileSync(storagePath, JSON.stringify(storageData, null, 2));

                console.log("[PDPJ] Session (Cookies + Storage) saved.");
            }
        } catch (e) {
            console.error("Error saving session data:", e);
        }

        if (page.isClosed()) return [];

        // --- SEARCH LOGIC ---
        console.log("[PDPJ] Starting search...");

        // 1. Wait for form
        try {
            await page.waitForSelector('form#form_busca_diario_justica', { timeout: 15000 });
        } catch (e) {
            console.log("[PDPJ] Search form not found. Maybe on wrong tab? Trying to find tabs...");
            // TODO: Click on "Minhas comunicações" if not active? 
            // For now assuming we land on the right page as per dump.
        }

        // 2 & 3. Skip filling (Pre-filled by system)
        console.log("[PDPJ] Search fields are pre-filled. Skipping input typing...");

        // 4. Click Search
        console.log("[PDPJ] Clicking 'Buscar'...");
        // Use CSS selector to find the button
        try {
            await page.waitForSelector('.box-search-filter-buttons button.mat-primary', { timeout: 5000 });
            await page.click('.box-search-filter-buttons button.mat-primary');
        } catch (e) {
            console.error("[PDPJ] Search button not found using CSS selector:", e.message);
        }

        // 5. Wait for results
        console.log("[PDPJ] Waiting for results table or empty message...");
        await new Promise(r => setTimeout(r, 4000)); // Wait for request

        // Check for results
        const rows = await page.$$('mat-row');
        console.log(`[PDPJ] Found ${rows.length} rows.`);

        const results = [];
        for (const row of rows) {
            try {
                // Extract data from columns
                // Helper to get text from a cell
                const getText = async (selector) => {
                    const el = await row.$(selector);
                    return el ? await page.evaluate(e => e.innerText.trim(), el) : '';
                };

                const processNumber = await getText('.mat-column-numeroprocessocommascara');
                const court = await getText('.mat-column-siglaTribunal');
                const type = await getText('.mat-column-tipoComunicacao');
                const date = await getText('.mat-column-datadisponibilizacao');
                const classType = await getText('.mat-column-nomeClasse');

                // Click "Visualizar Detalhes" (usually an eye icon or button)
                // We utilize the row element itself to find the button within it
                const detailsBtn = await row.$('button[mattooltip="Visualizar Detalhes"], button[aria-label="Visualizar Detalhes"], .mat-column-acoes button');

                let fullContent = `Tipo: ${type} | Classe: ${classType} | Tribunal: ${court}`; // Fallback

                if (detailsBtn) {
                    try {
                        await detailsBtn.click();
                        // Wait for dialog
                        await page.waitForSelector('mat-dialog-container', { timeout: 3000 });

                        // Extract content from dialog
                        // Assuming content is in a specific container or just grab all text
                        fullContent = await page.$eval('mat-dialog-container', el => el.innerText);

                        // Close dialog (Escape or Click Close)
                        await page.keyboard.press('Escape');
                        await new Promise(r => setTimeout(r, 500)); // Wait for close
                    } catch (e) {
                        console.log(`[PDPJ] Could not extract details for ${processNumber}: ${e.message}`);
                    }
                }

                const content = fullContent;

                if (processNumber) {
                    const idString = `${processNumber}-${date}-${type}-${court}`;
                    const id = crypto.createHash('sha256').update(idString).digest('hex');

                    results.push({
                        id: id,
                        process_number: processNumber,
                        publication_date: date,
                        content: content,
                        court: court,
                        status: 'pending'
                    });
                }
            } catch (err) {
                console.error("Error extracting row:", err);
            }
        }

        console.log(`[PDPJ] Extracted ${results.length} publications.`);
        return results;

    } catch (error) {
        console.error("[PDPJ Scraper] Error:", error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapePDPJ };
