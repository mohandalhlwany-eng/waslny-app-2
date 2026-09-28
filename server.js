const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// 1. إعداد وتفعيل CORS للسماح بالنطاق الفرعي admin.waslnisaree.com والنطاق الرئيسي
const allowedOrigins = [
    'https://admin.waslnisaree.com',
    'https://waslnisaree.com',
    'http://localhost:3000'
];

const corsOptions = {
    origin: function (origin, callback) {
        // السماح بالطلبات من أي نطاق فرعي لـ waslnisaree.com أو الطلبات المباشرة
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.waslnisaree.com')) {
            callback(null, true);
        } else {
            callback(null, true); // السماح لكافة المصادر لضمان التوافقية
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// 2. إعدادات Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ififfcevzgrhyglqcqfo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmaWZmY2V2emdyaHlnbHFjcWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM0NjU4OTUsImV4cCI6MjAzODg0MTg5NX0.7q6Y2A3sHkXfJcMZvEIbd';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. الحماية والأمان (Helmet & RateLimit)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "تم تجاوز حد المسموح من الطلبات، يرجى المحاولة لاحقاً",
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// 4. دالة التحقق من صلاحيات الأدمن
const isAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: "غير مصرح بالدخول" });
    }
    next();
};

// =========================================================
// 5. مسارات لوحة التحكم (Admin APIs)
// =========================================================

// جلب الحجوزات والربط بين جدول users وجدول Trip
app.get('/api/admin/bookings', isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id,
                name,
                phone,
                created_at,
                Trip (
                    id,
                    From_location,
                    To_location
                )
            `);

        if (error) throw error;

        const formattedData = data.map(u => {
            const trip = Array.isArray(u.Trip) && u.Trip.length > 0 ? u.Trip[0] : (u.Trip || {});
            const from = trip.From_location || 'غير محدد';
            const to = trip.To_location || 'غير محدد';

            return {
                id: u.id,
                passenger_name: u.name || 'بدون اسم',
                phone: u.phone || 'غير متوفر',
                trip_route: (from !== 'غير محدد' || to !== 'غير محدد') ? `${from} ⬅️ ${to}` : 'رحلة عامة',
                pickup_point: from,
                dropoff_point: to,
                trip_date: u.created_at ? new Date(u.created_at).toLocaleDateString('ar-EG') : 'تاريخ اليوم',
                payment_method: u.payment_method || 'كاش',
                payment_status: u.payment_status || 'معلق',
                status: u.status || 'مؤكد'
            };
        });

        res.json(formattedData);

    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "خطأ أثناء جلب الحجوزات" });
    }
});

// تحديث حالة الحجز (مؤكد / ملغى)
app.patch('/api/admin/bookings/:id/status', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { error } = await supabase
            .from('users')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        res.json({ message: "تم تحديث حالة الحجز بنجاح" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "خطأ أثناء تحديث حالة الحجز" });
    }
});

// تحديث حالة الدفع (معلق / تم الدفع / مسترد)
app.patch('/api/admin/bookings/:id/payment', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        const { error } = await supabase
            .from('users')
            .update({ payment_status })
            .eq('id', id);

        if (error) throw error;
        res.json({ message: "تم تحديث حالة الدفع بنجاح" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "خطأ أثناء تحديث حالة الدفع" });
    }
});

// حذف الحجز / الراكب
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

// =========================================================
// 6. تشغيل الملفات الثابتة والسيرفر
// =========================================================

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Secure Server is running on port ${PORT}`);
});
