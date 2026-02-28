const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: node browser_bridge.js <json_command>');
        process.exit(1);
    }

    const command = JSON.parse(args[0]);
    const { action, url, selector, text, cookies, screenshotPath } = command;

    const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_PATH || 'chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-software-rasterizer'],
        headless: "new"
    });

    const page = await browser.newPage();

    // Set cookies if provided
    if (cookies && Array.isArray(cookies)) {
        await page.setCookie(...cookies);
    }

    try {
        let result = {};

        switch (action) {
            case 'goto':
                await page.goto(url, { waitUntil: 'networkidle2' });
                result.content = await page.content();
                break;
            case 'click':
                await page.goto(url, { waitUntil: 'networkidle2' });
                await page.click(selector);
                await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
                result.content = await page.content();
                break;
            case 'type':
                await page.goto(url, { waitUntil: 'networkidle2' });
                await page.type(selector, text);
                await page.keyboard.press('Enter');
                await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
                result.content = await page.content();
                break;
            case 'screenshot':
                await page.goto(url, { waitUntil: 'networkidle2' });
                await page.screenshot({ path: screenshotPath || 'screenshot.png', fullPage: true });
                result.message = "Screenshot saved";
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        console.log(JSON.stringify(result));
    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    } finally {
        await browser.close();
    }
}

run();
