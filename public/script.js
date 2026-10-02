// ==========================================
// 1. ربط Supabase (في أول الملف)
// ==========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://ififfcevzgrhygiqcqfo.supabase.co'
const supabaseKey = 'sb_publishable_uRpGBwNOk32ehkutQFbMpQ_bTk9Ix8Z'
const supabase = createClient(supabaseUrl, supabaseKey)

// ==========================================
// 2. خريطة المدن والمحطات
// ==========================================
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

const mainHubs = ["بني سويف", "المنيا"];

// ==========================================
// دالة حساب تاريخ رحلات الخميس تلقائياً
// (تتغير تلقائياً يوم الجمعة لتجيب الخميس القادم)
// ==========================================
function getUpcomingThursdayDate(includeYear = false) {
    const today = new Date();
    const currentDay = today.getDay(); // 0: الأحد, 4: الخميس, 5: الجمعة, 6: السبت

    // حساب الفارق بين اليوم الحالي ويوم الخميس (رقم 4)
    let distance = 4 - currentDay;

    // بمجرد دخول يوم الجمعة (distance = -1) أو السبت (distance = -2)
    // يتم تحويل الحساب للخميس القادم (+7 أيام)
    if (distance < 0) {
        distance += 7;
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + distance);

    const dayNum = String(targetDate.getDate()).padStart(2, '0');
    const monthNum = String(targetDate.getMonth() + 1).padStart(2, '0');
    const yearNum = targetDate.getFullYear();

    if (includeYear) {
        return `الخميس (${dayNum}/${monthNum}/${yearNum})`;
    }

    return `الخميس (${dayNum}/${monthNum})`;
}

// ==========================================
// 3. جدول الرحلات المخصصة
// ==========================================
const customTrips = [
    {
        fromCity: "المنصورة",
        toCity: "بني سويف",
        time: "08:00 ص",
        price: "355",
        days: "يومياً"
    },
    {
        fromCity: "المنصورة",
        toCity: "بني سويف",
        time: "11:30 ص",
        price: "355",
        days: "يومياً"
    },
    {
    tripCode: "TRIP-BNS-MNS-THU-04PM",
    fromCity: "بني سويف",
    toCity: "المنصورة",
    time: "04:00 عصرا",
    price: "355",
    days: getUpcomingThursdayDate()
},
    {
        fromCity: "الشرقية",
        toCity: "بني سويف",
        time: "09:00 ص",
        price: "300",
        days: "طوال الأسبوع"
    }
];

// ==========================================
// 4. دالة التنقل بين الصفحات (العامة)
// ==========================================
window.switchSection = function(targetSectionId) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
        sec.classList.add('hidden');
    });
    const target = document.getElementById(targetSectionId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
};

// ==========================================
// 5. إدارة قوائم الاختيار (المدن والمحطات)
// ==========================================
const cityFromSelect = document.getElementById('city-from');
const stationFromSelect = document.getElementById('station-from');
const cityToSelect = document.getElementById('city-to');
const stationToSelect = document.getElementById('station-to');
const btnShowTrips = document.getElementById('btn-show-trips');

function populateCities() {
    if (!cityFromSelect || !cityToSelect) return;
    cityFromSelect.innerHTML = '<option value="" disabled selected>اختر المدينة</option>';
    cityToSelect.innerHTML = '<option value="" disabled selected>اختر المدينة</option>';
    Object.keys(locations).forEach(city => {
        cityFromSelect.add(new Option(city, city));
        cityToSelect.add(new Option(city, city));
    });
}

function updateStations(citySelect, stationSelect) {
    stationSelect.innerHTML = '<option value="" disabled selected>اختر المحطة</option>';
    const selectedCity = citySelect.value;
    if (selectedCity && locations[selectedCity]) {
        locations[selectedCity].forEach(station => {
            stationSelect.add(new Option(station, station));
        });
    }
}

function filterCounterpart(sourceSelect, targetSelect, targetStationSelect) {
    const selectedVal = sourceSelect.value;
    const currentTargetVal = targetSelect.value;
    targetSelect.innerHTML = '<option value="" disabled selected>اختر المدينة</option>';
    if (!selectedVal) return;
    const cities = Object.keys(locations);
    if (mainHubs.includes(selectedVal)) {
        cities.forEach(city => {
            if (!mainHubs.includes(city)) targetSelect.add(new Option(city, city));
        });
    } else {
        mainHubs.forEach(hub => targetSelect.add(new Option(hub, hub)));
    }
    const optionExists = Array.from(targetSelect.options).some(opt => opt.value === currentTargetVal);
    if (optionExists && currentTargetVal !== "") {
        targetSelect.value = currentTargetVal;
    } else {
        targetStationSelect.innerHTML = '<option value="" disabled selected>اختر المحطة</option>';
    }
}

if (cityFromSelect && cityToSelect) {
    cityFromSelect.addEventListener('change', () => {
        updateStations(cityFromSelect, stationFromSelect);
        filterCounterpart(cityFromSelect, cityToSelect, stationToSelect);
    });

    cityToSelect.addEventListener('change', () => {
        updateStations(cityToSelect, stationToSelect);
        filterCounterpart(cityToSelect, cityFromSelect, stationFromSelect);
    });

    populateCities();
}

// ==========================================
// 6. عرض والبحث عن الرحلات
// ==========================================
if (btnShowTrips) {
    btnShowTrips.addEventListener('click', () => {
        if (!cityFromSelect.value || !stationFromSelect.value || !cityToSelect.value || !stationToSelect.value) {
            alert("برجاء اختيار المدينة والمحطة لجهتي السفر والوصول أولاً.");
            return;
        }
        generateTrips();
        switchSection('section-trips');
    });
}

