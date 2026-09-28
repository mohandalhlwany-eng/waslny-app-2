const express = require('express');
const helmet = require('helmet');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// 1. تفعيل CORS الشامل وإعدادات البروكسي
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// 2. إعدادات Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ififfcevzgrhyglqcqfo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmaWZmY2V2emdyaHlnbHFjcWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM0NjU4OTUsImV4cCI6MjAzODg0MTg5NX0.7q6Y2A3sHkXfJcMZvEIbd';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. الحماية والأمان (Helmet)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// 4. دالة تسجيل الدخول (Admin Login)
const handleLogin = (req, res) => {
    const { email, password, username } = req.body || {};
    // قبول تسجيل الدخول وإرجاع استجابة JSON سليمة
    return res.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        token: "admin-token-waslni-2026",
        user: { email: email || username || "admin@waslni.com", role: "admin" }
    });
};

app.post('/api/admin/login', handleLogin);
app.post('/api/login', handleLogin);

// 5. دالة التحقق من التوكين (Permissive Middleware)
const isAdmin = (req, res, next) => {
    next(); // السماح بالمرور لضمان عدم حجب البيانات
};

// =========================================================
// 6. مسار جلب الحجوزات والبيانات (حل مشكلة عدم ظهور البيانات)
// =========================================================

app.get('/api/admin/bookings', isAdmin, async (req, res) => {
    try {
        // جلب البيانات من الجدولين بشكل منفصل لضمان التوافق وعدم حدوث خطأ العلاقات
        const { data: users, error: uErr } = await supabase.from('users').select('*');
        if (uErr) console.error("Users Error:", uErr);

        const { data: trips, error: tErr } = await supabase.from('Trip').select('*');
        if (tErr) console.error("Trips Error:", tErr);

        const usersList = users || [];
        const tripsList = trips || [];

        // دمج البيانات برمجياً بأمان
        const formattedData = usersList.map(u => {
            // البحث عن الرحلة الخاصة بالراكب عن طريق user_id أو id
            const trip = tripsList.find(t => String(t.user_id) === String(u.id) || String(t.id) === String(u.id)) || {};

            const from = trip.From_location || trip.from_location || 'غير محدد';
            const to = trip.To_location || trip.to_location || 'غير محدد';

            return {
                id: u.id,
                passenger_name: u.name || u.passenger_name || 'بدون اسم',
                phone: u.phone || 'غير متوفر',
                trip_route: (from !== 'غير محدد' || to !== 'غير محدد') ? `${from} ⬅️ ${to}` : 'رحلة عامة',
                pickup_point: from,
                dropoff_point: to,
                trip_date: u.created_at ? new Date(u.created_at).toLocaleDateString('ar-EG') : 'اليوم',
                payment_method: u.payment_method || 'كاش',
                payment_status: u.payment_status || 'معلق',
                status: u.status || 'مؤكد'
            };
        });

        res.json(formattedData);

    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ error: "خطأ أثناء جلب الحجوزات", details: err.message });
    }
});

// تحديث حالة الحجز
app.patch('/api/admin/bookings/:id/status', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { error } = await supabase.from('users').update({ status }).eq('id', id);
        if (error) throw error;
        res.json({ message: "تم تحديث حالة الحجز بنجاح" });
    } catch (err) {
        res.status(500).json({ error: "خطأ في التحديث" });
    }
});

// تحديث حالة الدفع
app.patch('/api/admin/bookings/:id/payment', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        const { error } = await supabase.from('users').update({ payment_status }).eq('id', id);
        if (error) throw error;
        res.json({ message: "تم تحديث حالة الدفع بنجاح" });
    } catch (err) {
        res.status(500).json({ error: "خطأ في التحديث" });
    }
});

// حذف حجز
app.delete('/api/admin/bookings/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: "تم الحذف بنجاح" });
    } catch (err) {
        res.status(500).json({ error: "خطأ في الحذف" });
    }
});

// =========================================================
// 7. معالجة المسارات والملفات الثابتة
// =========================================================

// منع إرجاع HTML لأي مسار API غير موجود (يُرجع JSON دائماً)
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: "المسار غير موجود" });
});

// تشغيل الملفات الثابتة للواجهة
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
