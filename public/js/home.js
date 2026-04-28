document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetch('/api/public-data').then(r => r.json());
  setBg(data.homeBg);
  const nameEl = document.getElementById('gang-name');
  if (nameEl) { nameEl.textContent = data.gangName; nameEl.setAttribute('data-text', data.gangName); }
  const partnersRow = document.getElementById('partners-row');
  if (partnersRow && data.partners?.length) {
    partnersRow.innerHTML = `<div class="partner-label">◈ Partners ◈</div>` +
      data.partners.map(p => `<span class="partner-tag">${p}</span>`).join('');
  }
  if (data.logo) {
    const inner = document.getElementById('logo-inner');
    if (inner) inner.innerHTML = `<img src="${data.logo}" alt="SIXSENSE Logo">`;
  }
  renderSocialFloat(data.socialLinks?.facebook, data.socialLinks?.instagram);
  new MusicPlayer(data.homeMusic);
  setTimeout(() => { if (data.adCard?.title) showAdDialog(data.adCard); }, 1500);
});

function showAdDialog(ad) {
  const dialog = document.getElementById('ad-dialog');
  const content = document.getElementById('ad-card-content');
  if (!dialog || !content) return;
  content.innerHTML = `
    <button class="ad-close" onclick="document.getElementById('ad-dialog').close()"><i class="fas fa-times"></i></button>
    ${ad.image ? `<img src="${ad.image}" alt="ad" class="ad-image">` : `<div class="ad-image-placeholder">🎮</div>`}
    <div class="ad-body">
      <div class="ad-label">ติดตามเรา</div>
      <div class="ad-title">${ad.title}</div>
      <div class="ad-content">${ad.content || ''}</div>
      ${ad.link ? `<a href="${ad.link}" target="_blank" class="btn btn-primary" style="width:100%;justify-content:center">ไปที่เพจ →</a>` : ''}
    </div>
  `;
  dialog.showModal();
  dialog.addEventListener('click', (e) => {
    const rect = content.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      dialog.close();
    }
  });
}
