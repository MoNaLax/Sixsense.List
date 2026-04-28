document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetch('/api/public-data').then(r => r.json());

  // Set background
  setBg(data.homeBg);

  // Gang name
  const nameEl = document.getElementById('gang-name');
  if (nameEl) { nameEl.textContent = data.gangName; nameEl.setAttribute('data-text', data.gangName); }

  // Partners
  const partnersRow = document.getElementById('partners-row');
  if (partnersRow && data.partners?.length) {
    partnersRow.innerHTML = `<div class="partner-label">◈ Partners ◈</div>` +
      data.partners.map(p => `<span class="partner-tag">${p}</span>`).join('');
  }

  // Logo
  if (data.logo) {
    const inner = document.getElementById('logo-inner');
    if (inner) inner.innerHTML = `<img src="${data.logo}" alt="SIXSENSE Logo">`;
  }

  // Social float
  renderSocialFloat(data.socialLinks?.facebook, data.socialLinks?.instagram);

  // Music
  const player = new MusicPlayer(data.homeMusic);

  // Ad modal (delay 1.5s)
  setTimeout(() => { if (data.adCard?.title) showAdModal(data.adCard); }, 1500);
});
