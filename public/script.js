// ==========================================
// 0. ربط Supabase (في أول الملف)
// ==========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://ififfcevzgrhygiqcqfo.supabase.co'
const supabaseKey = 'sb_publishable_uRpGBwNOk32ehkutQFbMpQ_bTk9Ix8Z'
const supabase = createClient(supabaseUrl, supabaseKey)

// ==========================================
// 1. خريطة المدن والمحطات
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
// 🔴 جدول تعديل الرحلات المخصصة (عدل وأضف براحتك هنا)
// ==========================================
const customTrips = [
    // --- مثال 1: رحلة من المنصورة إلى بني سويف ---
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

    // --- مثال 2: رحلة من بني سويف إلى المنصورة ---
    {
        fromCity: "بني سويف",
        toCity: "المنصورة",
        time: "02:00 م",
        price: "355",
        days: "السبت والأحد"
    },

    // --- مثال 3: رحلة من الشرقية إلى بني سويف ---
    {
        fromCity: "الشرقية",
        toCity: "بني سويف",
        time: "09:00 ص",
        price: "300",
        days: "طوال الأسبوع"
    }

    // 💡 يمكنك إضافة أي رحلة جديدة هنا بنفس الشكل:
    /*
    ,{
        fromCity: "اسم المدينة من",
        toCity: "اسم المدينة إلى",
        time: "الموعد",
        price: "السعر",
        days: "أيام الرحلة"
    }
    */
];

// ==========================================
// 2. العناصر والدوال الأساسية للواجهة
// ==========================================
const cityFromSelect = document.getElementById('city-from');
const stationFromSelect = document.getElementById('station-from');
const cityToSelect = document.getElementById('city-to');
const stationToSelect = document.getElementById('station-to');
const btnShowTrips = document.getElementById('btn-show-trips');

// ملء قائمة المدن عند البداية
function populateCities() {
    cityFromSelect.innerHTML = '<option value="" disabled selected>اختر المدينة</option>';
    cityToSelect.innerHTML = '<option value="" disabled selected>اختر المدينة</option>';
    const cities = Object.keys(locations);
    cities.forEach(city => {
        cityFromSelect.add(new Option(city, city));
        cityToSelect.add(new Option(city, city));
    });
}

// تحديث المحطات
function updateStations(citySelect, stationSelect) {
    stationSelect.innerHTML = '<option value="" disabled selected>اختر المحطة</option>';
    const selectedCity = citySelect.value;
    if (selectedCity && locations[selectedCity]) {
        locations[selectedCity].forEach(station => {
            stationSelect.add(new Option(station, station));
        });
    }
}

// الفلترة الذكية (لإجبار اختيار بني سويف أو المنيا كطرف أساسي)
function filterCounterpart(sourceSelect, targetSelect, targetStationSelect) {
    const selectedVal = sourceSelect.value;
    const currentTargetVal = targetSelect.value;
    
    targetSelect.innerHTML = '<option value="" disabled selected>اختر المدينة</option>';
    
    if (!selectedVal) return;

    const cities = Object.keys(locations);
    
    if (mainHubs.includes(selectedVal)) {
        cities.forEach(city => {
            if (!mainHubs.includes(city)) {
                targetSelect.add(new Option(city, city));
            }
        });
    } else {
        mainHubs.forEach(hub => {
            targetSelect.add(new Option(hub, hub));
        });
    }

    const optionExists = Array.from(targetSelect.options).some(opt => opt.value === currentTargetVal);
    if (optionExists && currentTargetVal !== "") {
        targetSelect.value = currentTargetVal;
    } else {
        targetStationSelect.innerHTML = '<option value="" disabled selected>اختر المحطة</option>';
    }
}

// الأحداث (Event Listeners) للمدن
cityFromSelect.addEventListener('change', () => {
    updateStations(cityFromSelect, stationFromSelect);
    filterCounterpart(cityFromSelect, cityToSelect, stationToSelect);
});

