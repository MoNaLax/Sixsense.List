let adminData = {};

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  try {
    const dataRes = await fetch('/api/data');
    if (dataRes.status === 401) {
      window.location.href = '/login';
      return;
    }
    adminData = await dataRes.json();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
  
  fillSettings();
  renderAdminMembers();

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Image preview on file change
  setupPreview('ad-image-file', 'ad-image-preview');
  setupPreview('m-image-file', 'm-image-preview');
  setupPreview('logo-file', 'logo-preview');
  setupPreview('home-bg-file', 'home-bg-preview');
  setupPreview('member-bg-file', 'member-bg-preview');
});

function logout() {
  window.location.href = '/logout';
}

function setupPreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    if (file.type.startsWith('image') || file.name.endsWith('.gif')) {
      const reader = new FileReader();
      reader.onload = e => { preview.innerHTML = `<img src="${e.target.result}" alt="preview">`; };
      reader.readAsDataURL(file);
    }
  });
}

function fillSettings() {
  document.getElementById('s-gangname').value = adminData.gangName || '';
  document.getElementById('s-partners').value = (adminData.partners || []).join(', ');
  document.getElementById('s-fb').value = adminData.socialLinks?.facebook || '';
  document.getElementById('s-ig').value = adminData.socialLinks?.instagram || '';
  document.getElementById('ad-title').value = adminData.adCard?.title || '';
  document.getElementById('ad-content').value = adminData.adCard?.content || '';
  document.getElementById('ad-link').value = adminData.adCard?.link || '';
  if (adminData.adCard?.image) {
    document.getElementById('ad-image-preview').innerHTML = `<img src="${adminData.adCard.image}">`;
  }
}

async function saveSettings() {
  const body = {
    gangName: document.getElementById('s-gangname').value.trim(),
    partners: document.getElementById('s-partners').value.split(',').map(s => s.trim()).filter(Boolean),
    socialLinks: {
      facebook: document.getElementById('s-fb').value.trim(),
      instagram: document.getElementById('s-ig').value.trim()
    }
  };
  
async function uploadMedia

async function saveAd() {
  let imageUrl = adminData.adCard?.image || '';

  const imgFile = document.getElementById('ad-image-file').files[0];
  if (imgFile) {
    const fd = new FormData();
    fd.append('file', imgFile);
    fd.append('type', 'adImage');
    const r = await fetch('/api/upload', { method: 'POST', body: fd }).then(r => r.json());
    if (!r.success) return showToast('❌ อัปโหลดรูป Ad ล้มเหลว');
    imageUrl = r.url;
  }

  const body = {
    adCard: {
      image: imageUrl,
      title: document.getElementById('ad-title').value.trim(),
      content: document.getElementById('ad-content').value.trim(),
      link: document.getElementById('ad-link').value.trim()
    }
  };
  const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if ((await res.json()).success) showToast('✅ บันทึก Ad Card แล้ว');
}
  const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if ((await res.json()).success) showToast('✅ บันทึก Ad Card แล้ว');
}

async function uploadMedia(type, inputId, previewId) {
  const file = document.getElementById(inputId)?.files[0];
  if (!file) return showToast('⚠️ กรุณาเลือกไฟล์ก่อน');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('type', type);
  const r = await fetch('/api/upload', { method: 'POST', body: fd }).then(r => r.json());
  if (r.success) {
    showToast('✅ อัปโหลดสำเร็จ');
    if (previewId && r.url) {
      document.getElementById(previewId).innerHTML = `<img src="${r.url}">`;
    }
  } else {
    showToast('❌ อัปโหลดล้มเหลว');
  }
}

async function saveMember() {
  const name = document.getElementById('m-name').value.trim();
  if (!name) return showToast('⚠️ กรุณากรอกชื่อสมาชิก');

  // Upload image if present
  const imgFile = document.getElementById('m-image-file').files[0];
  let imageUrl = document.getElementById('m-image-url').value;
  if (imgFile) {
    const fd = new FormData();
    fd.append('file', imgFile);
    const r = await fetch('/api/upload/member', { method: 'POST', body: fd }).then(r => r.json());
    if (r.success) imageUrl = r.url;
  }

  const editId = document.getElementById('edit-id').value;
  const member = {
    name,
    role: document.getElementById('m-role').value,
    facebook: document.getElementById('m-fb').value.trim(),
    instagram: document.getElementById('m-ig').value.trim(),
    bio: document.getElementById('m-bio').value.trim(),
    image: imageUrl
  };

  let res;
  if (editId) {
    res = await fetch(`/api/members/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(member) });
  } else {
    res = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(member) });
  }
  const data = await res.json();
  if (data.success) {
    showToast(editId ? '✅ แก้ไขสมาชิกแล้ว' : '✅ เพิ่มสมาชิกแล้ว');
    clearMemberForm();
    adminData = await fetch('/api/data').then(r => r.json());
    renderAdminMembers();
  }
}

function clearMemberForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('m-name').value = '';
  document.getElementById('m-role').value = 'members';
  document.getElementById('m-fb').value = '';
  document.getElementById('m-ig').value = '';
  document.getElementById('m-bio').value = '';
  document.getElementById('m-image-file').value = '';
  document.getElementById('m-image-url').value = '';
  document.getElementById('m-image-preview').innerHTML = '';
}

function editMember(id) {
  const m = adminData.members.find(x => x.id === id);
  if (!m) return;
  document.getElementById('edit-id').value = m.id;
  document.getElementById('m-name').value = m.name;
  document.getElementById('m-role').value = m.role;
  document.getElementById('m-fb').value = m.facebook || '';
  document.getElementById('m-ig').value = m.instagram || '';
  document.getElementById('m-bio').value = m.bio || '';
  document.getElementById('m-image-url').value = m.image || '';
  if (m.image) document.getElementById('m-image-preview').innerHTML = `<img src="${m.image}">`;
  document.querySelector('[data-tab="members"]').click();
  window.scrollTo({ top: 300, behavior: 'smooth' });
  showToast('📝 กำลังแก้ไข: ' + m.name);
}

async function deleteMember(id) {
  if (!confirm('ลบสมาชิกนี้?')) return;
  const res = await fetch(`/api/members/${id}`, { method: 'DELETE' }).then(r => r.json());
  if (res.success) {
    showToast('🗑 ลบสมาชิกแล้ว');
    adminData = await fetch('/api/data').then(r => r.json());
    renderAdminMembers();
  }
}

function renderAdminMembers() {
  const list = document.getElementById('admin-member-list');
  if (!list) return;
  const members = adminData.members || [];
  if (!members.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">ยังไม่มีสมาชิก</p>'; return; }

  const roleLabel = {
    founders: '<i class="fas fa-crown"></i> Founder',
    leaders: '<i class="fas fa-shield-alt"></i> Leader',
    supports: '<i class="fas fa-hands-helping"></i> Support',
    members: '<i class="fas fa-gamepad"></i> Member'
  };
  list.innerHTML = members.map(m => `
    <div class="admin-member-item">
      ${m.image ? `<img src="${m.image}" class="admin-member-avatar">` : `<div class="admin-member-avatar" style="display:flex;align-items:center;justify-content:center;background:var(--dark2);font-size:1.2rem">👤</div>`}
      <div class="admin-member-info">
        <div class="admin-member-name">${m.name}</div>
        <div class="admin-member-role">${roleLabel[m.role] || m.role}</div>
      </div>
      <div class="admin-member-actions">
        <button class="btn btn-ghost btn-sm" onclick="editMember(${m.id})"><i class="fas fa-pen"></i> แก้ไข</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteMember(${m.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}
