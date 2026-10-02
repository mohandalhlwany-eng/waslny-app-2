const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// 2. CORS Settings
const allowedOrigins = [
    'https://admin.waslnisaree.com',
    'https://waslnisaree.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.waslnisaree.com')) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));

app.options('*', cors());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.set('trust proxy', 1);

// 3. Admin Middleware
const isAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const customToken = req.headers['x-admin-token'];
    const expectedToken = process.env.ADMIN_TOKEN;

    if (!expectedToken) {
        return res.status(500).json({ success: false, message: 'ADMIN_TOKEN غير معرف في متغيرات البيئة' });
    }

    if ((authHeader && authHeader === `Bearer ${expectedToken}`) || customToken === expectedToken) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'غير مصرح بالدخول' });
    }
};

// 4. API Endpoints
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body || {};
    const validEmail = process.env.ADMIN_EMAIL;
    const validPassword = process.env.ADMIN_PASSWORD;
    const adminToken = process.env.ADMIN_TOKEN;

    if (!validEmail || !validPassword || !adminToken) {
        return res.status(500).json({ success: false, message: 'بيانات الدخول غير مهيأة في متغيرات البيئة' });
    }

    if (email === validEmail && password === validPassword) {
        return res.json({
            success: true,
            token: adminToken,
            user: { email: validEmail, role: 'admin' },
            message: 'تم تسجيل الدخول بنجاح'
        });
    }

    return res.status(401).json({ success: false, message: 'البريد أو كلمة المرور غير صحيحة' });
});

app.get('/api/admin/bookings', isAdmin, async (req, res) => {
    try {
        const { data: users, error: uErr } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (uErr) throw uErr;

        const { data: trips } = await supabase.from('Trip').select('*');
        const usersList = users || [];
        const tripsList = trips || [];

        const groupedTrips = {};

        usersList.forEach(user => {
            const userTrip = tripsList.find(t => String(t.user_id) === String(user.id) || String(t.id) === String(user.id)) || {};
            const from = userTrip.From_location || userTrip.from_location || 'غير محدد';
            const to = userTrip.To_location || userTrip.to_location || 'غير محدد';
            const routeKey = (from !== 'غير محدد' || to !== 'غير محدد') ? `${from} ⬅️ ${to}` : 'رحلات عامة بدون تحديد';

            if (!groupedTrips[routeKey]) {
                groupedTrips[routeKey] = {
                    route: routeKey,
                    from_location: from,
                    to_location: to,
                    total_passengers: 0,
                    passengers: []
                };
            }

            groupedTrips[routeKey].total_passengers += 1;
            groupedTrips[routeKey].passengers.push({
                id: user.id,
                name: user.name || 'بدون اسم',
                phone: user.phone || 'غير متوفر',
                created_at: user.created_at,
                date_formatted: user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : 'اليوم',
                time_formatted: user.created_at ? new Date(user.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '--',
                payment_method: user.payment_method || 'كاش',
                payment_status: user.payment_status || 'معلق',
                status: user.status || 'مؤكد'
            });
        });

        res.json({ success: true, total_records: usersList.length, trips: Object.values(groupedTrips) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ أثناء جلب الحجوزات', error: err.message });
    }
});

app.patch('/api/admin/bookings/:id/status', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await supabase.from('users').update({ status }).eq('id', id);
        res.json({ success: true, message: 'تم تحديث حالة الحجز' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في التحديث' });
    }
});

app.patch('/api/admin/bookings/:id/payment', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;
        await supabase.from('users').update({ payment_status }).eq('id', id);
        res.json({ success: true, message: 'تم تحديث حالة الدفع' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في التحديث' });
    }
});

app.delete('/api/admin/bookings/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await supabase.from('users').delete().eq('id', id);
        res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في الحذف' });
    }
});

// 5. Static Files Serving (خدمة الملفات الثابتة من مجلد admin ومجلد الجذر)
app.use(express.static(path.join(__dirname, 'admin')));
app.use(express.static(__dirname));

// 6. Routes Navigation
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// لمنع السيرفر من إرجاع ملف HTML بدلاً من CSS أو JS مفقود
app.get('*', (req, res) => {
    if (req.url.endsWith('.css') || req.url.endsWith('.js')) {
        return res.status(404).send('File not found');
    }
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