cityToSelect.addEventListener('change', () => {
    updateStations(cityToSelect, stationToSelect);
    filterCounterpart(cityToSelect, cityFromSelect, stationFromSelect);
});

// تهيئة القوائم عند التحميل
populateCities();

// ==========================================
// 3. التنقل بين الصفحات (SPA Navigation)
// ==========================================
function switchSection(targetSectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(targetSectionId).classList.add('active');
    window.scrollTo(0, 0);
}

// ==========================================
// 4. عرض الرحلات المخصصة (Dynamically Generated)
// ==========================================
btnShowTrips.addEventListener('click', () => {
    if (!cityFromSelect.value || !stationFromSelect.value || !cityToSelect.value || !stationToSelect.value) {
        alert("برجاء اختيار المدينة والمحطة لجهتي السفر والوصول أولاً.");
        return;
    }
    generateTrips();
    switchSection('section-trips');
});

function generateTrips() {
    const tripsList = document.getElementById('trips-list');
    tripsList.innerHTML = ''; 

    const selectedFromCity = cityFromSelect.value;
    const selectedToCity = cityToSelect.value;

    // تصفية الرحلات المخصصة المتاحة بين المدينتين المحددتين
    const matchingTrips = customTrips.filter(trip => 
        trip.fromCity === selectedFromCity && trip.toCity === selectedToCity
    );

    // حالة عدم وجود رحلات
    if (matchingTrips.length === 0) {
        tripsList.innerHTML = `
            <div style="text-align: center; padding: 35px 15px; color: #666; font-size: 16px; background: #fff; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                لا توجد رحلات متاحة حالياً من <b>${selectedFromCity}</b> إلى <b>${selectedToCity}</b>.
            </div>
        `;
        return;
    }

    // عرض الرحلات المطابقة فقط
    matchingTrips.forEach(trip => {
        const tripHTML = `
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
// 5. حفظ البيانات في Supabase
// ==========================================
const passengerForm = document.getElementById('passenger-form');
const phoneInput = document.getElementById('passenger-phone');
const phoneError = document.getElementById('phone-error');

async function saveBookingToSupabase(customerData, fromVal, toVal) {
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{ name: customerData.name, phone: customerData.phone }])
        .select();

    if (userError) {
        console.error('خطأ في حفظ المستخدم:', userError.message);
        return;
    }
    
    const newUserId = userData && userData.length > 0 ? userData[0].id : 1;
    
    const tripData = {
        user_id: newUserId,
        From_location: fromVal,
        To_location: toVal
    };
    
    const { data, error } = await supabase.from('Trip').insert([tripData]);
    if (error) {
        console.error('خطأ في حفظ الرحلة:', error.message);
    } else {
        console.log('تم الحجز بنجاح في قاعدة البيانات', data);
    }
}

passengerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phoneVal = phoneInput.value;
    const phoneRegex = /^01[0125][0-9]{8}$/;
    
    if (!phoneRegex.test(phoneVal)) {
        phoneError.style.display = 'block';
        return;
    }
    phoneError.style.display = 'none';

    const passengerName = document.getElementById('passenger-name').value;
    const passengerPhone = phoneInput.value;
    
    const fromValue = `${cityFromSelect.value} - ${stationFromSelect.value}`;
    const cityToVal = cityToSelect ? cityToSelect.value : '';
    const stationToVal = stationToSelect ? stationToSelect.value : '';
    const toValue = `${cityToVal} - ${stationToVal}`;

    const customerData = { name: passengerName, phone: passengerPhone };

    await saveBookingToSupabase(customerData, fromValue, toValue);
    switchSection('section-payment-method');
});

// ==========================================
// 6. وسائل الدفع وتفاصيلها
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

// ==========================================
// 7. زر الرجوع الشامل
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

    if (targetId) {
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.add('hidden');
            sec.classList.remove('active');
        });
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
            window.scrollTo(0, 0);
        }
    }
});
