async function run() {
  const response = await fetch('https://yefris.pages.dev/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'what was the score of the last bayern munich game yefris?' })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.replace('data: ', '').trim();
        if (dataStr === '[DONE]') return;
        try {
          const data = JSON.parse(dataStr);
          if (data.type === 'metadata') {
            console.log(JSON.stringify(data, null, 2));
          } else {
            process.stdout.write(data.text);
          }
        } catch (e) {}
      }
    }
  }
}
run().catch(console.error);
