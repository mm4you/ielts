const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');
const tts = new EdgeTTS({
  voice: 'vi-VN-HoaiMyNeural', // Southern female
  lang: 'vi-VN'
});
tts.ttsPromise("Xin chào sếp! Giọng miền Nam nè.", "/tmp/test.mp3").then(() => {
  const buf = fs.readFileSync("/tmp/test.mp3");
  console.log("Success! Buffer size:", buf.length);
}).catch(console.error);
