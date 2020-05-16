const puppeteer = require('puppeteer');

let storeBuffer = []
var input = undefined;
var processor = undefined;
var liveStream = undefined;
var audioCtx = undefined;


var url = "https://www.youtube.com/watch?v=Ke90Tje7VS0"

async function run() {
    const browser = await puppeteer.launch({
        args: [
            '--use-fake-ui-for-media-stream',
            "--no-sandbox"
        ],
        // ignoreDefaultArgs: ['--mute-audio'],
        headless: true,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await Promise.all([
        await page.click('button.ytp-play-button'),
    ]);

    await page.exposeFunction('getBuffer', buffer => {
        return storeBuffer
    });
    await page.exposeFunction('recordBuffer', buffer => {
        storeBuffer.push(buffer)
    });
    await page.evaluate(async () => {
        var options = {
            audioBitsPerSecond: 128000,
            mimeType: 'audio/webm'
        }
        var stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            audioConstraints: {
                mandatory: {
                    echoCancellation: true
                }
            }
        });
        liveStream = stream;
        var mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorder.start();
        setTimeout(() => {
            mediaRecorder.stop();
        }, 20000)
        mediaRecorder.ondataavailable = function (e) {
            console.log("e.data", e)
            var blob = e.data
            // var blob = new Blob([e.data], { 'type': 'audio/wav' });
            console.log("blob", blob)
            var audioUrl = window.URL.createObjectURL(blob);
            console.log("audioURL", audioUrl)
            const link = document.createElement("a");
            link.setAttribute("href", audioUrl);
            link.setAttribute("download", "audio")
            document.body.appendChild(link);
            link.click()
        }
    })
    await page.waitFor(21000);
    console.log("completeed")
    browser.close();

}
run();
