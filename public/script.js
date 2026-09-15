// ==========================================
// البيانات والدوال الأساسية (Data & Logic)
// ==========================================

// بيانات المدن والمحطات المترتبطة بها حسب طلبك بالضبط
const locations = {
    "المنصورة": ["الجمالية", "ميت سلسيل", "الرياض", "ميت عاصم", "منية النصر", "دكرنس", "كفر القباب", "المنصورة الاستاد", "المنصورة سندوب", "منية سندوب", "ميت معاند", "أجا", "كفر عوض", "فيشا", "بشلا", "كوبري ابو نبهان ميت غمر", "كوبري دقادوس ميت غمر", "كوبري البراميل ميت غمر", "كوبري صهرجت الكبرى"],
    "الشرقية": ["بلبيس", "الزقازيق", "ههيا", "ابو كبير", "فاقوس"],
    "الغربية": ["المحلة", "طنطا"],
    "دمياط": ["دمياط القديمة", "الزرقا", "فارسكور"],
    "البحيرة": ["دمنهور"], 
    "كفر الشيخ": ["كفر الشيخ"],
    "المنوفية": ["شبين الكوم", "قويسنا"],
    "الإسكندرية": ["الإسكندرية"],
    "بني سويف": ["شرق بني سويف الجديدة"],
    "المنيا": ["المدينة الجامعية للبنات في المنيا"]
};

// عناصر الـ DOM
const cityFromSelect = document.getElementById('city-from');
const stationFromSelect = document.getElementById('station-from');
const cityToSelect = document.getElementById('city-to');
const stationToSelect = document.getElementById('station-to');
const btnShowTrips = document.getElementById('btn-show-trips');

// ملء قائمة المدن
function populateCities() {
    const cities = Object.keys(locations);
    cities.forEach(city => {
        cityFromSelect.add(new Option(city, city));
        cityToSelect.add(new Option(city, city));
    });
}

// تحديث المحطات بناءً على المدينة المختارة
function updateStations(citySelect, stationSelect) {
    stationSelect.innerHTML = '<option value="" disabled selected>اختر المحطة</option>';
    const selectedCity = citySelect.value;
    if (selectedCity && locations[selectedCity]) {
        locations[selectedCity].forEach(station => {
            stationSelect.add(new Option(station, station));
        });
    }
}

// الأحداث (Event Listeners)
cityFromSelect.addEventListener('change', () => updateStations(cityFromSelect, stationFromSelect));
cityToSelect.addEventListener('change', () => updateStations(cityToSelect, stationToSelect));

// تهيئة المدن عند بدء التشغيل
populateCities();

// ==========================================
// نظام التنقل بين الصفحات (SPA Navigation)
// ==========================================
function switchSection(targetSectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(targetSectionId).classList.add('active');
    window.scrollTo(0, 0);
}

function goBack(targetSectionId) {
    switchSection(targetSectionId);
}

// ==========================================
// 1. عرض الرحلات
// ==========================================
btnShowTrips.addEventListener('click', () => {
    // التحقق من اختيار جميع الخانات
    if (!cityFromSelect.value || !stationFromSelect.value || !cityToSelect.value || !stationToSelect.value) {
        alert("برجاء اختيار المدينة والمحطة لجهتي السفر والوصول أولاً.");
        return;
    }

    generateTrips();
    switchSection('section-trips');
});

function generateTrips() {
    const tripsList = document.getElementById('trips-list');
    tripsList.innerHTML = ''; // مسح القديم

    // إنشاء 4 رحلات بأوقات مختلفة بصيغة 12 ساعة
    const times = ["08:00 ص", "11:30 ص", "02:15 م", "06:00 م"];
    
    times.forEach(time => {
        const tripHTML = `
            <div class="trip-card">
                <div class="trip-price">355 <span>جنية</span></div>
                <div class="trip-route">
                    السفر من ${stationFromSelect.value} <br>
                    إلى ${stationToSelect.value}
                </div>
                <div class="trip-time">${time}</div>
                <button class="btn-select-trip" onclick="selectTrip()">اختر الرحلة</button>
            </div>
        `;
        tripsList.innerHTML += tripHTML;
    });
}

window.selectTrip = function() {
    switchSection('section-data');
}

// ==========================================
// 2. التحقق من البيانات والانتقال للدفع
// ==========================================
const passengerForm = document.getElementById('passenger-form');
const phoneInput = document.getElementById('passenger-phone');
const phoneError = document.getElementById('phone-error');

passengerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const phoneVal = phoneInput.value;
    const phoneRegex = /^01[0125][0-9]{8}$/;
    
    if (!phoneRegex.test(phoneVal)) {
        phoneError.style.display = 'block';
        return;
    }
    phoneError.style.display = 'none';
    
    switchSection('section-payment-method');
});

// ==========================================
// 3. اختيار طريقة الدفع
// ==========================================
const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
const btnProceedPayment = document.getElementById('btn-proceed-payment');
let selectedPayment = null;

paymentRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        selectedPayment = e.target.value;
        btnProceedPayment.disabled = false;
    });
});

btnProceedPayment.addEventListener('click', () => {
    renderPaymentDetails(selectedPayment);
    switchSection('section-payment-details');
});

// ==========================================
// 4. تفاصيل الدفع النهائية
// ==========================================
function renderPaymentDetails(method) {
    const dynamicInfo = document.getElementById('dynamic-payment-info');
    
    if (method === 'vodafone') {
        dynamicInfo.innerHTML = `
            <div class="payment-details-text">
                <div>الرقم المحول اليه : <span>01026264522</span></div>
                <div>بإسم : <span>مهند م*** ر***</span></div>
                <div>المبلغ : <span>355 جنية</span></div>
            </div>
        `;
    } else if (method === 'instapay') {
        dynamicInfo.innerHTML = `
            <div class="payment-details-text">
                <div>الرقم المحول اليه : <span>01026264522</span></div>
                <div>بإسم : <span dir="ltr">MOHANNED M R</span></div>
                <div>المبلغ : <span>355 جنية</span></div>
            </div>
            <div class="insta-alert">
                <i class="fa-solid fa-triangle-exclamation alert-triangle"></i>
                تنويه : تأكد من داخل تطبيق انستا باي بالإرسال الى انستاباي وليس المحفظة الالكترونية عبر اختيار اول خانة على شكل هاتف
            </div>
        `;
    }
}
// -----------------------------------------
// ربط Supabase وإرسال بيانات الحجز
// -----------------------------------------
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://ififfcevzgrhygiqcqfo.supabase.co'
const supabaseKey = 'sb_publishable_uRpGBwNOk32ehkutQFbMpQ_bTk9Ix8Z'

const supabase = createClient(supabaseUrl, supabaseKey)

async function      saveBookingToTosupabase(customerData, tripData) {
    const { data, error } = await supabase
        .from('Trip')
        .insert([
            {
                user_id: customerData.id,
                From_location: tripData.from,
                To_location: tripData.to
            }
        ]);
    if (error) {
        console.error('خطأ في الحفظ:', error.message);
    } else {
        console.log('تم الحفظ بنجاح', data);
    }
}

document.getElementById('passenger-form').addEventListener('submit', async (e) => { e.preventDefault();
// طلب البيانات الأساسية
const cityFromEl = document.getElementById('cityFromSelect');
const stationFromEl = document.getElementById('stationFromSelect');
const fromValue = cityFromEl ? cityFromEl.value : (stationFromEl ? stationFromEl.value : '');

const cityToEl = document.getElementById('cityToSelect');
const stationToEl = document.getElementById('stationToSelect');
const toValue = cityToEl ? cityToEl.value : (stationToEl ? stationToEl.value : '');

const nameEl = document.getElementById('passenger-name');
const phoneEl = document.getElementById('passenger-phone');
const passengerName = nameEl ? nameEl.value : '';
const passengerPhone = phoneEl ? phoneEl.value : '';

// تجهيز البيانات
const customerData = {
    name: passengerName,
    phone: passengerPhone
};

// تنفيذ الحفظ
// تنفيذ الحفظ
    await saveBookingToTosupabase(customerData, fromValue, toValue);

// دالة الحفظ لوحدها في الصافي وبراحتها
async function saveBookingToTosupabase(customerData, fromVal, toVal) {
    // 1. تسجيل المستخدم أولاً عشان نطلع الـ id
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
            { name: customerData.name, phone: customerData.phone }
        ])
        .select();
    if (userError) {
        console.error('خطأ في حفظ المستخدم:', userError.message);
        return;
    }
    const newUserId = userData && userData.length > 0 ? userData[0].id : 1;
    // 2. تجهيز الـ tripData مع الـ user_id الحقيقي
    const tripData = {
        user_id: newUserId,
        From_location: fromVal,
        To_location: toVal
    };
    // ده سطر الإرسال بتاعك اللي بتحبه
    const { data, error } = await supabase.from('Trip').insert([tripData]);
    if (error) {
        console.error('خطأ في حفظ الرحلة:', error.message);
    } else {
        console.log('تم الحجز بنجاح', data);
    }
});⁠                         
