// ─── MUSIC PLAYER ────────────────────────────────────────────────────────────
class MusicPlayer {
  constructor(audioSrc = null) {
    this.audio = new Audio();
    this.volume = 0.6;
    this.playing = false;
    this.audio.loop = true;
    this.audio.volume = this.volume;
    if (audioSrc) this.setSource(audioSrc);
    this.render();
    this.bindEvents();
    this.audio.play().then(() => {
      this.playing = true;
      const toggle = document.getElementById('music-toggle');
      if (toggle) {
        toggle.innerHTML = '<i class="fas fa-pause"></i>';
        toggle.classList.add('playing');
      }
    }).catch(()=>{});
  }

  setSource(src) {
    if (!src) return;
    this.audio.src = src;
  }

  render() {
    const el = document.getElementById('music-player');
    if (!el) return;
    el.innerHTML = `
      <div class="volume-control" id="vol-control">
        <button class="vol-btn" id="vol-up"><i class="fas fa-volume-up"></i></button>
        <div class="vol-display" id="vol-disp">${Math.round(this.volume*100)}%</div>
        <button class="vol-btn" id="vol-down"><i class="fas fa-volume-down"></i></button>
      </div>
      <button class="music-toggle" id="music-toggle"><i class="fas fa-music"></i></button>
    `;
  }

  bindEvents() {
    const toggle = document.getElementById('music-toggle');
    const volUp = document.getElementById('vol-up');
    const volDown = document.getElementById('vol-down');
    const volControl = document.getElementById('vol-control');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      if (this.playing) {
        this.audio.pause();
        this.playing = false;
        toggle.innerHTML = '<i class="fas fa-music"></i>';
        toggle.classList.remove('playing');
      } else {
        this.audio.play().catch(()=>{});
        this.playing = true;
        toggle.innerHTML = '<i class="fas fa-pause"></i>';
        toggle.classList.add('playing');
      }
      volControl.classList.toggle('show');
    });
    volUp?.addEventListener('click', (e) => { e.stopPropagation(); this.setVolume(Math.min(1, this.volume + 0.1)); });
    volDown?.addEventListener('click', (e) => { e.stopPropagation(); this.setVolume(Math.max(0, this.volume - 0.1)); });
  }

  setVolume(v) {
    this.volume = v;
    this.audio.volume = v;
    const d = document.getElementById('vol-disp');
    if (d) d.textContent = Math.round(v * 100) + '%';
  }
}

// ─── SOCIAL FLOAT ────────────────────────────────────────────────────────────
function renderSocialFloat(fb, ig) {
  const el = document.getElementById('social-float');
  if (!el) return;
  let html = '';
  if (fb) html += `<a href="${fb}" target="_blank" title="Facebook"><i class="fab fa-facebook-f"></i><span>Facebook</span></a>`;
  if (ig) html += `<a href="${ig}" target="_blank" title="Instagram"><i class="fab fa-instagram"></i><span>Instagram</span></a>`;
  el.innerHTML = html;
}

// ─── BACKGROUND ──────────────────────────────────────────────────────────────
function setBg(url) {
  const el = document.getElementById('bg-layer');
  if (el && url) el.style.backgroundImage = `url('${url}')`;
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function showToast(msg, duration = 2500) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, duration);
}

// ─── API ─────────────────────────────────────────────────────────────────────
const API = {
  async getData() { return fetch('/api/data').then(r => r.json()); },
  async uploadFile(file, type) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    return fetch('/api/upload', { method: 'POST', body: fd }).then(r => r.json());
  }
};