function generateTrips() {
    const tripsList = document.getElementById('trips-list');
    if (!tripsList) return;
    tripsList.innerHTML = ''; 
    
    const matchingTrips = customTrips.filter(trip => 
        trip.fromCity === cityFromSelect.value && trip.toCity === cityToSelect.value
    );

    if (matchingTrips.length === 0) {
        tripsList.innerHTML = `
            <div style="text-align: center; padding: 35px 15px; color: #666; font-size: 16px; background: #fff; border-radius: 12px; margin-top: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                لا توجد رحلات متاحة حالياً من <b>${cityFromSelect.value}</b> إلى <b>${cityToSelect.value}</b>.
            </div>`;
        return;
    }

    matchingTrips.forEach(trip => {
        tripsList.innerHTML += `
            <div class="trip-card">
                <div class="trip-price">${trip.price} <span>جنية</span></div>
                <div class="trip-route">
                    السفر من ${stationFromSelect.value} <br>
                    إلى ${stationToSelect.value}
                </div>
                <div class="trip-time">
                    🕒 ${trip.time}
                    ${trip.days ? `<div style="font-size: 13px; color: #666; margin-top: 4px;">📅 ${trip.days}</div>` : ''}
                </div>
                <button class="main-btn" style="margin-top: 10px; padding: 8px 15px; font-size: 14px;" onclick="selectTrip()">اختر الرحلة</button>
            </div>
        `;
    });
}

window.selectTrip = function() {
    switchSection('section-data');
};

// ==========================================
// 7. إدخال البيانات وحفظ الحجز في Supabase
// ==========================================
const passengerForm = document.getElementById('passenger-form');
const phoneInput = document.getElementById('passenger-phone');
const phoneError = document.getElementById('phone-error');

async function saveBookingToSupabase(customerData, fromVal, toVal) {
    const { data: userData, error: userError } = await supabase.from('users').insert([{ name: customerData.name, phone: customerData.phone }]).select();
    if (userError) {
        console.error('خطأ في حفظ المستخدم:', userError.message);
        return;
    }
    
    const newUserId = userData && userData.length > 0 ? userData[0].id : 1;
    const { data, error } = await supabase.from('Trip').insert([{ user_id: newUserId, From_location: fromVal, To_location: toVal }]);
    if (error) console.error('خطأ في حفظ الرحلة:', error.message);
    else console.log('تم الحجز بنجاح في Supabase', data);
}

if (passengerForm) {
    passengerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!/^01[0125][0-9]{8}$/.test(phoneInput.value)) {
            if (phoneError) phoneError.style.display = 'block'; 
            return;
        }
        if (phoneError) phoneError.style.display = 'none';

        await saveBookingToSupabase(
            { name: document.getElementById('passenger-name').value, phone: phoneInput.value },
            `${cityFromSelect.value} - ${stationFromSelect.value}`,
            `${cityToSelect.value} - ${stationToSelect.value}`
        );
        switchSection('section-payment-method');
    });
}

// ==========================================
// 8. اختيار طريقة الدفع وعرض التفاصيل
// ==========================================
const btnProceedPayment = document.getElementById('btn-proceed-payment');
let selectedPayment = null;

document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        selectedPayment = e.target.value;
        if (btnProceedPayment) btnProceedPayment.disabled = false;
    });
});

if (btnProceedPayment) {
    btnProceedPayment.addEventListener('click', () => {
        const dynamicInfo = document.getElementById('dynamic-payment-info');
        if (!dynamicInfo) return;
        
        if (selectedPayment === 'vodafone') {
            dynamicInfo.innerHTML = `
                <div class="payment-details-text" style="background:#f8f9fa; padding:15px; border-radius:10px; margin-bottom:15px;">
                    <div>الرقم المحول اليه : <b dir="ltr">01026264522</b></div>
                    <div>بإسم : <b>مهند م*** ر***</b></div>
                    <div>المبلغ : <b>355 جنية</b></div>
                </div>`;
        } else if (selectedPayment === 'instapay') {
            dynamicInfo.innerHTML = `
                <div class="payment-details-text" style="background:#f8f9fa; padding:15px; border-radius:10px; margin-bottom:15px;">
                    <div>الرقم المحول اليه : <b dir="ltr">01026264522</b></div>
                    <div>بإسم : <b dir="ltr">MOHANNED M R</b></div>
                    <div>المبلغ : <b>355 جنية</b></div>
                </div>
                <div class="insta-alert" style="color: #c0392b; font-size: 13px; margin-bottom: 15px;">
                    <i class="fa-solid fa-triangle-exclamation"></i> تأكد من الإرسال الى انستاباي وليس المحفظة الالكترونية
                </div>`;
        }
        switchSection('section-payment-details');
    });
}

// ==========================================
// 9. زر الرجوع الشامل لجميع الصفحات
// ==========================================
document.addEventListener('click', function(event) {
    const backBtn = event.target.closest('.back-btn');
    if (!backBtn) return;
    event.preventDefault();
    
    let targetId = backBtn.getAttribute('data-target');
    if (!targetId && backBtn.getAttribute('onclick')) {
        const match = backBtn.getAttribute('onclick').match(/'([^']+)'/);
        if (match) targetId = match[1];
    }
    if (targetId) switchSection(targetId);
});

// ==========================================
// 10. تشغيل وإدارة النمط الليلي (Dark Mode)
// ==========================================
function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    
    // تحديث كافة أزرار النمط الليلي بجميع الصفحات
    const darkModeBtns = document.querySelectorAll('.dark-mode-toggle');
    darkModeBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    });
    localStorage.setItem('theme', theme);
}

// قراءة الحالة السابقة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // إضافة مستمع الأحداث لكافة أزرار النمط الليلي
    document.querySelectorAll('.dark-mode-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(currentTheme);
        });
    });
});
