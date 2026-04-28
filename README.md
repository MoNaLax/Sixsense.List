# 🎮 SIXSENSE Gang Roster Web App

เว็บแอปสำหรับเช็ครายชื่อสมาชิกแก๊ง SIXSENSE พร้อมระบบจัดการสมาชิก, เพลงประจำหน้า, Wallpaper แบบ Custom และอื่นๆ

---

## 🚀 Deploy ขึ้น Render.com (ฟรี, public ตลอด)

### ขั้นตอน:

**1. Push โค้ดขึ้น GitHub**
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sixsense.git
git push -u origin main
```

**2. สร้าง Web Service บน Render.com**
1. ไปที่ [render.com](https://render.com) → สมัครฟรี
2. กด **New → Web Service**
3. เชื่อม GitHub repo ของคุณ
4. ตั้งค่า:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

**3. ตั้งค่า Environment Variables บน Render**

ใน Render Dashboard → Environment tab ใส่:
| Key | Value |
|-----|-------|
| `ADMIN_USERNAME` | ชื่อ admin ที่ต้องการ |
| `ADMIN_PASSWORD` | รหัสผ่านที่ต้องการ |
| `SESSION_SECRET` | random string ยาวๆ เช่น `abc123xyz...` |
| `NODE_ENV` | `production` |

**4. (ไม่บังคับ) Cloudinary สำหรับเก็บไฟล์ถาวร**

บน Render free tier ไฟล์ที่ upload จะหายเมื่อ restart ถ้าต้องการให้ถาวรให้:
1. สมัครฟรีที่ [cloudinary.com](https://cloudinary.com)
2. เพิ่ม env vars:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

**5. (ไม่บังคับ) Auto-deploy เมื่อ push GitHub**

1. ใน Render → Settings → Deploy Hook → copy URL
2. ใน GitHub repo → Settings → Secrets → Actions
3. เพิ่ม secret ชื่อ `RENDER_DEPLOY_HOOK_URL` ใส่ URL จาก Render
4. ทีนี้ทุกครั้ง push main → Render จะ deploy อัตโนมัติ

---

## ✨ Features

- **Homepage** — ชื่อแก๊ง, โลโก้หมุน, Partners, Social links
- **Members Page** — Founders / Leaders / Members พร้อมค้นหา
- **Music Player** — เพลงประจำแต่ละหน้า
- **Wallpaper** — เปลี่ยนพื้นหลังผ่าน Admin
- **Ad Card Modal** — Pop-up เมื่อเข้า Homepage
- **Admin Panel** — จัดการทุกอย่างผ่าน `/admin`
- **Responsive** — Mobile, Tablet, Desktop

---

## 🔐 Default Login

- Username: `admin`
- Password: `sixsense123`

**⚠️ อย่าลืมเปลี่ยนรหัสผ่านใน Environment Variables ก่อน deploy!**
