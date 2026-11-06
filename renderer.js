const chat = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const media = document.getElementById('media');
const mediaImg = document.getElementById('mediaImg');
const mediaVid = document.getElementById('mediaVid');
const closeMedia = document.getElementById('closeMedia');
const baseEl = document.getElementById('base');
const keyEl = document.getElementById('key');

function append(who, text) {
  const d = document.createElement('div');
  d.className = 'msg ' + (who === 'You' ? 'you' : 'hermes');
  d.innerHTML = '<b>' + who + ':</b> ' + text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

async function sendText(text) {
  if (!text.trim()) return;
  input.value = '';
  append('You', text);
  const base = baseEl.value.trim();
  const key = keyEl.value.trim();
  try {
    const res = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'hermes', messages: [
        { role: 'system', content: 'You are Hermes on the desktop. Keep replies short. If asked to draw/image, end with MEDIA_URL: <url>. If video, end with MEDIA_URL: <url>.' },
        { role: 'user', content: text }
      ], max_tokens: 500 })
    });
    const data = await res.json();
    const reply = data.choices[0].message.content;
    const mediaUrl = data.media_url || (reply.match(/MEDIA_URL:\s*(\S+)/) || [])[1];
    const clean = reply.replace(/MEDIA_URL:\s*\S+/g, '').trim() || 'Done.';
    append('Hermes', clean);
    if (mediaUrl) showMedia(mediaUrl, mediaUrl.includes('.mp4') ? 'video' : 'image');
  } catch (e) {
    append('Hermes', 'Error: ' + e.message);
  }
}

function showMedia(url, type) {
  media.style.display = 'flex';
  if (type === 'video') {
    mediaImg.style.display = 'none';
    mediaVid.style.display = 'block';
    mediaVid.src = url;
    mediaVid.play();
  } else {
    mediaVid.style.display = 'none';
    mediaImg.style.display = 'block';
    mediaImg.src = url;
  }
}
closeMedia.onclick = () => { media.style.display = 'none'; mediaVid.pause(); };

sendBtn.onclick = () => sendText(input.value);
input.addEventListener('keydown', e => { if (e.key === 'Enter') sendText(input.value); });

// Voice via Web Speech API
let rec = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.onresult = e => sendText(e.results[0][0].transcript);
  rec.onerror = e => append('Hermes', 'Speech error: ' + e.error);
}
micBtn.onclick = () => {
  if (!rec) { append('Hermes', 'Speech recognition not available'); return; }
  try { rec.start(); } catch (e) { append('Hermes', e.message); }
};

// TTS via Web Speech API
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[*#_`>]/g, '').slice(0, 400));
  window.speechSynthesis.speak(u);
}