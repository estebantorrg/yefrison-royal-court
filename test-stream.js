async function simulateStream() {
    const chunks = ["<thi", "nk>this is my tho", "ught process</t", "hink>Hello", " world", " this is ", "yefris."];
    
    let buffer = "";
    let isThinking = false;
    let checkThinkStarted = false;

    console.log("Starting stream simulation:");

    for (const chunk of chunks) {
        console.log(`\nIncoming chunk: '${chunk}'`);
        buffer += chunk;

        if (!checkThinkStarted) {
            if (buffer.includes("<think>")) {
                isThinking = true;
                checkThinkStarted = true;
            } else if (buffer.length > 10 && !buffer.includes("<")) {
                checkThinkStarted = true;
            }
        }

        if (isThinking) {
            if (buffer.includes("</think>")) {
                isThinking = false;
                buffer = buffer.substring(buffer.indexOf("</think>") + 8);
                if (buffer) {
                    console.log(`FLUSH (After think): '${buffer}'`);
                    buffer = "";
                }
            } else {
                console.log(`[Thinking...] Buffer: '${buffer}'`);
            }
        } else if (checkThinkStarted) {
            if (buffer) {
                console.log(`FLUSH: '${buffer}'`);
                buffer = "";
            }
        } else {
            console.log(`[Waiting to determine think state...] Buffer: '${buffer}'`);
        }
    }

    if (buffer && !isThinking) {
        console.log(`FINAL FLUSH: '${buffer}'`);
    }
}

simulateStream();
