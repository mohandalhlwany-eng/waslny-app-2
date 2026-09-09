const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 🛡️ Security Middlewares (حماية من الثغرات)
// ==========================================

// 1. Helmet: تأمين الهيدرز الخاصة بالسيرفر لمنع ثغرات XSS و Clickjacking وغيرها
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://*"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// 2. Rate Limiting: حماية من هجمات الـ DDoS والـ Brute Force
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // الحد الأقصى 100 طلب من نفس الـ IP
    message: "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// 3. CORS: تحديد من يمكنه الوصول للـ API
app.use(cors());

// ==========================================
// ⚙️ App Configuration
// ==========================================
app.use(express.json({ limit: '10kb' })); // حماية من هجمات الـ Payload الكبير
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// تقديم ملفات الواجهة الأمامية
app.use(express.static(path.join(__dirname, 'public')));

// مسار افتراضي للتعامل مع أي طلب وتوجيهه للصفحة الرئيسية (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Secure Server is running on port ${PORT}`);
});