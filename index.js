const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

var url = "https://www.youtube.com/watch?v=Po5Zy5GUAUY"

async function run() {
    const browser = await puppeteer.launch({
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--no-sandbox', '--disable-gpu'
            // '--disable-dev-shm-usage',
        ],
        ignoreDefaultArgs: ['--mute-audio'],
        headless: true,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await Promise.all([
        await page.click('button.ytp-play-button'),
    ]);
    var cmd = "ffmpeg"
    //mac os
    // var args = [
    //     "-f",
    //     "avfoundation",
    //     "-i",
    //     ":1",
    //     "output.avi"
    // ];
    // linus os
    var args = [
        "-f",
        "alsa",
        "-ac",
        "2",
        "-i",
        "-hw:0",
        "output.avi"
    ];
    var proc = await spawn(cmd, args);
    console.log("proc", proc);
    proc.stdout.on('data', function (data) {
        console.log(data);
    });
    await page.waitFor(21000);
    console.log("completed")
    spawn("killall", ["ffmpeg"])

    browser.close();
}
run();
