const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MONGODB
// ============================================================
let db;

async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      family: 4
    });
    await client.connect();
    db = client.db('sixsense');
    console.log('✅ MongoDB connected');
    const existing = await db.collection('settings').findOne({ _id: 'main' });
    if (!existing) {
      await db.collection('settings').insertOne({
        _id: 'main',
        gangName: "SIXSENSE",
        partners: ["FivedoubleEight", "Sabudbob", "Konami", "Rynthalis"],
        logo: "", homeBg: "", memberBg: "", homeMusic: "", memberMusic: "",
        adCard: {
          image: "",
          title: "SIXSENSE Official Page",
          content: "ติดตามข่าวสารและกิจกรรมของแก๊ง SIXSENSE ได้ที่เพจเฟสบุ๊กของเรา",
          link: "https://www.facebook.com/profile.php?id=61560960581580"
        },
        socialLinks: {
          facebook: "https://www.facebook.com/profile.php?id=61560960581580",
          instagram: ""
        }
      });
      console.log('✅ Default settings created');
    }
  } catch (e) {
    console.error('❌ MongoDB error:', e.message);
    process.exit(1);
  }
}

const getFullData = async () => {
  const settings = await db.collection('settings').findOne({ _id: 'main' });
  const members = await db.collection('members').find().sort({ order: 1, id: 1 }).toArray();
  return { ...settings, members };
};

// ============================================================
// FILE UPLOAD
// ============================================================
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const USE_CLOUDINARY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let upload;

if (USE_CLOUDINARY) {
  try {
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    const storage = new CloudinaryStorage({
      cloudinary,
      params: (req, file) => ({
        folder: 'sixsense',
        resource_type: file.mimetype.startsWith('audio') ? 'video' : 'auto',
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`
      })
    });
    upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
    console.log('✅ Cloudinary enabled');
  } catch (e) {
    console.log('⚠️ Cloudinary error: ' + e.message + ' — using local storage');
    upload = null;
  }
}

if (!upload) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
    }
  });
  upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
  console.log('📁 Local storage enabled');
}

const getFileUrl = (file) =>
  (file.path && file.path.startsWith('http')) ? file.path : '/uploads/' + file.filename;

// ============================================================
// MIDDLEWARE
// ============================================================
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'sixsense-secret-2024',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'ไฟล์ใหญ่เกินไป (max 50MB)' });
  }
  res.status(500).json({ error: err.message });
});

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sixsense123';

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
};
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/login');
};

// ============================================================
// AUTH
// ============================================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Required' });
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    req.session.user = username;
    return res.json({ success: true, message: 'Login successful' });
  }
  return res.status(401).json({ error: 'Invalid username or password' });
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

// ============================================================
// DATA API
// ============================================================
app.get('/api/data', isAuthenticated, async (req, res) => {
  try { res.json(await getFullData()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/public-data', async (req, res) => {
  try { res.json(await getFullData()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/data', isAuthenticated, async (req, res) => {
  try {
    if (!req.body || !req.body.members) return res.status(400).json({ error: 'Invalid data' });
    const ops = req.body.members.map((m, i) =>
      db.collection('members').updateOne({ id: m.id }, { $set: { order: i } })
    );
    await Promise.all(ops);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings', isAuthenticated, async (req, res) => {
  try {
    const { gangName, partners, adCard, socialLinks } = req.body;
    const update = {};
    if (gangName !== undefined) update.gangName = gangName;
    if (partners !== undefined) update.partners = partners;
    if (adCard !== undefined) update.adCard = adCard;
    if (socialLinks !== undefined) update.socialLinks = socialLinks;
    await db.collection('settings').updateOne({ _id: 'main' }, { $set: update });
    res.json({ success: true, data: await getFullData() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// UPLOAD API
// ============================================================
app.post('/api/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const url = getFileUrl(req.file);
    const { type } = req.body;
    const update = {};
    if (type === 'logo') update.logo = url;
    else if (type === 'homeBg') update.homeBg = url;
    else if (type === 'memberBg') update.memberBg = url;
    else if (type === 'homeMusic') update.homeMusic = url;
    else if (type === 'memberMusic') update.memberMusic = url;
    else if (type === 'adImage') update['adCard.image'] = url;
    if (Object.keys(update).length) {
      await db.collection('settings').updateOne({ _id: 'main' }, { $set: update });
    }
    res.json({ success: true, url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/upload/member', isAuthenticated, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ success: true, url: getFileUrl(req.file) });
});

// ============================================================
// MEMBERS API
// ============================================================
app.get('/api/members', async (req, res) => {
  try {
    res.json(await db.collection('members').find().sort({ order: 1, id: 1 }).toArray());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/members', isAuthenticated, async (req, res) => {
  try {
    const count = await db.collection('members').countDocuments();
    const member = { ...req.body, id: Date.now(), order: count };
    await db.collection('members').insertOne(member);
    res.json({ success: true, member });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/members/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id) || req.params.id;
    await db.collection('members').updateOne(
      { $or: [{ id: id }, { id: req.params.id }] },
      { $set: req.body }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/members/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id) || req.params.id;
    await db.collection('members').deleteOne({ $or: [{ id: id }, { id: req.params.id }] });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/members/:id/moveup', isAuthenticated, async (req, res) => {
  try {
    const members = await db.collection('members').find().sort({ order: 1, id: 1 }).toArray();
    const id = parseInt(req.params.id) || req.params.id;
    const idx = members.findIndex(m => m.id == id);
    if (idx <= 0) return res.status(400).json({ error: 'Cannot move up' });
    await db.collection('members').updateOne({ id: members[idx].id }, { $set: { order: idx - 1 } });
    await db.collection('members').updateOne({ id: members[idx - 1].id }, { $set: { order: idx } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/members/:id/movedown', isAuthenticated, async (req, res) => {
  try {
    const members = await db.collection('members').find().sort({ order: 1, id: 1 }).toArray();
    const id = parseInt(req.params.id) || req.params.id;
    const idx = members.findIndex(m => m.id == id);
    if (idx < 0 || idx >= members.length - 1) return res.status(400).json({ error: 'Cannot move down' });
    await db.collection('members').updateOne({ id: members[idx].id }, { $set: { order: idx + 1 } });
    await db.collection('members').updateOne({ id: members[idx + 1].id }, { $set: { order: idx } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/members/:id/move-to/:position', isAuthenticated, async (req, res) => {
  try {
    const members = await db.collection('members').find().sort({ order: 1, id: 1 }).toArray();
    const id = parseInt(req.params.id) || req.params.id;
    const position = parseInt(req.params.position);
    const idx = members.findIndex(m => m.id == id);
    if (idx === -1 || position < 0 || position >= members.length) {
      return res.status(400).json({ error: 'Invalid position' });
    }
    const [member] = members.splice(idx, 1);
    members.splice(position, 0, member);
    await Promise.all(members.map((m, i) =>
      db.collection('members').updateOne({ id: m.id }, { $set: { order: i } })
    ));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// PAGES
// ============================================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/members', (req, res) => res.sendFile(path.join(__dirname, 'public', 'members.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/admin', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🎮 SIXSENSE running at http://localhost:${PORT}`));
});
