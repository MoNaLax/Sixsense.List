let allMembers = [];
let gangData = {};

document.addEventListener('DOMContentLoaded', async () => {
  gangData = await fetch('/api/public-data').then(r => r.json());
  allMembers = gangData.members || [];

  // Set bg
  setBg(gangData.memberBg);

  // Gang name
  const nameEl = document.getElementById('gang-name');
  if (nameEl) { nameEl.textContent = gangData.gangName; nameEl.setAttribute('data-text', gangData.gangName); }

  // Social
  renderSocialFloat(gangData.socialLinks?.facebook, gangData.socialLinks?.instagram);

  // Music
  new MusicPlayer(gangData.memberMusic);

  // Render
  renderStats();
  renderAll(allMembers, '');

  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    renderAll(allMembers, e.target.value.trim());
  });

  // Modal close on overlay
  document.getElementById('member-modal').addEventListener('click', (e) => {
    if (e.target.id === 'member-modal') closeModal();
  });
});

function renderStats() {
  const counts = { founders: 0, leaders: 0, members: 0 };
  allMembers.forEach(m => { if (counts[m.role] !== undefined) counts[m.role]++; });
  document.getElementById('stat-founders').textContent = counts.founders;
  document.getElementById('stat-leaders').textContent = counts.leaders;
  document.getElementById('stat-members').textContent = counts.members;
}

function highlight(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}

function renderAll(members, query) {
  const q = query.toLowerCase();
  const filtered = q ? members.filter(m => m.name.toLowerCase().includes(q)) : members;

  const groups = { founders: [], leaders: [], members: [] };
  filtered.forEach(m => { if (groups[m.role]) groups[m.role].push(m); else groups.members.push(m); });

  const sectionVisible = { founders: false, leaders: false, members: false };

  ['founders', 'leaders', 'members'].forEach(role => {
    const grid = document.getElementById(`grid-${role}`);
    const section = document.getElementById(`section-${role}`);
    if (!grid || !section) return;

    if (groups[role].length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    sectionVisible[role] = true;
    grid.innerHTML = groups[role].map(m => memberCard(m, query)).join('');
    grid.querySelectorAll('.member-card').forEach(card => {
      card.addEventListener('click', () => openModal(parseInt(card.dataset.id)));
    });
  });

  const anyVisible = Object.values(sectionVisible).some(Boolean);
  document.getElementById('no-results').style.display = anyVisible ? 'none' : 'block';
}

function memberCard(m, query) {
  const roleClass = `role-${m.role}`;
  const roleLabel = { founders: 'Founder', leaders: 'Leader', members: 'Member' }[m.role] || m.role;
  const avatar = m.image
    ? `<img src="${m.image}" alt="${m.name}" class="member-avatar">`
    : `<div class="member-avatar-placeholder">👤</div>`;
  return `
    <div class="member-card" data-id="${m.id}">
      ${avatar}
      <div class="member-card-name">${highlight(m.name, query)}</div>
      <div class="member-card-role ${roleClass}">${roleLabel}</div>
      <div class="member-card-view">VIEW PROFILE →</div>
    </div>
  `;
}

function openModal(id) {
  const m = allMembers.find(x => x.id === id);
  if (!m) return;

  const roleClass = `role-${m.role}`;
  const roleLabel = { founders: '👑 FOUNDER', leaders: '⚔ LEADER', members: '🎮 MEMBER' }[m.role] || m.role;

const banner = m.image
  ? `
    <div class="modal-banner"><img src="${m.image}" class="modal-banner-img"></div>
  `
  : `<div class="modal-banner"></div>`;

const avatarImg = m.image
  ? `<img src="${m.image}" alt="${m.name}" class="modal-avatar">`
  : `<div class="modal-avatar-placeholder">👤</div>`;

  const links = [];
if (m.facebook) {
  links.push(`
    <a href="${m.facebook}" target="_blank" class="btn btn-ghost social-btn">
      <i class="fab fa-facebook-f"></i>
      <span>Facebook</span>
    </a>
  `);
}

if (m.instagram) {
  links.push(`
    <a href="${m.instagram}" target="_blank" class="btn btn-ghost social-btn">
      <i class="fab fa-instagram"></i>
      <span>Instagram</span>
    </a>
  `);
}

  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-banner id-photo-area">
      ${avatarImg}
    </div>
    <div class="modal-body">
      <div class="modal-name">${m.name}</div>
      <div class="modal-role-badge ${roleClass}">${roleLabel}</div>
      ${m.bio ? `<div class="modal-bio">${m.bio}</div>` : ''}
      ${links.length ? `<div class="modal-links">${links.join('')}</div>` : ''}
    </div>
  `;

  document.getElementById('member-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('member-modal').style.display = 'none';
  document.body.style.overflow = '';
}
