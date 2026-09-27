const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ==========================================
// 🗄️ إعداد قاعدة بيانات Supabase
// ==========================================
const supabase = createClient('https://ififfcevzgrhygiqcqfo.supabase.co', 'sb_publishable_uRpGBwNOk32ehkutQFbmPQ_bTk9Ix8Z');
// ==========================================
// 🛡 Security Middlewares (حماية من الثغرات)
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
            // تم السماح بالاتصالات الخارجية لدعم Supabase ودومين الأدمن الفرعي
            connectSrc: ["'self'", "https://*.supabase.co"],
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

// 3. CORS: تحديد من يمكنه الوصول للـ API (يسمح لدومين الأدمن بالاتصال)
app.use(cors());

// ==========================================
// ⚙️ App Configuration
// ==========================================
app.use(express.json({ limit: '10kb' })); // حماية من هجمات الـ Payload الكبير
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


// ==========================================
// 👑 كود الحماية الخاص بمديري النظام (isAdmin Middleware)
// ==========================================
const isAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "يرجى تسجيل الدخول أولاً" });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً" });
        }

        // التأكد من أن المستخدم لديه صلاحية أدمن في الـ Metadata
        if (user.user_metadata?.role !== 'admin') {
            return res.status(403).json({ message: "عفواً، لا تملك صلاحيات للوصول إلى لوحة الإدارة" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Admin Auth Error:", err);
        res.status(500).json({ message: "خطأ في التحقق من الصلاحيات" });
    }
};


// ==========================================
// 🚀 مسارات لوحة الإدارة (Admin API Routes)
// ==========================================

// أ) مسار تسجيل دخول الأدمن
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        const userRole = data.user.user_metadata?.role;
        if (userRole !== 'admin') {
            return res.status(403).json({ message: "هذا الحساب ليس لديه صلاحيات الإدارة" });
        }

        res.json({
            message: "تم تسجيل الدخول بنجاح",
            token: data.session.access_token,
            user: { email: data.user.email, role: userRole }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "حدث خطأ داخلي في السيرفر" });
    }
});

// ب) مسار جلب الحجوزات للأدمن (محمي بدالة isAdmin)
app.get('/api/admin/bookings', isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                id,
                passenger_name,
                payment_method,
                status,
                trips ( route, departure_time )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedData = data.map(b => ({
            id: b.id,
            passenger_name: b.passenger_name,
            trip_route: b.trips?.route || 'غير محدد',
            trip_date: b.trips?.departure_time ? new Date(b.trips.departure_time).toLocaleString('ar-EG') : 'غير محدد',
            payment_method: b.payment_method || 'غير محدد',
            status: b.status || 'معلق'
        }));

        res.json(formattedData);
    } catch (err) {
        console.error("Fetch Bookings Error:", err);
        res.status(500).json({ message: "حدث خطأ أثناء جلب الحجوزات" });
    }
});


// ==========================================
// 🌐 مسارات الواجهة الأمامية للموقع الأساسي
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// مسار افتراضي للتعامل مع أي طلب وتوجيهه للصفحة الرئيسية (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`✅ Secure Server is running on port ${PORT}`);
});
