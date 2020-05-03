const puppeteer = require('puppeteer');

let storeBuffer = []
var input = undefined;
var processor = undefined;
var liveStream = undefined;
var audioCtx = undefined;


var url = "https://www.youtube.com/watch?v=Po5Zy5GUAUY"

async function run() {
    const browser = await puppeteer.launch({
        headless: false,
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
    await page.evaluate(async (audioCtx, input, processor, liveStream) => {
        var stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            audioConstraints: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    echoCancellation: true
                }
            }
        });
        liveStream = stream;
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        if (source.context.createScriptProcessor == null) {
            source.context.createScriptProcessor = source.context.createJavaScriptNode;
        }
        input = source.context.createGain();
        source.connect(input);
        var buffer = [];
        processor = source.context.createScriptProcessor(
            1024, 2,
            2);
        input.connect(processor);
        processor.connect(source.context.destination);
        processor.onaudioprocess = async function (event) {
            for (var ch = 0; ch < 2; ++ch) {
                buffer[ch] = event.inputBuffer.getChannelData(ch);
            }
            await window.recordBuffer(buffer)
        }

        setTimeout(async () => {
            alert("timeout")
            console.log("input", input, processor, audioCtx)
            input.disconnect();
            processor.disconnect();
            delete processor;
            audioCtx.close();
            liveStream.getAudioTracks()[0].stop();
            var storedBuffer = await window.getBuffer()
            // console.log("storedBuffer", storedBuffer[0])
            var sampleRate = "44100";
            var numChannels = 2;
            var numSamples = 0;
            var dataViews = [];
            var min = Math.min,
                max = Math.max;
            while (storedBuffer.length > 0) {
                var buf = storedBuffer.shift();
                var len = Object.keys(buf[0]).length,
                    nCh = numChannels,
                    view = new DataView(new ArrayBuffer(len * nCh * 2)),
                    offset = 0;
                for (var i = 0; i < len; ++i) {
                    for (var ch = 0; ch < nCh; ++ch) {
                        var x = buf[ch][i] * 0x7fff;
                        view.setInt16(offset, x < 0 ? max(x, -0x8000) : min(x, 0x7fff), true);
                        offset += 2;
                    }
                }
                dataViews.push(view);
                numSamples += len;
            }


            var dataSize = numChannels * numSamples * 2,
                view = new DataView(new ArrayBuffer(44));
            // setString(view, 0, 'RIFF');
            var str = 'RIFF';
            var offset = 0
            var len = str.length;
            for (var i = 0; i < len; ++i) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
            view.setUint32(4, 36 + dataSize, true);
            // setString(view, 8, 'WAVE');
            // setString(view, 12, 'fmt ');
            var str = 'WAVE';
            var offset = 8
            var len = str.length;
            for (var i = 0; i < len; ++i) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
            var str = 'fmt';
            var offset = 12
            var len = str.length;
            for (var i = 0; i < len; ++i) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 4, true);
            view.setUint16(32, numChannels * 2, true);
            view.setUint16(34, 16, true);
            // setString(view, 36, 'data');
            var str = 'data';
            var offset = 36
            var len = str.length;
            for (var i = 0; i < len; ++i) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
            view.setUint32(40, dataSize, true);
            dataViews.unshift(view);
            console.log("dataViews", dataViews)
            var blob = new Blob(dataViews, { type: 'audio/wav' });
            console.log("blob", blob)
            var audioUrl = window.URL.createObjectURL(blob);
            var appendExtension = "blob:chrome-extension://baphaepngminihgdognaabkgflmkbfdl"
            audioUrl = `${appendExtension}${audioUrl.split(".com")[1]}`
            // "blob:https://www.youtube.com/85faf0f8-ee45-4e05-b8cd-4b5f58350f16".split(".com")
            console.log("audioURL", audioUrl)
            const link = document.createElement("a");
            link.setAttribute("href", audioUrl);
            link.setAttribute("download", "audio")
            document.body.appendChild(link);
            link.click()

        }, 10000)


    }, audioCtx, input, processor, liveStream)

    await page.waitFor(10000);

    await page.screenshot({ path: 'screenshot.png' });
    // browser.close();

}
run();
