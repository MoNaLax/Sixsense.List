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
const MONGODB_URI = process.env.MONGODB_URI;
let db;

async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 10000
});
    await client.connect();
    db = client.db('sixsense');
    console.log('✅ MongoDB connected');

    const existing = await db.collection('settings').findOne({ _id: 'main' });
    if (!existing) {
      await db.collection('settings').insertOne({
        _id: 'main',
        gangName: "SIXSENSE",
        partners: ["Partner Gang A", "Partner Gang B", "Partner Gang C"],
        logo: "", homeBg: "", memberBg: "", homeMusic: "", memberMusic: "",
        adCard: { image: "", title: "SIXSENSE Official Page", content: "ติดตามข่าวสารและกิจกรรมของแก๊ง SIXSENSE", link: "https://facebook.com" },
        socialLinks: { facebook: "https://facebook.com", instagram: "https://instagram.com" }
      });
    }
  } catch (e) {
    console.error('❌ MongoDB error:', e.message);
  }
}

const readData = async () => {
  const settings = await db.collection('settings').findOne({ _id: 'main' });
  const members = await db.collection('members').find().toArray();
  return { ...settings, members };
};

// ============================================================
// FILE UPLOAD SETUP
// ============================================================
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const USE_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
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
    upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
    console.log('✅ Cloudinary enabled');
  } catch (e) {
    console.log('⚠️ Cloudinary error:', e.message);
    upload = null;
  }
}

if (!upload) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
  });
  upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
  console.log('📁 Local storage enabled');
}

const getFileUrl = (file) => (file.path && file.path.startsWith('http')) ? file.path : '/uploads/' + file.filename;

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

app.use((req, res, next) => {
  if (!db) return res.status(500).json({ error: 'DB not ready' });
  next();
});

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
 {
    req.session.authenticated = true;
    req.session.user = username;
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

// ============================================================
// DATA API
// ============================================================
app.get('/api/data', isAuthenticated, async (req, res) => {
  try { res.json(await readData()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/public-data', async (req, res) => {
  try { res.json(await readData()); } catch (e) { res.status(500).json({ error: e.message }); }
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
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// UPLOAD API
// ============================================================
app.post('/api/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
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
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ success: true, url: getFileUrl(req.file) });
});

// ============================================================
// MEMBERS API
// ============================================================
app.get('/api/members', async (req, res) => {
  try { res.json(await db.collection('members').find().toArray()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/members', isAuthenticated, async (req, res) => {
  try {
    const member = { ...req.body, id: Date.now() };
    await db.collection('members').insertOne(member);
    res.json({ success: true, member });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/members/:id', isAuthenticated, async (req, res) => {
  try {
    await db.collection('members').updateOne({ id: parseInt(req.params.id) }, { $set: req.body });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/members/:id', isAuthenticated, async (req, res) => {
  try {
    await db.collection('members').deleteOne({ id: parseInt(req.params.id) });
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
