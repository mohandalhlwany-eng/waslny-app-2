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
// 🗄 إعداد قاعدة بيانات Supabase
// ==========================================
const SUPABASE_URL = 'https://ififfcevzgrhygiqcqfo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmaWZmY2V2emdyaHlnaXFjcWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkzMjQ3MSwiZXhwIjoyMTA0NTA4NDcxfQ._dmfa-91RyRXBSQaN8Rr0xheuFFynnU43MI_kJfrl6I';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 🛡 Security Middlewares
// ==========================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://*"],
            connectSrc: ["'self'", "https://*.supabase.co"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(cors());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ==========================================
// 👑 كود الحماية (isAdmin Middleware)
// ==========================================
const isAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "يرجى تسجيل الدخول أولاً" });
        }

        const token = authHeader.split(' ')[1];
        
        // التوكن السري الخاص بالأدمن للوصول المباشر
        if (token === 'admin-secret-token-waslni-2026') {
            req.user = { email: 'mohandalhlwany@waslni.com', role: 'admin' };
            return next();
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ message: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجددا" });
        }

        const isAdminUser = (user.email === 'mohandalhlwany@waslni.com') || (user.user_metadata?.role === 'admin');
        if (!isAdminUser) {
            return res.status(403).json({ message: "عفواً، لا تملك صلاحيات الوصول إلى لوحة الإدارة" });
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
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt received for email:", email);
    
    // التحقق الصارم من البريد الإلكتروني وكلمة المرور المخصصة للأدمن
    if (email === 'mohandalhlwany@waslni.com' && password === '11223344556677889910101010') {
        return res.json({
            message: "تم تسجيل الدخول بنجاح",
            token: 'admin-secret-token-waslni-2026',
            user: { email: 'mohandalhlwany@waslni.com', role: 'admin' }
        });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error || !data.user) {
            console.error("Supabase Auth Error details:", error ? error.message : "بيانات غير صحيحة");
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        res.json({
            message: "تم تسجيل الدخول بنجاح",
            token: data.session.access_token,
            user: { email: data.user.email, role: 'admin' }
        });
    } catch (err) {
        console.error("Login Server Exception:", err);
        res.status(500).json({ message: "حدث خطأ داخلي في السيرفر" });
    }
});

app.get('/api/admin/bookings', isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedData = data.map(u => ({
            id: u.id,
            passenger_name: u.name || u.passenger_name || u.full_name || 'غير محدد',
            trip_route: u.route || u.trip_route || 'غير محدد',
            trip_date: u.created_at ? new Date(u.created_at).toLocaleString('ar-EG') : 'غير محدد',
            payment_method: u.payment_method || u.phone || 'غير محدد',
            status: u.status || 'معلق'
        }));

        res.json(formattedData);
    } catch (err) {
        console.error("Fetch Bookings Error:", err);
        res.status(500).json({ message: "حدث خطأ أثناء جلب الحجوزات" });
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Secure Server is running on port ${PORT}`);
});

// مسار التعديل
app.patch('/api/admin/bookings/:id/status', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        res.json({ message: "تم تحديث الحالة بنجاح", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "خطأ أثناء التحديث" });
    }
});

// مسار الحذف
app.delete('/api/admin/bookings/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: "تم الحذف بنجاح" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "خطأ أثناء الحذف" });
    }
});
