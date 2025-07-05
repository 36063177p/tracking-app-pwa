// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCsPYPaq8U85aZTheIofRwdqVM2M63GbUU",
    authDomain: "alshahbaa-fa880.firebaseapp.com",
    projectId: "alshahbaa-fa880",
    storageBucket: "alshahbaa-fa880.firebasestorage.app",
    messagingSenderId: "642323096692",
    appId: "1:642323096692:web:37e9a66ba8c8d6e57c5d21",
    databaseURL: "https://alshahbaa-fa880-default-rtdb.europe-west1.firebasedatabase.app"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// المتغيرات العامة
let loginForm, ordersSection, loginSection, orderModal, orderForm, addOrderBtn, closeBtn;

// إضافة متغيرات جديدة للبحث والتصفية
let searchInput, statusFilter, dateFilter;

// إضافة المتغيرات الجديدة
let shipmentModal, shipmentForm, addShipmentBtn, orderSelect;
let currentFiles = new Map();

// إضافة متغيرات Cloudinary
const CLOUDINARY_CLOUD_NAME = 'dzfdvgump';
const CLOUDINARY_UPLOAD_PRESET = 'alshahbaa';
const SERVER_URL = 'https://alshahbaa-api.vercel.app';

// إضافة المتغيرات الجديدة
let customsModal, customsForm, addCustomsBtn, shipmentSelect;

// إضافة المتغيرات الجديدة
let costModal, costForm, addCostBtn;

// إضافة المتغيرات الجديدة للمخزون
let inventoryModal, inventoryForm, addInventoryBtn;

// إضافة المتغيرات الجديدة للوحة المعلومات
let costsChart, inventoryChart;

// متغيرات قسم خطط الشراء الموسمية
let addSeasonalPlanBtn, seasonalPlanModal, closeSeasonalPlanModal, seasonalPlanForm;
let seasonalProductModal, closeSeasonalProductModal, seasonalProductForm;
let productsTimelineContainer, timelineSupplierName, productsTimelineTableBody;

// إضافة متغيرات جديدة للإشعارات
let notificationsPanel, notificationsBtn, notificationsBadge;
let notificationsList = [];
let currentFilter = 'all';

// إضافة متغيرات للإشعارات المتقدمة
let notificationSettings = {
    soundEnabled: true,
    soundType: 'default',
    desktopEnabled: false,
    whatsappEnabled: false,
    whatsappNumber: '',
    notifyNewOrders: true,
    notifyShipments: true,
    notifyInventory: true,
    notifyseasonal_plans: true
};

// متغيرات حفظ حالة الفلترة للجداول
const filterStates = {
    orders: {
        search: '',
        status: '',
        supplier: '',
        dateRange: { start: null, end: null }
    },
    shipments: {
        search: '',
        status: '',
        supplier: '',
        dateRange: { start: null, end: null }
    },
    seasonal_plans: {
        search: '',
        supplier: '',
        status: '',
        season: ''
    },
    products: {
        search: '',
        supplier: '',
        category: ''
    }
};

// تحميل إعدادات الإشعارات
function loadNotificationSettings() {
    try {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            notificationSettings = JSON.parse(saved);
            updateSettingsUI();
        }
    } catch (error) {
        console.error('Error loading notification settings:', error);
    }
}

// حفظ إعدادات الإشعارات
function saveNotificationSettings() {
    try {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
}

// تحديث واجهة الإعدادات
function updateSettingsUI() {
    document.getElementById('enableSoundNotifications').checked = notificationSettings.soundEnabled;
    document.getElementById('notificationSound').value = notificationSettings.soundType;
    document.getElementById('enableDesktopNotifications').checked = notificationSettings.desktopEnabled;
    document.getElementById('enableWhatsAppNotifications').checked = notificationSettings.whatsappEnabled;
    document.getElementById('whatsappNumber').value = notificationSettings.whatsappNumber;
    document.getElementById('notifyNewOrders').checked = notificationSettings.notifyNewOrders;
    document.getElementById('notifyShipments').checked = notificationSettings.notifyShipments;
    document.getElementById('notifyInventory').checked = notificationSettings.notifyInventory;
    document.getElementById('notifyseasonal_plans').checked = notificationSettings.notifyseasonal_plans;
}

// تشغيل صوت الإشعارات
function playNotificationSound() {
    if (!notificationSettings.soundEnabled) return;

    const audio = new Audio();
    switch (notificationSettings.soundType) {
        case 'bell':
            audio.src = 'sounds/bell.mp3';
            break;
        case 'chime':
            audio.src = 'sounds/chime.mp3';
            break;
        case 'alert':
            audio.src = 'sounds/alert.mp3';
            break;
        default:
            audio.src = 'sounds/default.mp3';
    }
    audio.play().catch(error => console.error('Error playing notification sound:', error));
}

// إرسال إشعار سطح المكتب
async function sendDesktopNotification(title, message) {
    if (!notificationSettings.desktopEnabled) return;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/images/logo.png',
                dir: 'rtl',
                lang: 'ar'
            });
        }
    } catch (error) {
        console.error('Error sending desktop notification:', error);
    }
}

// إرسال إشعار WhatsApp
async function sendWhatsAppNotification(message) {
    if (!notificationSettings.whatsappEnabled || !notificationSettings.whatsappNumber) return;

    try {
        const whatsappNumber = notificationSettings.whatsappNumber.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
        
        // يمكن استخدام API خاص لإرسال الرسائل مباشرة
        // هنا نستخدم الرابط المباشر كبديل
        window.open(whatsappUrl, '_blank');
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
    }
}

// تحديث دالة إنشاء الإشعارات
function createNotification(notification) {
    // التحقق من نوع الإشعار
    if (!shouldNotify(notification.type)) return;

    // إضافة الإشعار إلى القائمة
    const newNotification = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        read: false,
        ...notification
    };

    notificationsList.unshift(newNotification);
    saveNotifications();
    updateNotificationsDisplay([newNotification]);

    // تشغيل الصوت
    playNotificationSound();

    // إرسال إشعار سطح المكتب
    sendDesktopNotification(
        getNotificationTitle(notification.type),
        notification.message
    );

    // إرسال إشعار WhatsApp
    sendWhatsAppNotification(notification.message);
}

// التحقق من نوع الإشعار
function shouldNotify(type) {
    switch (type) {
        case 'order':
            return notificationSettings.notifyNewOrders;
        case 'shipment':
            return notificationSettings.notifyShipments;
        case 'inventory':
            return notificationSettings.notifyInventory;
        case 'seasonal-plan':
        case 'seasonal-plan-shipping':
        case 'seasonal-plan-status':
        case 'seasonal-plan-completion':
            return notificationSettings.notifyseasonal_plans;
        default:
            return true;
    }
}

// تحديث دالة showNotificationSettings
function showNotificationSettings() {
    const modal = document.getElementById('notificationsSettingsModal');
    if (modal) {
        modal.style.display = 'block';
        updateSettingsUI();
    }
}

// إضافة مستمعي أحداث لإعدادات الإشعارات
function setupNotificationSettingsListeners() {
    const form = document.getElementById('notificationsSettingsForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        notificationSettings = {
            soundEnabled: document.getElementById('enableSoundNotifications').checked,
            soundType: document.getElementById('notificationSound').value,
            desktopEnabled: document.getElementById('enableDesktopNotifications').checked,
            whatsappEnabled: document.getElementById('enableWhatsAppNotifications').checked,
            whatsappNumber: document.getElementById('whatsappNumber').value,
            notifyNewOrders: document.getElementById('notifyNewOrders').checked,
            notifyShipments: document.getElementById('notifyShipments').checked,
            notifyInventory: document.getElementById('notifyInventory').checked,
            notifyseasonal_plans: document.getElementById('notifyseasonal_plans').checked
        };

        saveNotificationSettings();
        showToast('تم حفظ إعدادات الإشعارات بنجاح');
        document.getElementById('notificationsSettingsModal').style.display = 'none';
    });

    // طلب إذن إشعارات سطح المكتب
    const requestPermissionBtn = document.getElementById('requestNotificationPermission');
    if (requestPermissionBtn) {
        requestPermissionBtn.addEventListener('click', async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    notificationSettings.desktopEnabled = true;
                    document.getElementById('enableDesktopNotifications').checked = true;
                    showToast('تم تفعيل إشعارات سطح المكتب بنجاح');
                } else {
                    showToast('تم رفض طلب الإذن', 'error');
                }
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                showToast('حدث خطأ أثناء طلب الإذن', 'error');
            }
        });
    }
}

// تهيئة المتغيرات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loginForm = document.getElementById('loginForm');
    ordersSection = document.getElementById('ordersSection');
    loginSection = document.getElementById('loginSection');
    orderModal = document.getElementById('orderModal');
    orderForm = document.getElementById('orderForm');
    addOrderBtn = document.getElementById('addOrderBtn');
    closeBtn = document.querySelector('.close');

    // إضافة عناصر البحث والتصفية
    searchInput = document.getElementById('searchInput');
    statusFilter = document.getElementById('statusFilter');
    dateFilter = document.getElementById('dateFilter');
    
    // إضافة عناصر الشحنات
    shipmentModal = document.getElementById('shipmentModal');
    shipmentForm = document.getElementById('shipmentForm');
    addShipmentBtn = document.getElementById('addShipmentBtn');
    orderSelect = document.getElementById('orderSelect');
    
    // إضافة عناصر التخليص الجمركي
    customsModal = document.getElementById('customsModal');
    customsForm = document.getElementById('customsForm');
    addCustomsBtn = document.getElementById('addCustomsBtn');
    shipmentSelect = document.getElementById('shipmentSelect');
    
    // إضافة عناصر التكاليف
    costModal = document.getElementById('costModal');
    costForm = document.getElementById('costForm');
    addCostBtn = document.getElementById('addCostBtn');
    
    // إضافة عناصر المخزون
    inventoryModal = document.getElementById('inventoryModal');
    inventoryForm = document.getElementById('inventoryForm');
    addInventoryBtn = document.getElementById('addInventoryBtn');
    
    // إضافة مستمعي الأحداث
    setupEventListeners();
    
    // التحقق من حالة تسجيل الدخول
    checkAuthState();
    
    // إضافة مستمعي أحداث التبويب
    setupTabs();
    setupShipmentListeners();
    setupCustomsListeners();
    setupCostListeners();
    setupInventoryListeners();
    
    // إعداد لوحة المعلومات
    setupDashboard();
    
    // إضافة مستمع لزر الطباعة
    document.getElementById('printReport')?.addEventListener('click', printReport);
    
    // تحديث مستمع تصدير Excel
    document.getElementById('exportReportExcel')?.addEventListener('click', exportToExcel);
    
    // إضافة مستمع لزر تصدير PDF
    document.getElementById('exportReportPDF')?.addEventListener('click', exportToPDF);
    
    // متغيرات خطط الشراء الموسمية
    addSeasonalPlanBtn = document.getElementById('addSeasonalPlanBtn');
    seasonalPlanModal = document.getElementById('seasonalPlanModal');
    closeSeasonalPlanModal = document.getElementById('closeSeasonalPlanModal');
    seasonalPlanForm = document.getElementById('seasonalPlanForm');
    seasonalProductModal = document.getElementById('seasonalProductModal');
    closeSeasonalProductModal = document.getElementById('closeSeasonalProductModal');
    seasonalProductForm = document.getElementById('seasonalProductForm');
    productsTimelineContainer = document.getElementById('productsTimelineContainer');
    timelineSupplierName = document.getElementById('timelineSupplierName');
    productsTimelineTableBody = document.getElementById('productsTimelineTableBody');
    // مستمعي الأحداث
    setupseasonal_plansListeners();
    loadseasonal_plans();

    // تفعيل منطق الحاويات في نموذج المنتج الموسمي
    if (document.getElementById('productContainers')) {
        setupContainerDatesDynamicInput();
    }
    // زر إخفاء/إظهار الجدول الزمني
    const toggleTimelineBtn = document.getElementById('toggleTimelineBtn');
    if (toggleTimelineBtn) {
        toggleTimelineBtn.addEventListener('click', () => {
            const container = document.getElementById('productsTimelineContainer');
            if (container) {
                if (container.classList.contains('hidden')) {
                    container.classList.remove('hidden');
                } else {
                    container.classList.add('hidden');
                }
            }
        });
    }
    // استدعاء نظام التصعيد التلقائي بعد تحميل الصفحة
    checkForEscalations();

    // مقارنة الأسعار تلقائيًا عند إضافة طلب جديد
    compareProductPrice();

    // إضافة مستمعات الأحداث عند تحميل الصفحة
    if (document.getElementById('goodsType')) {
        document.getElementById('goodsType').addEventListener('input', compareProductPrice);
    }
    if (document.getElementById('containerValue')) {
        document.getElementById('containerValue').addEventListener('input', compareProductPrice);
    }
});

// تعريف دوال الإشعارات قبل setupEventListeners
function toggleNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            updateNotificationsBadge();
        }
    }
}

function updateNotificationsBadge() {
    const badge = document.getElementById('notificationsBadge');
    if (badge) {
        const unreadCount = notificationsList.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

function markAllNotificationsAsRead() {
    notificationsList.forEach(n => n.read = true);
    saveNotifications();
    filterNotifications();
    updateNotificationsBadge();
}

function clearAllNotifications() {
    if (confirm('هل أنت متأكد من مسح جميع الإشعارات؟')) {
        notificationsList = [];
        saveNotifications();
        filterNotifications();
        updateNotificationsBadge();
    }
}

function filterNotifications() {
    const filteredNotifications = currentFilter === 'all' 
        ? notificationsList 
        : notificationsList.filter(n => n.type.startsWith(currentFilter));
    
    renderNotifications(filteredNotifications);
}

function renderNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="no-notifications">لا توجد إشعارات</div>';
        return;
    }
    
    notifications.forEach(notification => {
        const notificationElement = createNotificationElement(notification);
        container.appendChild(notificationElement);
    });
}

function createNotificationElement(notification) {
    const div = document.createElement('div');
    div.className = `notification-item ${notification.read ? '' : 'unread'}`;
    
    const creationDate = new Date(notification.date);
    const formattedDate = creationDate.toLocaleDateString('ar-SA') + ' ' + creationDate.toLocaleTimeString('ar-SA');
    
    div.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">${getNotificationTitle(notification.type)}</span>
            <span class="notification-time">${formattedDate}</span>
        </div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-actions">
            ${!notification.read ? `
                <button class="mark-read" onclick="markNotificationAsRead('${notification.id}')">
                    <i class="fas fa-check"></i> تعليم كمقروء
                </button>
            ` : ''}
            <button class="delete" onclick="deleteNotification('${notification.id}')">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
    `;

    // إذا كان الإشعار من نوع escalation ويحمل رقم شحنة، اجعله قابل للنقر
    if (notification.type === 'escalation' && notification.shipmentNumber) {
        div.style.cursor = 'pointer';
        div.title = 'عرض تفاصيل الشحنة';
        div.onclick = () => {
            viewShipmentDetails(notification.shipmentNumber);
        };
    }
    return div;
}

function getNotificationTitle(type) {
    const titles = {
        'order': 'طلب جديد',
        'shipment': 'شحنة',
        'inventory': 'مخزون',
        'seasonal-plan': 'خطة موسمية',
        'seasonal-plan-shipping': 'موعد شحن',
        'seasonal-plan-status': 'تحديث حالة',
        'seasonal-plan-completion': 'إكمال خطة',
        'smart-alert': 'تنبيه ذكي'
    };
    
    return titles[type] || 'إشعار';
}

function markNotificationAsRead(notificationId) {
    const notification = notificationsList.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        saveNotifications();
        filterNotifications();
        updateNotificationsBadge();
    }
}

function deleteNotification(notificationId) {
    notificationsList = notificationsList.filter(n => n.id !== notificationId);
    saveNotifications();
    filterNotifications();
    updateNotificationsBadge();
}

function saveNotifications() {
    try {
        localStorage.setItem('notifications', JSON.stringify(notificationsList));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
}

function loadSavedNotifications() {
    try {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            notificationsList = JSON.parse(saved);
            filterNotifications();
            updateNotificationsBadge();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsList = [];
    }
}

function setupEventListeners() {
    // تسجيل الدخول
    loginForm.addEventListener('submit', handleLogin);

    // إضافة طلب جديد
    addOrderBtn.addEventListener('click', showAddOrderModal);

    // إغلاق النموذج
    closeBtn.addEventListener('click', closeModal);

    // حفظ الطلب
    orderForm.addEventListener('submit', handleOrderSubmit);

    // إضافة مستمعي أحداث للبحث والتصفية
    setupSearchAndFilters();
    
    // إضافة مستمعي أحداث الإشعارات
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationsBtn = document.getElementById('notificationsBtn');
    
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', toggleNotificationsPanel);
    }
    
    // مستمعي أزرار التحكم في الإشعارات
    const markAllReadBtn = document.getElementById('markAllRead');
    const clearAllBtn = document.getElementById('clearAllNotifications');
    const settingsBtn = document.getElementById('notificationsSettings');
    
    if (markAllReadBtn) markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllNotifications);
    if (settingsBtn) settingsBtn.addEventListener('click', showNotificationSettings);
    
    // مستمعي أزرار التصفية
    document.querySelectorAll('.notifications-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const activeBtn = document.querySelector('.notifications-filters .filter-btn.active');
            if (activeBtn) activeBtn.classList.remove('active');
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterNotifications();
        });
    });
    
    // إغلاق لوحة الإشعارات عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (notificationsPanel && 
            !notificationsPanel.contains(e.target) && 
            notificationsBtn && 
            !notificationsBtn.contains(e.target)) {
            notificationsPanel.classList.add('hidden');
        }
    });
    
    // تحميل الإشعارات المحفوظة عند بدء التطبيق
    loadSavedNotifications();
    
    // إضافة مستمعي أحداث إعدادات الإشعارات
    setupNotificationSettingsListeners();
    
    // تحميل إعدادات الإشعارات
    loadNotificationSettings();
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginSection.classList.add('hidden');
            ordersSection.classList.remove('hidden');
            loadOrders();
        })
        .catch(error => alert('خطأ في تسجيل الدخول: ' + error.message));
}

function showAddOrderModal() {
    orderForm.reset();
    document.getElementById('orderNumber').value = generateOrderNumber();
    document.getElementById('orderDate').value = new Date().toISOString().split('T')[0];
    orderModal.style.display = 'block';
}

function closeModal() {
    orderModal.style.display = 'none';
}

function handleOrderSubmit(e) {
    e.preventDefault();
    const orderData = {
        orderNumber: document.getElementById('orderNumber').value,
        supplierName: document.getElementById('supplierName').value,
        goodsType: document.getElementById('goodsType').value,
        quantity: parseFloat(document.getElementById('quantity').value),
        unit: document.getElementById('unit').value,
        packageCount: parseInt(document.getElementById('packageCount').value),
        orderDate: document.getElementById('orderDate').value,
        completionDate: document.getElementById('completionDate').value,
        containerValue: parseFloat(document.getElementById('containerValue').value),
        bookingFees: parseFloat(document.getElementById('bookingFees').value),
        status: document.getElementById('status').value
    };

    // حساب القيم التلقائية
    orderData.totalValue = orderData.containerValue + orderData.bookingFees;
    orderData.unitCost = orderData.bookingFees / orderData.quantity;

    database.ref('orders').push(orderData)
        .then(() => {
            showSuccessMessage('تم حفظ الطلب بنجاح');
            closeModal('addOrderModal');
            loadOrdersTable();
            reapplyFilters('orders'); // إعادة تطبيق الفلترة
        })
        .catch(error => {
            console.error('Error saving order:', error);
            showErrorMessage('حدث خطأ أثناء حفظ الطلب');
        });
}

function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // إخفاء قسم تسجيل الدخول
            loginSection.classList.add('hidden');
            
            // إظهار التبويبات
            document.querySelector('.tabs').classList.remove('hidden');
            
            // إظهار لوحة المعلومات
            document.getElementById('dashboardSection').classList.remove('hidden');
            
            // إخفاء باقي الأقسام
            document.querySelectorAll('.tab-content:not(#dashboardSection)').forEach(content => {
                content.classList.add('hidden');
            });
            
            // تحديث حالة الأزرار
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tab === 'dashboard') {
                    btn.classList.add('active');
                }
            });
            
            // تحميل البيانات
            loadOrders();
            loadShipments();
            loadCustoms();
            loadInventory();
            setupDashboard();
        } else {
            // إخفاء جميع الأقسام والتبويبات عند عدم تسجيل الدخول
            loginSection.classList.remove('hidden');
            document.querySelector('.tabs').classList.add('hidden');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
        }
    });
}

function loadOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    database.ref('orders').on('value', (snapshot) => {
        tableBody.innerHTML = '';
        snapshot.forEach((child) => {
            addOrderRow(child.val(), tableBody);
        });
    });
}

function generateOrderNumber() {
    return 'ORD-' + Date.now();
}

function editOrder(orderNumber) {
    database.ref('orders/' + orderNumber).once('value')
        .then((snapshot) => {
            const order = snapshot.val();
            document.getElementById('orderNumber').value = order.orderNumber;
            document.getElementById('supplierName').value = order.supplierName;
            document.getElementById('goodsType').value = order.goodsType;
            document.getElementById('quantity').value = order.quantity;
            document.getElementById('unit').value = order.unit;
            document.getElementById('packageCount').value = order.packageCount;
            document.getElementById('orderDate').value = order.orderDate;
            document.getElementById('completionDate').value = order.completionDate;
            document.getElementById('containerValue').value = order.containerValue;
            document.getElementById('bookingFees').value = order.bookingFees;
            document.getElementById('status').value = order.status;
            orderModal.style.display = 'block';
        });
}

function deleteOrder(orderNumber) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        database.ref('orders/' + orderNumber).remove()
            .then(() => {
                showSuccessMessage('تم حذف الطلب بنجاح');
                loadOrdersTable();
                reapplyFilters('orders'); // إعادة تطبيق الفلترة
            })
            .catch(error => {
                console.error('Error deleting order:', error);
                showErrorMessage('حدث خطأ أثناء حذف الطلب');
            });
    }
}

// دوال مساعدة لتنسيق البيانات
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).split('/').reverse().join('-'); // تحويل التنسيق إلى YYYY-MM-DD
}

// تعديل دالة تنسيق العملة
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount) + ' $';
}

// دالة إعداد البحث والتصفية
function setupSearchAndFilters() {
    searchInput.addEventListener('input', filterOrders);
    statusFilter.addEventListener('change', filterOrders);
    dateFilter.addEventListener('change', filterOrders);
}

// دالة تصفية الطلبات
function filterOrders() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    const dateValue = dateFilter.value;
    
    database.ref('orders').once('value').then((snapshot) => {
        const tableBody = document.getElementById('ordersTableBody');
        tableBody.innerHTML = '';
        
        snapshot.forEach((child) => {
            const order = child.val();
            
            // تطبيق التصفية حسب النص
            const matchesSearch = 
                order.orderNumber.toLowerCase().includes(searchTerm) ||
                order.supplierName.toLowerCase().includes(searchTerm) ||
                order.goodsType.toLowerCase().includes(searchTerm);
            
            // تصفية حسب الحالة
            const matchesStatus = 
                statusValue === 'all' || order.status === statusValue;
            
            // تصفية حسب التاريخ
            const orderDate = new Date(order.orderDate);
            const today = new Date();
            const start = new Date(today.setDate(today.getDate() - today.getDay()));
            const end = new Date(today.setDate(today.getDate() + 6));
            const matchesDate = dateValue === 'all' || 
                (dateValue === 'today' && isSameDay(orderDate, today)) ||
                (dateValue === 'week' && isThisWeek(orderDate)) ||
                (dateValue === 'month' && isSameMonth(orderDate, today));
            
            if (matchesSearch && matchesStatus && matchesDate) {
                // إضافة الصف إذا تطابقت جميع معايير التصفية
                addOrderRow(order, tableBody);
            }
        });
    });
}

// دالة إضافة صف الطلب
function addOrderRow(order, tableBody) {
    const row = document.createElement('tr');
    row.setAttribute('data-order-id', order.orderNumber);
    // التحقق من وجود مهام غير منجزة
    let hasPendingTask = false;
    if (order.tasks && Array.isArray(order.tasks)) {
        hasPendingTask = order.tasks.some(task => task.status !== 'منجزة');
    }
    if (hasPendingTask) row.classList.add('has-pending-task');
    row.innerHTML = `
        <td>${order.orderNumber}</td>
        <td>${order.supplierName}</td>
        <td>${order.goodsType}</td>
        <td>${order.quantity}</td>
        <td>${order.unit}</td>
        <td>${order.packageCount}</td>
        <td>${formatDate(order.orderDate)}</td>
        <td>${formatDate(order.completionDate)}</td>
        <td>${formatCurrency(order.containerValue)}</td>
        <td>${formatCurrency(order.bookingFees)}</td>
        <td>${formatCurrency(order.totalValue)}</td>
        <td>${formatCurrency(order.unitCost)}</td>
        <td>${order.status}</td>
        <td>
            <button class="edit-btn" onclick="editOrder('${order.orderNumber}')">تعديل</button>
            <button class="delete-btn" onclick="deleteOrder('${order.orderNumber}')">حذف</button>
            <button class="tasks-btn" onclick="showOrderTasksModal('${order.orderNumber}')">مهام${hasPendingTask ? ' <span class=\'pending-task-icon\'>📋</span>' : ''}</button>
            </td>
    `;
    tableBody.appendChild(row);
}

// دوال مساعدة للتواريخ
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isThisWeek(date) {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() + 6));
    return date >= weekStart && date <= weekEnd;
}

function isSameMonth(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
}

// دالة إعداد التبويب
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(tabName + 'Section').classList.remove('hidden');

            // تحميل البيانات الخاصة بكل تبويب عند الضغط فقط
            switch(tabName) {
                case 'dashboard':
                    setupDashboard();
                    break;
                case 'orders':
                    loadOrders();
                    break;
                case 'shipments':
                    loadShipments();
                    break;
                case 'customs':
                    loadCustoms();
                    break;
                case 'costs':
                    loadCosts();
                    break;
                case 'inventory':
                    loadInventory();
                    break;
                case 'seasonal_plans':
                    loadseasonal_plans();
                    break;
            }
        });
    });
}

// تحديث دالة setupShipmentListeners
function setupShipmentListeners() {
    addShipmentBtn.addEventListener('click', showAddShipmentModal);
    shipmentForm.addEventListener('submit', handleShipmentSubmit);
    
    // إضافة مستمع لزر الإغلاق
    const shipmentCloseBtn = shipmentModal.querySelector('.close');
    shipmentCloseBtn.addEventListener('click', closeShipmentModal);
    
    // إغلاق النموذج عند النقر خارج المحتوى
    window.addEventListener('click', (e) => {
        if (e.target === shipmentModal) {
            closeShipmentModal();
        }
    });
    
    // مستمع تغيير الطلب
    orderSelect.addEventListener('change', function() {
        if (this.value) {
            loadOrderDetails(this.value);
        }
    });
    
    // تهيئة معالجة تحميل المستندات
    setupDocumentUpload();
    
    // تفعيل حقل البحث والتصفية في تبويب الشحنات
    document.getElementById('shipmentSearch').addEventListener('input', filterShipments);
    document.getElementById('filterStatus').addEventListener('change', filterShipments);
}

// إضافة دالة إغلاق نموذج الشحنة
function closeShipmentModal() {
    shipmentModal.style.display = 'none';
    shipmentForm.reset();
    currentFiles.clear();
    
    // إعادة تعيين حالة المستندات
    document.querySelectorAll('.document-box').forEach(box => {
        box.classList.remove('uploaded', 'error');
        box.querySelector('.upload-status').textContent = '';
    });
}

// تحديث دالة showAddShipmentModal
function showAddShipmentModal() {
    shipmentForm.reset();
    document.getElementById('shipmentModalTitle').textContent = 'إضافة شحنة جديدة';
    document.getElementById('shipmentNumber').value = generateShipmentNumber();
    loadShippableOrders();
    currentFiles.clear(); // مسح الملفات السابقة
    
    // إعادة تعيين حالة المستندات
    document.querySelectorAll('.document-box').forEach(box => {
        box.classList.remove('uploaded', 'error');
        box.querySelector('.upload-status').textContent = '';
    });
    
    shipmentModal.style.display = 'block';
}

// دالة تحميل الطلبات القابلة للشحن
function loadShippableOrders() {
    orderSelect.innerHTML = '<option value="">اختر رقم الطلب</option>';
    database.ref('orders').once('value')
        .then((snapshot) => {
            snapshot.forEach((child) => {
                const order = child.val();
                // التحقق من وجود جميع البيانات المطلوبة
                if (order && order.orderNumber) {
                    const option = document.createElement('option');
                    option.value = order.orderNumber;
                    
                    // التحقق من وجود البيانات وتوفير قيم بديلة إذا كانت غير موجودة
                    const goodsType = order.goodsType || "بدون نوع";
                    const status = order.status || "بدون حالة";
                    
                    option.textContent = `${order.orderNumber} - ${goodsType} (${status})`;
                    orderSelect.appendChild(option);
                }
            });
        });
}

// دالة تحميل تفاصيل الطلب
function loadOrderDetails(orderNumber) {
    database.ref('orders/' + orderNumber).once('value')
        .then((snapshot) => {
            const order = snapshot.val();
            if (order) {
                // التحقق من وجود كل قيمة قبل تعيينها، واستخدام قيمة فارغة كبديل إذا كانت غير موجودة
                document.getElementById('goodsTypeShipment').value = order.goodsType || '';
                document.getElementById('quantityShipment').value = order.quantity || '';
                document.getElementById('unitShipment').value = order.unit || '';
                document.getElementById('shipmentDate').value = order.completionDate || '';
            } else {
                // إذا لم يتم العثور على الطلب، نقوم بتفريغ الحقول
                document.getElementById('goodsTypeShipment').value = '';
                document.getElementById('quantityShipment').value = '';
                document.getElementById('unitShipment').value = '';
                document.getElementById('shipmentDate').value = '';
            }
        });
}

// تحديث دالة handleShipmentSubmit
function handleShipmentSubmit(e) {
    e.preventDefault();

    const shipmentData = {
        shipmentNumber: document.getElementById('shipmentNumber').value,
        orderNumber: orderSelect.value,
        blNumber: document.getElementById('blNumber').value,
        containerNumber: document.getElementById('containerNumber').value,
        goodsType: document.getElementById('goodsTypeShipment').value,
        quantity: document.getElementById('quantityShipment').value,
        unit: document.getElementById('unitShipment').value,
        shipmentDate: document.getElementById('shipmentDate').value,
        arrivalDate: document.getElementById('arrivalDate').value,
        shippingCompany: document.getElementById('shippingCompany').value,
        status: document.getElementById('shipmentStatus').value,
        notes: document.getElementById('shipmentNotes').value || '', // إضافة حقل الملاحظات
        documents: {}, // كائن فارغ للمستندات
        notificationSent: false // إضافة حقل جديد لتتبع حالة التنبيه
    };

    // إضافة المستندات المتوفرة فقط
    if (currentFiles.has('invoice')) {
        shipmentData.documents.invoice = currentFiles.get('invoice');
    }
    if (currentFiles.has('certificate')) {
        shipmentData.documents.certificate = currentFiles.get('certificate');
    }
    if (currentFiles.has('policy')) {
        shipmentData.documents.policy = currentFiles.get('policy');
    }
    if (currentFiles.has('packingList')) {
        shipmentData.documents.packingList = currentFiles.get('packingList');
    }

    database.ref('shipments').push(shipmentData)
        .then(() => {
            showSuccessMessage('تم حفظ الشحنة بنجاح');
            closeModal('addShipmentModal');
            loadShipmentsTable();
            reapplyFilters('shipments'); // إعادة تطبيق الفلترة
        })
        .catch(error => {
            console.error('Error saving shipment:', error);
            showErrorMessage('حدث خطأ أثناء حفظ الشحنة');
        });
}

// تحديث دالة setupDocumentUpload
function setupDocumentUpload() {
    const documentInputs = document.querySelectorAll('.file-input');
    documentInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const documentBox = this.parentElement;
            const statusDiv = documentBox.querySelector('.upload-status');
            const file = e.target.files[0];
            
            if (file) {
                // التحقق من حجم الملف (مثلاً: الحد الأقصى 5 ميجابايت)
                if (file.size > 5 * 1024 * 1024) {
                    statusDiv.textContent = 'حجم الملف كبير جداً';
                    documentBox.classList.add('error');
                    return;
                }

                // إظهار حالة التحميل
                statusDiv.textContent = 'جاري التحميل...';
                documentBox.classList.remove('uploaded', 'error');
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                // رفع الملف إلى Cloudinary
                fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    // تحديث حالة الملف وتخزين رابط الملف
                    const fileId = data.public_id;
                    currentFiles.set(input.name, {
                        id: fileId,
                        url: data.secure_url,
                        name: file.name,
                        type: file.type
                    });
                    
                    statusDiv.textContent = 'تم التحميل';
                    documentBox.classList.add('uploaded');
                })
                .catch(error => {
                    statusDiv.textContent = 'فشل التحميل';
                    documentBox.classList.add('error');
                    console.error('خطأ في رفع الملف:', error);
                });
            }
        });
    });
}

// تحديث دالة عرض المستندات
function viewDocuments(shipmentNumber) {
    database.ref('shipments/' + shipmentNumber).once('value')
        .then((snapshot) => {
            const shipment = snapshot.val();
            const documents = shipment.documents;
            
            if (documents) {
                const documentsWindow = window.open('', '_blank');
                documentsWindow.document.write(`
                    <html dir="rtl">
                    <head>
                        <title>مستندات الشحنة ${shipmentNumber}</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                padding: 20px;
                                background: #f5f5f5;
                            }
                            .documents-grid {
                                display: grid;
                                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                gap: 20px;
                                padding: 20px;
                            }
                            .document-card {
                                background: white;
                                padding: 15px;
                                border-radius: 8px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            }
                            .document-card h3 {
                                margin: 0 0 10px 0;
                                color: #333;
                            }
                            .document-card a {
                                color: #2196F3;
                                text-decoration: none;
                                display: block;
                                margin-top: 10px;
                            }
                            .document-card a:hover {
                                text-decoration: underline;
                            }
                        </style>
                    </head>
                    <body>
                        <h2>مستندات الشحنة ${shipmentNumber}</h2>
                        <div class="documents-grid">
                            ${documents.invoice ? `
                                <div class="document-card">
                                    <h3>الفاتورة</h3>
                                    <a href="${documents.invoice.url}" target="_blank">عرض المستند</a>
                                </div>
                            ` : ''}
                            ${documents.certificate ? `
                                <div class="document-card">
                                    <h3>شهادة المنشأ</h3>
                                    <a href="${documents.certificate.url}" target="_blank">عرض المستند</a>
                                </div>
                            ` : ''}
                            ${documents.policy ? `
                                <div class="document-card">
                                    <h3>البوليصة</h3>
                                    <a href="${documents.policy.url}" target="_blank">عرض المستند</a>
                                </div>
                            ` : ''}
                            ${documents.packingList ? `
                                <div class="document-card">
                                    <h3>قائمة التعبئة</h3>
                                    <a href="${documents.packingList.url}" target="_blank">عرض المستند</a>
                                </div>
                            ` : ''}
                        </div>
                    </body>
                    </html>
                `);
            } else {
                alert('لا توجد مستندات لهذه الشحنة');
            }
        });
}

// تحديث دالة حذف ملف
function removeFile(fileId) {
    currentFiles.delete(fileId);
    const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileItem) {
        fileItem.remove();
    }
}

// دالة توليد رقم شحنة
function generateShipmentNumber() {
    return 'SHP-' + Date.now();
}

// دالة إظهار حالة التحميل
function showLoading(container) {
    const loader = document.createElement('div');
    loader.className = 'loader-container';
    loader.innerHTML = `
        <div class="loader"></div>
        <p>جاري التحميل...</p>
    `;
    container.appendChild(loader);
}

// دالة إخفاء حالة التحميل
function hideLoading(container) {
    const loader = container.querySelector('.loader-container');
    if (loader) {
        loader.remove();
    }
}

// تحديث دالة تحميل الشحنات
function loadShipments() {
    const tableBody = document.getElementById('shipmentsTableBody');
    const container = document.querySelector('.table-container');
    showLoading(container);

    // إزالة أي مستمع قديم لمنع التكرار
    database.ref('shipments').off('value');

    database.ref('shipments').on('value', (snapshot) => {
        hideLoading(container);
        tableBody.innerHTML = '';
        snapshot.forEach((child) => {
            const shipment = child.val();
            addShipmentRow(shipment, tableBody);
        });
    });
}

// تحديث دالة إضافة صف شحنة
function addShipmentRow(shipment, tableBody) {
    const row = document.createElement('tr');
    row.setAttribute('data-shipment-id', shipment.shipmentNumber);
    // التحقق من وجود مهام غير منجزة
    let hasPendingTask = false;
    if (shipment.tasks && Array.isArray(shipment.tasks)) {
        hasPendingTask = shipment.tasks.some(task => task.status !== 'منجزة');
    }
    if (hasPendingTask) row.classList.add('has-pending-task');
    row.innerHTML = `
            <td>${shipment.blNumber}</td>
            <td>${shipment.containerNumber}</td>
            <td>${shipment.goodsType}</td>
            <td>${shipment.quantity}</td>
            <td>${shipment.unit}</td>
            <td>${formatDate(shipment.shipmentDate)}</td>
            <td>${formatDate(shipment.arrivalDate)}</td>
            <td>${shipment.shippingCompany}</td>
        <td>${shipment.status}</td>
        <td>${shipment.documents ? Object.keys(shipment.documents).length : 0}</td>
        <td>
            <button class="edit-btn" onclick="editShipment('${shipment.shipmentNumber}')">تعديل</button>
            <button class="delete-btn" onclick="deleteShipment('${shipment.shipmentNumber}')">حذف</button>
            <button class="tasks-btn" onclick="showShipmentTasksModal('${shipment.shipmentNumber}')">مهام${hasPendingTask ? ' <span class=\'pending-task-icon\'>📋</span>' : ''}</button>
            </td>
    `;
    tableBody.appendChild(row);
}

// تحديث دالة editShipment لتحميل المستندات الموجودة
function editShipment(shipmentNumber) {
    database.ref('shipments/' + shipmentNumber).once('value')
        .then((snapshot) => {
            const shipment = snapshot.val();
            if (shipment) {
                // إعادة تعيين النموذج أولاً
                shipmentForm.reset();
                
                // تحديث العنوان ليشير إلى التعديل
                document.getElementById('shipmentModalTitle').textContent = 'تعديل الشحنة';
                
                // تعيين رقم الشحنة
                document.getElementById('shipmentNumber').value = shipment.shipmentNumber;
                
                // تحميل الطلبات المتاحة للشحن أولاً
                loadShippableOrders();
                
                // استخدام setTimeout للتأكد من تحميل القائمة المنسدلة للطلبات أولاً
                setTimeout(() => {
                    document.getElementById('orderSelect').value = shipment.orderNumber;
                    document.getElementById('blNumber').value = shipment.blNumber;
                    document.getElementById('containerNumber').value = shipment.containerNumber;
                    document.getElementById('goodsTypeShipment').value = shipment.goodsType;
                    document.getElementById('quantityShipment').value = shipment.quantity;
                    document.getElementById('unitShipment').value = shipment.unit;
                    document.getElementById('shipmentDate').value = shipment.shipmentDate;
                    document.getElementById('arrivalDate').value = shipment.arrivalDate;
                    document.getElementById('shippingCompany').value = shipment.shippingCompany;
                    document.getElementById('shipmentStatus').value = shipment.status;
                    document.getElementById('shipmentNotes').value = shipment.notes;
                
                    // تحميل المستندات الموجودة
                    currentFiles.clear();
                    if (shipment.documents) {
                        Object.entries(shipment.documents).forEach(([key, doc]) => {
                            currentFiles.set(key, doc);
                            const documentBox = document.querySelector(`#${key}`).parentElement;
                            const statusDiv = documentBox.querySelector('.upload-status');
                            statusDiv.textContent = 'تم التحميل';
                            documentBox.classList.add('uploaded');
                        });
                    }
                }, 300);
                
                shipmentModal.style.display = 'block';
            }
        });
}

// إضافة دالة حذف الشحنة
function deleteShipment(shipmentNumber) {
    // التحقق من حالة الشحنة أولاً
    database.ref('shipments/' + shipmentNumber).once('value')
        .then((snapshot) => {
            const shipment = snapshot.val();
            if (!shipment) {
                showErrorMessage('لم يتم العثور على الشحنة');
                return;
            }

            // التحقق من وجود مهام غير منجزة
            const hasPendingTasks = shipment.tasks && 
                Array.isArray(shipment.tasks) && 
                shipment.tasks.some(task => task.status !== 'منجزة');

            // التحقق من وجود مستندات
            const hasDocuments = shipment.documents && 
                Object.keys(shipment.documents).length > 0;

            // بناء رسالة التأكيد
            let confirmMessage = 'هل أنت متأكد من حذف هذه الشحنة؟\n\n';
            confirmMessage += `رقم الشحنة: ${shipmentNumber}\n`;
            confirmMessage += `نوع البضاعة: ${shipment.goodsType}\n`;
            confirmMessage += `الحالة الحالية: ${shipment.status}\n\n`;

            if (hasPendingTasks) {
                confirmMessage += '⚠️ تنبيه: هناك مهام غير منجزة مرتبطة بهذه الشحنة\n';
            }
            if (hasDocuments) {
                confirmMessage += '⚠️ تنبيه: هناك مستندات مرتبطة بهذه الشحنة\n';
            }
            confirmMessage += '\nسيتم حذف جميع البيانات المرتبطة بالشحنة نهائياً.';

            if (confirm(confirmMessage)) {
                // إنشاء سجل الحذف
                const deletionRecord = {
                    shipmentNumber: shipmentNumber,
                    deletedAt: new Date().toISOString(),
                    deletedBy: firebase.auth().currentUser?.email || 'غير معروف',
                    shipmentData: {
                        goodsType: shipment.goodsType,
                        status: shipment.status,
                        blNumber: shipment.blNumber,
                        containerNumber: shipment.containerNumber
                    }
                };

                // حفظ سجل الحذف
                database.ref('deletionLogs/shipments').push(deletionRecord)
                    .then(() => {
                        // حذف المستندات المرتبطة أولاً
                        const deletePromises = [];
                        if (shipment.documents) {
                            Object.values(shipment.documents).forEach(doc => {
                                if (doc.url) {
                                    const storageRef = firebase.storage().refFromURL(doc.url);
                                    deletePromises.push(storageRef.delete());
                                }
                            });
                        }

                        // تنفيذ حذف المستندات ثم حذف الشحنة
                        Promise.all(deletePromises)
                            .then(() => {
                                return database.ref('shipments/' + shipmentNumber).remove();
                            })
                            .then(() => {
                                showSuccessMessage('تم حذف الشحنة وجميع البيانات المرتبطة بها بنجاح');
                                loadShipments(); // إعادة تحميل جدول الشحنات
                                loadUpcomingShipments(); // تحديث لوحة المعلومات
                            })
                            .catch(error => {
                                console.error('Error deleting shipment:', error);
                                showErrorMessage('حدث خطأ أثناء حذف الشحنة: ' + error.message);
                            });
                    })
                    .catch(error => {
                        console.error('Error saving deletion log:', error);
                        showErrorMessage('حدث خطأ أثناء حفظ سجل الحذف');
                    });
            }
        })
        .catch(error => {
            console.error('Error checking shipment:', error);
            showErrorMessage('حدث خطأ أثناء التحقق من بيانات الشحنة');
        });
}

// تحديث دالة تصفية الشحنات بإضافة تصفية متقدمة
function filterShipments() {
    const searchTerm = document.getElementById('shipmentSearch').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const rows = document.querySelectorAll('#shipmentsTableBody tr');
    
    let matchCount = 0;

    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        let textMatch = false;
        
        // البحث في النص
        for (let cell of cells) {
            if (cell.textContent.toLowerCase().includes(searchTerm)) {
                textMatch = true;
                break;
            }
        }
        
        // التحقق من الحالة
        const statusCell = row.querySelector('td:nth-child(9)');
        const shipmentStatus = statusCell ? statusCell.textContent.trim() : '';
        const statusMatch = statusFilter === 'all' || shipmentStatus === statusFilter;

        // التحقق من التاريخ
        const dateCell = row.querySelector('td:nth-child(7)'); // عمود تاريخ الوصول
        const orderDate = new Date(dateCell?.textContent);
        const today = new Date();
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        const dateMatch = start && end ? orderDate >= start && orderDate <= end :
            start ? orderDate >= start :
            end ? orderDate <= end : true;

        // عرض/إخفاء الصف
        const shouldShow = textMatch && statusMatch && dateMatch;
        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) matchCount++;
    });

    updateResultsCount(matchCount);
}

// دالة التحقق من نطاق التاريخ
function checkDateRange(dateStr, startDate, endDate) {
    if (!startDate && !endDate) return true;
    if (!dateStr) return false;

    const date = new Date(dateStr);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end) {
        return date >= start && date <= end;
    } else if (start) {
        return date >= start;
    } else if (end) {
        return date <= end;
    }
    return true;
}

// إضافة مستمعي الأحداث للتواريخ
document.getElementById('startDate').addEventListener('change', filterShipments);
document.getElementById('endDate').addEventListener('change', filterShipments);

// دالة تمييز النص المطابق
function highlightMatchedText(cell, searchTerms) {
    const originalText = cell.textContent;
    let highlightedText = originalText;
    
    searchTerms.forEach(term => {
        if (term) {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        }
    });
    
    cell.innerHTML = highlightedText;
}

// دالة تحديث عداد النتائج
function updateResultsCount(count) {
    const searchContainer = document.querySelector('.search-container');
    let resultsCounter = searchContainer.querySelector('.results-counter');
    
    if (!resultsCounter) {
        resultsCounter = document.createElement('div');
        resultsCounter.className = 'results-counter';
        searchContainer.appendChild(resultsCounter);
    }
    
    resultsCounter.textContent = `تم العثور على ${count} نتيجة`;
}

// تحديث دالة عرض تفاصيل الشحنة
function viewShipmentDetails(shipmentNumber) {
    const detailsModal = document.getElementById('shipmentDetailsModal');
    const detailsContent = document.getElementById('shipmentDetailsContent');
    
    database.ref('shipments/' + shipmentNumber).once('value')
        .then((snapshot) => {
            const shipment = snapshot.val();
            if (shipment) {
                detailsContent.innerHTML = `
                    <h2>تفاصيل الشحنة ${shipmentNumber}</h2>
                    
                    <div class="details-grid">
                        <div class="detail-group">
                            <div class="detail-label">رقم الطلب</div>
                            <div class="detail-value">${shipment.orderNumber}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">رقم BL</div>
                            <div class="detail-value">${shipment.blNumber}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">رقم الحاوية</div>
                            <div class="detail-value">${shipment.containerNumber}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">نوع البضاعة</div>
                            <div class="detail-value">${shipment.goodsType}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">الكمية</div>
                            <div class="detail-value">${shipment.quantity}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">تاريخ الشحن</div>
                            <div class="detail-value">${formatDate(shipment.shipmentDate)}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">موعد الوصول</div>
                            <div class="detail-value">${formatDate(shipment.arrivalDate)}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">شركة الشحن</div>
                            <div class="detail-value">${shipment.shippingCompany}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">الحالة</div>
                            <div class="detail-value">${shipment.status}</div>
                        </div>
                        <div class="detail-group">
                            <div class="detail-label">ملاحظات</div>
                            <div class="detail-value">${shipment.notes}</div>
                        </div>
                    </div>

                    <div class="documents-section">
                        <h3>المستندات</h3>
                        <div class="documents-grid">
                            ${shipment.documents?.invoice ? `
                                <a href="${shipment.documents.invoice.url}" target="_blank" class="document-link">
                                    <i class="fas fa-file-invoice"></i>
                                    <span>الفاتورة</span>
                                </a>
                            ` : ''}
                            ${shipment.documents?.certificate ? `
                                <a href="${shipment.documents.certificate.url}" target="_blank" class="document-link">
                                    <i class="fas fa-certificate"></i>
                                    <span>شهادة المنشأ</span>
                                </a>
                            ` : ''}
                            ${shipment.documents?.policy ? `
                                <a href="${shipment.documents.policy.url}" target="_blank" class="document-link">
                                    <i class="fas fa-file-contract"></i>
                                    <span>البوليصة</span>
                                </a>
                            ` : ''}
                            ${shipment.documents?.packingList ? `
                                <a href="${shipment.documents.packingList.url}" target="_blank" class="document-link">
                                    <i class="fas fa-list-alt"></i>
                                    <span>قائمة التعبئة</span>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                detailsModal.style.display = 'block';
            }
        });
}

// إضافة دالة إغلاق نافذة التفاصيل
function closeDetailsModal() {
    const detailsModal = document.getElementById('shipmentDetailsModal');
    detailsModal.style.display = 'none';
}

// إضافة مستمع لإغلاق النافذة عند النقر خارجها
window.addEventListener('click', (e) => {
    const detailsModal = document.getElementById('shipmentDetailsModal');
    if (e.target === detailsModal) {
        closeDetailsModal();
    }
});

// دالة إعداد مستمعي أحداث التخليص الجمركي
function setupCustomsListeners() {
    addCustomsBtn.addEventListener('click', showAddCustomsModal);
    customsForm.addEventListener('submit', handleCustomsSubmit);
    
    // إضافة مستمع لزر الإغلاق
    const customsCloseBtn = customsModal.querySelector('.close');
    customsCloseBtn.addEventListener('click', closeCustomsModal);
    
    // إغلاق النموذج عند النقر خارج المحتوى
    window.addEventListener('click', (e) => {
        if (e.target === customsModal) {
            closeCustomsModal();
        }
    });
    
    // مستمع تغيير الشحنة
    shipmentSelect.addEventListener('change', function() {
        if (this.value) {
            loadShipmentDetails(this.value);
        }
    });

    // مستمع تغيير التكلفة الجمركية
    document.getElementById('customsCost').addEventListener('input', function() {
        // استدعاء دالة الحساب إذا كانت موجودة
        if (typeof calculateCustomsCostPerMeter === 'function') {
            calculateCustomsCostPerMeter();
        }
    });

    setupCustomsFilters();
    loadCustoms(); // تحميل البيانات الأولية
}

// تحديث دالة showAddCustomsModal
function showAddCustomsModal() {
    customsForm.reset();
    document.getElementById('customsNumber').value = generateCustomsNumber();
    loadAvailableShipments();
    customsModal.style.display = 'block';
}

// دالة توليد رقم تخليص
function generateCustomsNumber() {
    return 'CUS-' + Date.now();
}

// دالة تحميل الشحنات المتاحة
function loadAvailableShipments() {
    shipmentSelect.innerHTML = '<option value="">اختر رقم الشحنة</option>';
    database.ref('shipments').once('value')
        .then((snapshot) => {
            snapshot.forEach((child) => {
                const shipment = child.val();
                const option = document.createElement('option');
                option.value = shipment.shipmentNumber;
                option.textContent = `${shipment.shipmentNumber} - ${shipment.goodsType}`;
                shipmentSelect.appendChild(option);
            });
        });
}

// دالة تحميل تفاصيل الشحنة
function loadShipmentDetails(shipmentNumber) {
    database.ref('shipments/' + shipmentNumber).once('value')
        .then((snapshot) => {
            const shipment = snapshot.val();
            document.getElementById('goodsTypeCustoms').value = shipment.goodsType;
            document.getElementById('quantityCustoms').value = shipment.quantity;
            calculateCostPerMeter();
        });
}

// تحديث دالة handleCustomsSubmit
function handleCustomsSubmit(e) {
    e.preventDefault();
    
    const customsData = {
        customsNumber: document.getElementById('customsNumber').value,
        shipmentNumber: shipmentSelect.value,
        country: document.getElementById('customsCountry').value,
        goodsType: document.getElementById('goodsTypeCustoms').value,
        quantity: document.getElementById('quantityCustoms').value,
        customsCost: document.getElementById('customsCost').value,
        costPerMeter: document.getElementById('costPerMeter').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        responsibleEmployee: document.getElementById('responsibleEmployee').value
    };

    database.ref('customs/' + customsData.customsNumber).set(customsData)
        .then(() => {
            customsModal.style.display = 'none';
            loadCustoms();
        })
        .catch(error => alert('خطأ في حفظ التخليص: ' + error.message));
}

// دالة تحميل التخليصات
function loadCustoms() {
    const tableBody = document.getElementById('customsTableBody');
    database.ref('customs').on('value', (snapshot) => {
        tableBody.innerHTML = '';
        snapshot.forEach((child) => {
            const customs = child.val();
            addCustomsRow(customs, tableBody);
        });
    });
}

// دالة إضافة صف تخليص
function addCustomsRow(customs, tableBody) {
    const row = `
        <tr>
            <td>${customs.country}</td>
            <td>${customs.goodsType}</td>
            <td>${customs.quantity}</td>
            <td>${customs.customsCost}</td>
            <td>${customs.costPerMeter}</td>
            <td>${formatDate(customs.startDate)}</td>
            <td>${formatDate(customs.endDate)}</td>
            <td>${customs.responsibleEmployee}</td>
            <td>
                <div class="action-icons">
                    <button class="icon-btn edit" onclick="editCustoms('${customs.customsNumber}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteCustoms('${customs.customsNumber}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="icon-btn view" onclick="viewCustomsDetails('${customs.customsNumber}')" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    tableBody.innerHTML += row;
}

// دالة إغلاق نموذج إضافة تخليص جمركي
function closeCustomsModal() {
    customsModal.style.display = 'none';
    customsForm.reset();
}

// دالة تعديل التخليص الجمركي
function editCustoms(customsNumber) {
    database.ref('customs/' + customsNumber).once('value')
        .then((snapshot) => {
            const customs = snapshot.val();
            if (customs) {
                document.getElementById('customsNumber').value = customs.customsNumber;
                document.getElementById('shipmentSelect').value = customs.shipmentNumber;
                document.getElementById('customsCountry').value = customs.country;
                document.getElementById('goodsTypeCustoms').value = customs.goodsType;
                document.getElementById('quantityCustoms').value = customs.quantity;
                document.getElementById('customsCost').value = customs.customsCost;
                document.getElementById('costPerMeter').value = customs.costPerMeter;
                document.getElementById('startDate').value = customs.startDate;
                document.getElementById('endDate').value = customs.endDate;
                document.getElementById('responsibleEmployee').value = customs.responsibleEmployee;
                
                customsModal.style.display = 'block';
            }
        });
}

// تحديث دالة عرض تفاصيل التخليص الجمركي
function viewCustomsDetails(customsNumber) {
    const detailsModal = document.getElementById('shipmentDetailsModal');
    const detailsContent = document.getElementById('shipmentDetailsContent');
    
    database.ref('customs/' + customsNumber).once('value')
        .then((snapshot) => {
            const customs = snapshot.val();
            if (customs) {
                detailsContent.innerHTML = `
                    <h2>تفاصيل التخليص الجمركي ${customsNumber}</h2>
                    
                    <div class="details-grid">
                        <div class="detail-group">
                            <div class="detail-label">رقم الشحنة</div>
                            <div class="detail-value">${customs.shipmentNumber}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">بلد التخليص</div>
                            <div class="detail-value">${customs.country}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">نوع البضاعة</div>
                            <div class="detail-value">${customs.goodsType}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">الكمية</div>
                            <div class="detail-value">${customs.quantity}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">التكلفة الجمركية</div>
                            <div class="detail-value">${customs.customsCost} $</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">تكلفة المتر</div>
                            <div class="detail-value">${customs.costPerMeter} $</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">تاريخ البدء</div>
                            <div class="detail-value">${formatDate(customs.startDate)}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">تاريخ الانتهاء</div>
                            <div class="detail-value">${formatDate(customs.endDate)}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">الموظف المسؤول</div>
                            <div class="detail-value">${customs.responsibleEmployee}</div>
                        </div>
                    </div>
                `;
                
                detailsModal.style.display = 'block';
            }
        });
}

// تحديث دالة تحميل التخليصات لتشمل البحث والتصفية
function setupCustomsFilters() {
    const searchInput = document.getElementById('customsSearchInput');
    const countryFilter = document.getElementById('customsCountryFilter');
    
    searchInput.addEventListener('input', filterCustoms);
    countryFilter.addEventListener('change', filterCustoms);
    
    // تحميل قائمة البلدان للتصفية
    database.ref('customs').once('value')
        .then((snapshot) => {
            const countries = new Set();
            snapshot.forEach((child) => {
                const customs = child.val();
                if (customs.country) {
                    countries.add(customs.country);
                }
            });
            
            countryFilter.innerHTML = '<option value="all">جميع البلدان</option>';
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countryFilter.appendChild(option);
            });
        });
}

// دالة تصفية التخليصات
function filterCustoms() {
    const searchValue = document.getElementById('customsSearchInput').value.toLowerCase();
    const countryValue = document.getElementById('customsCountryFilter').value;
    
    database.ref('customs').on('value', (snapshot) => {
        const tableBody = document.getElementById('customsTableBody');
        tableBody.innerHTML = '';
        
        snapshot.forEach((child) => {
            const customs = child.val();
            const matchesSearch = customs.goodsType.toLowerCase().includes(searchValue) ||
                                customs.responsibleEmployee.toLowerCase().includes(searchValue);
            const matchesCountry = countryValue === 'all' || customs.country === countryValue;
            
            if (matchesSearch && matchesCountry) {
                addCustomsRow(customs, tableBody);
            }
        });
    });
}

// دالة إعداد مستمعي أحداث التكاليف
// دالة عرض نموذج إضافة تكاليف جديدة
function showAddCostModal() {
    // إعادة تعيين النموذج
    costForm.reset();
    
    // تعيين عنوان النافذة
    document.getElementById('costModalTitle').textContent = 'إضافة تكلفة جديدة';
    
    // إظهار النموذج
    costModal.style.display = 'block';
}

// دالة إغلاق نموذج التكاليف
function closeCostModal() {
    costModal.style.display = 'none';
}

function setupCostListeners() {
    // التحقق من وجود العناصر قبل إضافة مستمعي الأحداث
    if (typeof addCostBtn !== 'undefined' && addCostBtn) {
        addCostBtn.addEventListener('click', showAddCostModal);
    }
    
    if (typeof costForm !== 'undefined' && costForm) {
        costForm.addEventListener('submit', handleCostSubmit);
    }
    
    // إضافة مستمع لزر الإغلاق
    if (typeof costModal !== 'undefined' && costModal) {
        const costCloseBtn = costModal.querySelector('.close');
        if (costCloseBtn) {
            costCloseBtn.addEventListener('click', closeCostModal);
        }
        
        // إغلاق النموذج عند النقر خارج المحتوى
        window.addEventListener('click', (e) => {
            if (e.target === costModal) {
                closeCostModal();
            }
        });
    }
    
    // مستمع تغيير الشحنة
    const shipmentSelectCost = document.getElementById('shipmentSelectCost');
    if (shipmentSelectCost) {
        shipmentSelectCost.addEventListener('change', function() {
            if (this.value) {
                loadShipmentQuantity(this.value);
            }
        });
    }

    // دالة حساب التكلفة لكل متر
    function calculateCostPerMeterValue() {
        const costValueElement = document.getElementById('costValue');
        const costQuantityElement = document.getElementById('costQuantity');
        const costPerUnitField = document.getElementById('costPerUnit');
        
        if (!costValueElement || !costQuantityElement || !costPerUnitField) {
            return; // تجاهل إذا كان أي من العناصر غير موجود
        }
        
        const costValue = parseFloat(costValueElement.value) || 0;
        const quantity = parseFloat(costQuantityElement.value) || 1;
        
        // حساب التكلفة لكل متر/قطعة
        const costPerUnit = quantity > 0 ? costValue / quantity : 0;
        
        // تعيين القيمة في الحقل المناسب
        costPerUnitField.value = costPerUnit.toFixed(2);
    }

    // مستمع تغيير قيمة التكلفة
    const costValueElement = document.getElementById('costValue');
    if (costValueElement) {
        costValueElement.addEventListener('input', calculateCostPerMeterValue);
    }
    
    // مستمع تغيير الكمية لإعادة حساب التكلفة للوحدة
    const costQuantityElement = document.getElementById('costQuantity');
    if (costQuantityElement) {
        costQuantityElement.addEventListener('input', calculateCostPerMeterValue);
    }
    
    // إعداد البحث
    const costSearchInputElement = document.getElementById('costSearchInput');
    if (costSearchInputElement) {
        costSearchInputElement.addEventListener('input', filterCosts);
    }
    
    // تحميل البيانات الأولية
    loadCosts();
}

// تحديث دالة handleCostSubmit
function handleCostSubmit(e) {
    e.preventDefault();
    
    const costData = {
        shipmentNumber: document.getElementById('shipmentSelectCost').value,
        description: document.getElementById('costDescription').value,
        value: document.getElementById('costValue').value,
        costPerMeter: document.getElementById('costPerMeterValue').value
    };

    database.ref('additional_costs/' + `cost-${Date.now()}`).set(costData)
        .then(() => {
            costModal.style.display = 'none';
            loadCosts();
        })
        .catch(error => alert('خطأ في حفظ التكلفة: ' + error.message));
}

// دالة تحميل التكاليف
function loadCosts() {
    const tableBody = document.getElementById('costsTableBody');
    database.ref('additional_costs').on('value', (snapshot) => {
        tableBody.innerHTML = '';
        snapshot.forEach((child) => {
            const cost = child.val();
            cost.id = child.key;
            addCostRow(cost, tableBody);
        });
    });
}

// دالة إضافة صف تكلفة
function addCostRow(cost, tableBody) {
    const row = `
        <tr>
            <td>${cost.shipmentNumber}</td>
            <td>${cost.description}</td>
            <td>${cost.value}</td>
            <td>${cost.costPerMeter}</td>
            <td>
                <div class="action-icons">
                    <button class="icon-btn edit" onclick="editCost('${cost.id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteCost('${cost.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="icon-btn view" onclick="viewCostDetails('${cost.id}')" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    tableBody.innerHTML += row;
}

// دالة إغلاق نموذج التكلفة
function closeCostModal() {
    costModal.style.display = 'none';
    costForm.reset();
}

// دالة تعديل التكلفة
function editCost(costId) {
    database.ref('additional_costs/' + costId).once('value')
        .then((snapshot) => {
            const cost = snapshot.val();
            if (cost) {
                document.getElementById('shipmentSelectCost').value = cost.shipmentNumber;
                document.getElementById('costDescription').value = cost.description;
                document.getElementById('costValue').value = cost.value;
                document.getElementById('costPerMeterValue').value = cost.costPerMeter;
                
                costForm.dataset.editId = costId;
                
                costModal.style.display = 'block';
                loadShipmentQuantity(cost.shipmentNumber);
            }
        });
}

// دالة حذف التكلفة
function deleteCost(costId) {
    if (confirm('هل أنت متأكد من حذف هذه التكلفة؟')) {
        database.ref('additional_costs/' + costId).remove()
            .then(() => {
                alert('تم حذف التكلفة بنجاح');
                loadCosts();
            })
            .catch(error => {
                alert('حدث خطأ أثناء حذف التكلفة: ' + error.message);
            });
    }
}

// دالة البحث في التكاليف
function filterCosts() {
    const searchValue = document.getElementById('costSearchInput').value.toLowerCase();
    
    database.ref('additional_costs').on('value', (snapshot) => {
        const tableBody = document.getElementById('costsTableBody');
        tableBody.innerHTML = '';
        
        snapshot.forEach((child) => {
            const cost = child.val();
            cost.id = child.key;
            
            if (cost.description.toLowerCase().includes(searchValue) ||
                cost.shipmentNumber.toLowerCase().includes(searchValue)) {
                addCostRow(cost, tableBody);
            }
        });
    });
}

// دالة إعداد مستمعي أحداث المخزون
function setupInventoryListeners() {
    addInventoryBtn.addEventListener('click', showAddInventoryModal);
    inventoryForm.addEventListener('submit', handleInventorySubmit);
    
    // إضافة مستمع لزر الإغلاق
    const inventoryCloseBtn = inventoryModal.querySelector('.close');
    inventoryCloseBtn.addEventListener('click', closeInventoryModal);
    
    // إغلاق النموذج عند النقر خارج المحتوى
    window.addEventListener('click', (e) => {
        if (e.target === inventoryModal) {
            closeInventoryModal();
        }
    });
    
    // مستمع تغيير الشحنة
    document.getElementById('shipmentSelectInventory').addEventListener('change', loadShipmentDetailsForInventory);
    
    // مستمع تغيير الفرع
    document.getElementById('branch').addEventListener('change', handleBranchChange);
    
    // مستمعي تغيير الكميات والسعر
    document.getElementById('importedQuantity').addEventListener('input', () => {
        updateInventoryStatus();
    });
    document.getElementById('receivedQuantity').addEventListener('input', () => {
        updateInventoryStatus();
    });
    document.getElementById('purchasePrice').addEventListener('input', (e) => {
        // السماح بإدخال الأرقام والنقطة العشرية فقط
        let value = e.target.value;
        
        // تنظيف القيمة من أي حروف غير رقمية (عدا النقطة العشرية)
        value = value.replace(/[^\d.]/g, '');
        
        // السماح بنقطة عشرية واحدة فقط
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        // تحديث قيمة الحقل
        e.target.value = value;
        
        // حساب الأسعار الأخرى
        calculatePrices();
    });

    // عند فقدان التركيز، تنسيق الرقم إلى 3 أرقام عشرية
    document.getElementById('purchasePrice').addEventListener('blur', (e) => {
        const value = e.target.value;
        if (value && !isNaN(value)) {
            e.target.value = parseFloat(value).toFixed(3);
            calculatePrices();
        }
    });
    
    // إعداد البحث والتصفية
    setupInventoryFilters();
    loadInventory();
    
    setupPriceInputs(); // إضافة هذا السطر
}

// تحديث دالة loadShipmentDetailsForInventory
async function loadShipmentDetailsForInventory() {
    const shipmentNumber = document.getElementById('shipmentSelectInventory').value;
    if (!shipmentNumber) return;

    try {
        // جلب بيانات الشحنة
        const shipmentSnapshot = await database.ref('shipments/' + shipmentNumber).once('value');
        const shipment = shipmentSnapshot.val();

        // جلب بيانات التخليص الجمركي
        const customsSnapshot = await database.ref('customs')
            .orderByChild('shipmentNumber')
            .equalTo(shipmentNumber)
            .once('value');
        
        // حساب مجموع التكلفة الجمركية
        let totalCustomsCost = 0;
        customsSnapshot.forEach(child => {
            totalCustomsCost += parseFloat(child.val().customsCost) || 0;
        });

        // جلب التكاليف الإضافية
        const costsSnapshot = await database.ref('additional_costs')
            .orderByChild('shipmentNumber')
            .equalTo(shipmentNumber)
            .once('value');
        
        // حساب مجموع التكاليف الإضافية
        let totalAdditionalCosts = 0;
        costsSnapshot.forEach(child => {
            totalAdditionalCosts += parseFloat(child.val().value) || 0;
        });

        // جلب أجور حجز الحاوية من جدول الطلبات
        const orderSnapshot = await database.ref('orders/' + shipment.orderNumber).once('value');
        const order = orderSnapshot.val();
        const containerBookingFees = parseFloat(order.bookingFees) || 0;

        // حساب إجمالي تكلفة الحاوية
        const totalContainerCost = containerBookingFees + totalCustomsCost + totalAdditionalCosts;
        
        // تحديث حقل إجمالي تكلفة الحاوية فقط
        document.getElementById('totalContainerCost').value = totalContainerCost.toFixed(2);
        
        // حساب التكلفة النهائية للوحدة باستخدام كمية الشحنة
        await calculateFinalUnitCost();

        // عرض التفاصيل للمستخدم
        console.log('تفاصيل التكلفة:', {
            'أجور حجز الحاوية': containerBookingFees,
            'مجموع التكلفة الجمركية': totalCustomsCost,
            'مجموع التكاليف الإضافية': totalAdditionalCosts,
            'إجمالي تكلفة الحاوية': totalContainerCost
        });

    } catch (error) {
        console.error('خطأ في تحميل بيانات الشحنة:', error);
        alert('حدث خطأ في تحميل بيانات الشحنة');
    }
}

// تحديث دالة handleInventorySubmit
function handleInventorySubmit(e) {
    e.preventDefault();
    
    const branch = document.getElementById('branch')?.value;
    const branchName = branch === 'أخرى' ? 
        document.getElementById('otherBranch')?.value : branch;
    
    const inventoryData = {
        inventoryNumber: document.getElementById('inventoryNumber')?.value,
        shipmentNumber: document.getElementById('shipmentSelectInventory')?.value,
        goodsType: document.getElementById('goodsTypeInventory')?.value,
        importedQuantity: document.getElementById('importedQuantity')?.value,
        receivedQuantity: document.getElementById('receivedQuantity')?.value,
        branch: branchName,
        totalContainerCost: document.getElementById('totalContainerCost')?.value,
        finalUnitCost: document.getElementById('finalUnitCost')?.value,
        purchasePrice: parseFloat(document.getElementById('purchasePrice').value).toFixed(3),
        costPrice: parseFloat(document.getElementById('costPrice').value).toFixed(3),
        sellingPrice: parseFloat(document.getElementById('sellingPrice').value).toFixed(3),
        status: document.getElementById('inventoryStatus')?.value
    };

    // التحقق من وجود البيانات الأساسية
    if (!inventoryData.inventoryNumber || !inventoryData.shipmentNumber) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    database.ref('inventory/' + inventoryData.inventoryNumber).set(inventoryData)
        .then(() => {
            inventoryModal.style.display = 'none';
            inventoryForm.reset();
            loadInventory();
        })
        .catch(error => alert('خطأ في حفظ المخزون: ' + error.message));
}

// دالة تحميل المخزون
function loadInventory() {
    const tableBody = document.getElementById('inventoryTableBody');
    database.ref('inventory').on('value', (snapshot) => {
        tableBody.innerHTML = '';
        snapshot.forEach((child) => {
            const inventory = child.val();
            addInventoryRow(inventory, tableBody);
        });
    });
}

// دالة إضافة صف مخزون
function addInventoryRow(inventory, tableBody) {
    const row = `
        <tr>
            <td>${inventory.inventoryNumber}</td>
            <td>${inventory.shipmentNumber}</td>
            <td>${inventory.goodsType}</td>
            <td>${inventory.importedQuantity}</td>
            <td>${inventory.receivedQuantity}</td>
            <td>${inventory.branch}</td>
            <td>${parseFloat(inventory.totalContainerCost).toFixed(3)}</td>
            <td>${parseFloat(inventory.finalUnitCost).toFixed(3)}</td>
            <td>${parseFloat(inventory.purchasePrice).toFixed(3)}</td>
            <td>${parseFloat(inventory.costPrice).toFixed(3)}</td>
            <td>${parseFloat(inventory.sellingPrice).toFixed(3)}</td>
            <td>${inventory.status}</td>
            <td>
                <div class="action-icons">
                    <button class="icon-btn edit" onclick="editInventory('${inventory.inventoryNumber}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteInventory('${inventory.inventoryNumber}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="icon-btn view" onclick="viewInventoryDetails('${inventory.inventoryNumber}')" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    tableBody.innerHTML += row;
}

// دالة تعديل المخزون
function editInventory(inventoryNumber) {
    database.ref('inventory/' + inventoryNumber).once('value')
        .then((snapshot) => {
            const inventory = snapshot.val();
            if (inventory) {
                document.getElementById('inventoryNumber').value = inventory.inventoryNumber;
                document.getElementById('shipmentSelectInventory').value = inventory.shipmentNumber;
                document.getElementById('goodsTypeInventory').value = inventory.goodsType;
                document.getElementById('importedQuantity').value = inventory.importedQuantity;
                document.getElementById('receivedQuantity').value = inventory.receivedQuantity;
                document.getElementById('branch').value = inventory.branch;
                
                if (inventory.branch === 'أخرى') {
                    document.getElementById('otherBranchContainer').classList.remove('hidden');
                    document.getElementById('otherBranch').value = inventory.branchName;
                }
                
                document.getElementById('totalContainerCost').value = inventory.totalContainerCost;
                document.getElementById('finalUnitCost').value = inventory.finalUnitCost;
                document.getElementById('purchasePrice').value = inventory.purchasePrice;
                document.getElementById('costPrice').value = inventory.costPrice;
                document.getElementById('sellingPrice').value = inventory.sellingPrice;
                document.getElementById('status').value = inventory.status;
                
                inventoryForm.dataset.editId = inventoryNumber;
                inventoryModal.style.display = 'block';
                
                loadShipmentDetailsForInventory(inventory.shipmentNumber);
            }
        });
}

// دالة حذف المخزون
function deleteInventory(inventoryNumber) {
    if (confirm('هل أنت متأكد من حذف هذا المخزون؟')) {
        database.ref('inventory/' + inventoryNumber).remove()
            .then(() => {
                alert('تم حذف المخزون بنجاح');
                loadInventory();
            })
            .catch(error => {
                alert('حدث خطأ أثناء حذف المخزون: ' + error.message);
            });
    }
}

// دالة عرض تفاصيل المخزون
function viewInventoryDetails(inventoryNumber) {
    const detailsModal = document.getElementById('shipmentDetailsModal');
    const detailsContent = document.getElementById('shipmentDetailsContent');
    
    database.ref('inventory/' + inventoryNumber).once('value')
        .then((snapshot) => {
            const inventory = snapshot.val();
            if (inventory) {
                detailsContent.innerHTML = `
                    <h2>تفاصيل المخزون</h2>
                    
                    <div class="details-grid">
                        <div class="detail-group">
                            <div class="detail-label">رقم الجرد</div>
                            <div class="detail-value">${inventory.inventoryNumber}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">رقم الشحنة</div>
                            <div class="detail-value">${inventory.shipmentNumber}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">نوع البضاعة</div>
                            <div class="detail-value">${inventory.goodsType}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">الكمية المستوردة</div>
                            <div class="detail-value">${inventory.importedQuantity}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">الكمية المستلمة</div>
                            <div class="detail-value">${inventory.receivedQuantity}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">فرع الاستلام</div>
                            <div class="detail-value">${inventory.branch}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">إجمالي تكلفة الحاوية</div>
                            <div class="detail-value">${inventory.totalContainerCost} $</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">التكلفة النهائية للوحدة</div>
                            <div class="detail-value">${inventory.finalUnitCost} $</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">سعر الشراء</div>
                            <div class="detail-value">${inventory.purchasePrice} $</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">سعر التكلفة</div>
                            <div class="detail-value">${inventory.costPrice} $</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">سعر المبيع</div>
                            <div class="detail-value">${inventory.sellingPrice} $</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">الحالة</div>
                            <div class="detail-value">${inventory.status}</div>
                        </div>
                    </div>
                `;
                
                detailsModal.style.display = 'block';
            }
        });
}

// دالة عرض نموذج إضافة مخزون جديد
function showAddInventoryModal() {
    // إعادة تعيين نموذج المخزون
    inventoryForm.reset();
    
    // توليد رقم مخزون جديد
    const newInventoryNumber = generateInventoryNumber();
    const inventoryNumberField = document.getElementById('inventoryNumber');
    if (inventoryNumberField) {
        inventoryNumberField.value = newInventoryNumber;
    }
    
    // إزالة معرف التعديل إن وجد
    delete inventoryForm.dataset.editId;
    
    // تغيير عنوان النموذج
    const modalTitle = document.getElementById('inventoryModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'إضافة مخزون جديد';
    }
    
    // عرض النموذج
    inventoryModal.style.display = 'block';
    
    // تحميل قائمة الشحنات
    loadAvailableShipmentsForInventory();
}

// دالة توليد رقم مخزون جديد
function generateInventoryNumber() {
    // توليد رقم مخزون جديد بناءً على التاريخ ورقم عشوائي
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `INV-${year}${month}${day}-${random}`;
}

// دالة تحميل الشحنات المتاحة للمخزون
function loadAvailableShipmentsForInventory() {
    const shipmentSelect = document.getElementById('shipmentSelectInventory');
    if (!shipmentSelect) return;
    
    // حفظ القيمة الحالية لاستعادتها لاحقًا
    const currentValue = shipmentSelect.value;
    
    // مسح القائمة الحالية
    shipmentSelect.innerHTML = '<option value="">اختر الشحنة</option>';
    
    // تحميل جميع الشحنات
    database.ref('shipments').once('value')
        .then((snapshot) => {
            // جمع الشحنات في مصفوفة لترتيبها
            const shipments = [];
            snapshot.forEach((child) => {
                const shipment = child.val();
                shipments.push(shipment);
            });
            
            // ترتيب الشحنات حسب تاريخ الوصول (الأحدث أولًا)
            shipments.sort((a, b) => {
                const dateA = new Date(a.arrivalDate || '2000-01-01');
                const dateB = new Date(b.arrivalDate || '2000-01-01');
                return dateB - dateA;
            });
            
            // إضافة كل شحنة إلى القائمة المنسدلة مع معلومات إضافية
            shipments.forEach((shipment) => {
                const option = document.createElement('option');
                option.value = shipment.shipmentNumber;
                
                // تنسيق تاريخ الوصول
                let arrivalDateDisplay = '';
                if (shipment.arrivalDate) {
                    const arrivalDate = new Date(shipment.arrivalDate);
                    arrivalDateDisplay = arrivalDate.toLocaleDateString('ar-SA');
                }
                
                // معلومات إضافية: رقم الشحنة | نوع البضاعة | رقم BL
                option.textContent = `${shipment.shipmentNumber} | ${shipment.goodsType || 'غير محدد'} | ${shipment.blNumber || ''}`;
                
                // إضافة البيانات كسمات مخصصة لاستخدامها في البحث
                option.setAttribute('data-number', shipment.shipmentNumber || '');
                option.setAttribute('data-goods', shipment.goodsType || '');
                option.setAttribute('data-bl', shipment.blNumber || '');
                
                // إضافة فئات مخصصة حسب حالة الشحنة
                if (shipment.status === 'تم الوصول') {
                    option.classList.add('arrived-shipment');
                } else {
                    option.classList.add('in-transit-shipment');
                }
                
                shipmentSelect.appendChild(option);
            });
            
            // استعادة القيمة السابقة إذا كانت موجودة
            if (currentValue) {
                shipmentSelect.value = currentValue;
                // تشغيل حدث تغيير القيمة لتحميل بيانات الشحنة
                if (typeof loadShipmentDetailsForInventory === 'function') {
                    loadShipmentDetailsForInventory();
                }
            }
        })
        .catch((error) => {
            console.error('خطأ في تحميل الشحنات:', error);
        });

    // إضافة مربع البحث فوق القائمة المنسدلة إذا لم يكن موجودًا
    let searchBox = document.getElementById('shipmentSearchBox');
    if (!searchBox) {
        const selectContainer = shipmentSelect.parentElement;
        searchBox = document.createElement('input');
        searchBox.type = 'text';
        searchBox.id = 'shipmentSearchBox';
        searchBox.className = 'shipment-search-box';
        searchBox.placeholder = 'ابحث عن الشحنة (رقم الشحنة، نوع البضاعة، رقم BL)';
        
        // إدراج مربع البحث قبل القائمة المنسدلة
        selectContainer.insertBefore(searchBox, shipmentSelect);
        
        // إضافة مستمع الحدث للبحث
        searchBox.addEventListener('input', filterShipmentOptions);
    }
}

// دالة تصفية خيارات الشحنات حسب نص البحث
function filterShipmentOptions() {
    const searchBox = document.getElementById('shipmentSearchBox');
    const shipmentSelect = document.getElementById('shipmentSelectInventory');
    if (!searchBox || !shipmentSelect) return;
    
    const searchText = searchBox.value.toLowerCase();
    const options = shipmentSelect.options;
    
    // لإظهار عدد الخيارات المطابقة
    let matchCount = 0;
    
    for (let i = 0; i < options.length; i++) {
        // تخطي الخيار الأول (اختر الشحنة)
        if (i === 0) continue;
        
        const option = options[i];
        const shipmentNumber = option.getAttribute('data-number') || '';
        const goodsType = option.getAttribute('data-goods') || '';
        const blNumber = option.getAttribute('data-bl') || '';
        const optionText = option.textContent.toLowerCase();
        
        // البحث في كل البيانات
        if (
            optionText.includes(searchText) ||
            shipmentNumber.toLowerCase().includes(searchText) ||
            goodsType.toLowerCase().includes(searchText) ||
            blNumber.toLowerCase().includes(searchText)
        ) {
            option.style.display = '';
            matchCount++;
        } else {
            option.style.display = 'none';
        }
    }
    
    // عرض رسالة إذا لم يتم العثور على نتائج
    const noMatchMessageId = 'noShipmentMatchMessage';
    let noMatchMessage = document.getElementById(noMatchMessageId);
    
    if (matchCount === 0 && searchText.length > 0) {
        if (!noMatchMessage) {
            noMatchMessage = document.createElement('div');
            noMatchMessage.id = noMatchMessageId;
            noMatchMessage.className = 'no-match-message';
            noMatchMessage.textContent = 'لا توجد شحنات مطابقة';
            shipmentSelect.parentElement.insertBefore(noMatchMessage, shipmentSelect.nextSibling);
        }
    } else if (noMatchMessage) {
        noMatchMessage.remove();
    }
}

// دالة إغلاق نموذج المخزون
function closeInventoryModal() {
    inventoryModal.style.display = 'none';
    inventoryForm.reset();
    document.getElementById('otherBranchContainer').classList.add('hidden');
}

// إضافة دالة حذف التخليص
function deleteCustoms(customsNumber) {
    if (confirm('هل أنت متأكد من حذف هذا التخليص؟')) {
        database.ref('customs/' + customsNumber).remove()
            .then(() => {
                alert('تم حذف التخليص بنجاح');
                loadCustoms();
            })
            .catch(error => {
                alert('حدث خطأ أثناء حذف التخليص: ' + error.message);
            });
    }
}

// تحديث دالة setupPriceInputs لقبول الأرقام العشرية
function setupPriceInputs() {
    const priceInputs = [
        'purchasePrice',
        'costPrice',
        'sellingPrice',
        'finalUnitCost',
        'totalContainerCost'
    ];

    priceInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // السماح بإدخال الأرقام والنقطة العشرية فقط
            input.addEventListener('input', function(e) {
                let value = e.target.value;
                
                // السماح فقط بالأرقام والنقطة العشرية
                value = value.replace(/[^\d.]/g, '');
                
                // السماح بنقطة عشرية واحدة فقط
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }

                // تحديث قيمة الحقل
                e.target.value = value;
                
                // حساب الأسعار الأخرى
                calculatePrices();
            });
        }
    });
}

// دالة تحميل الشحنات القادمة
function loadUpcomingShipments() {
    try {
        let upcomingShipmentsGrid = document.getElementById('upcomingShipmentsGrid');
        if (!upcomingShipmentsGrid) {
            console.error('لم يتم العثور على عنصر upcomingShipmentsGrid');
            return;
        }

        upcomingShipmentsGrid.innerHTML = '<div class="loading-indicator">جاري تحميل الشحنات القادمة...</div>';
        
        const currentDate = new Date();
        const currentDateStr = currentDate.toISOString().split('T')[0];
        
        if (!database) {
            upcomingShipmentsGrid.innerHTML = '<p class="error-message">تعذر الاتصال بقاعدة البيانات</p>';
            return;
        }

        // جلب الشحنات التي حالتها "في الطريق" فقط
        database.ref('shipments')
            .orderByChild('status')
            .equalTo('في الطريق')
            .once('value')
            .then(async (snapshot) => {
                if (!upcomingShipmentsGrid) return;
                
                if (!snapshot.exists()) {
                    upcomingShipmentsGrid.innerHTML = '<p class="no-data-message">لا توجد شحنات قادمة</p>';
                    updateContainerValues(0, 0, 0);
                    return;
                }

                let weekTotalValue = 0;
                let twoWeeksTotalValue = 0;
                let monthTotalValue = 0;
                let shipmentCount = 0;
                let upcomingShipmentsHTML = '';

                // جمع الشحنات في مصفوفة وترتيبها حسب تاريخ الوصول
                let shipments = [];
                snapshot.forEach(child => {
                    const shipment = child.val();
                    if (shipment.arrivalDate && shipment.arrivalDate >= currentDateStr) {
                        shipment.key = child.key;
                        shipment.daysRemaining = calculateDaysRemaining(shipment.arrivalDate);
                        shipments.push(shipment);
                    }
                });

                // ترتيب الشحنات حسب تاريخ الوصول (الأقرب أولاً)
                shipments.sort((a, b) => a.daysRemaining - b.daysRemaining);

                for (const shipment of shipments) {
                    let totalValue = parseFloat(shipment.totalValue) || 0;
                    if (!totalValue && shipment.orderNumber) {
                        const orderSnap = await database.ref('orders/' + shipment.orderNumber).once('value');
                        const order = orderSnap.val();
                        if (order && order.totalValue) {
                            totalValue = parseFloat(order.totalValue) || 0;
                        }
                    }

                    const daysRemaining = shipment.daysRemaining;

                    // تحديث القيم الإجمالية
                    if (daysRemaining <= 7) {
                        weekTotalValue += totalValue;
                    } else if (daysRemaining <= 14) {
                        twoWeeksTotalValue += totalValue;
                    } else if (daysRemaining <= 30) {
                        monthTotalValue += totalValue;
                    }

                    shipmentCount++;
                    let urgencyClass = '';
                    let timeLabel = '';

                    if (daysRemaining <= 0) {
                        urgencyClass = 'today';
                        timeLabel = 'وصلت اليوم!';
                    } else if (daysRemaining <= 3) {
                        urgencyClass = 'urgent';
                        timeLabel = `متبقي ${daysRemaining} يوم`;
                    } else if (daysRemaining <= 7) {
                        urgencyClass = 'soon';
                        timeLabel = `متبقي ${daysRemaining} يوم`;
                    } else if (daysRemaining <= 14) {
                        urgencyClass = 'upcoming';
                        timeLabel = `متبقي ${daysRemaining} يوم`;
                    } else {
                        urgencyClass = 'normal';
                        timeLabel = `متبقي ${daysRemaining} يوم`;
                    }

                    upcomingShipmentsHTML += `
                        <div class="shipment-card ${urgencyClass}" data-id="${shipment.key}" data-days="${daysRemaining}">
                            <div class="shipment-header">
                                <h4>${shipment.goodsType || 'غير محدد'}</h4>
                                <span class="time-badge ${urgencyClass}">${timeLabel}</span>
                            </div>
                            <div class="arrival-date ${urgencyClass}">
                                <i class="fas fa-calendar-alt"></i> ${formatDate(shipment.arrivalDate || '')}
                            </div>
                            <div class="shipment-details">
                                <p><strong>رقم الحاوية:</strong> ${shipment.containerNumber || 'غير محدد'}</p>
                                <p><strong>رقم BL:</strong> ${shipment.blNumber || 'غير محدد'}</p>
                                <p><strong>شركة الشحن:</strong> ${shipment.shippingCompany || 'غير محدد'}</p>
                                ${totalValue ? `<p><strong>قيمة الحاوية:</strong> ${formatCurrency(totalValue)}</p>` : ''}
                            </div>
                            <div class="shipment-actions">
                                <button class="view-details-btn" onclick="viewShipmentDetails('${shipment.key}')">عرض التفاصيل</button>
                            </div>
                        </div>
                    `;
                }

                if (shipmentCount > 0) {
                    upcomingShipmentsGrid.innerHTML = upcomingShipmentsHTML;
                    updateContainerValues(weekTotalValue, twoWeeksTotalValue, monthTotalValue);
                    // تطبيق الفلترة الافتراضية (أسبوع)
                    filterUpcomingShipments(7);
                } else {
                    upcomingShipmentsGrid.innerHTML = '<p class="no-data-message">لا توجد شحنات قادمة</p>';
                    updateContainerValues(0, 0, 0);
                }
            })
            .catch(error => {
                console.error('خطأ في تحميل الشحنات القادمة:', error);
                if (upcomingShipmentsGrid) {
                    upcomingShipmentsGrid.innerHTML = '<p class="error-message">حدث خطأ في تحميل الشحنات القادمة</p>';
                }
                updateContainerValues(0, 0, 0);
            });
    } catch (error) {
        console.error('خطأ غير متوقع في تحميل الشحنات القادمة:', error);
        updateContainerValues(0, 0, 0);
    }
}

// دالة لحساب عدد الأيام المتبقية حتى وصول الشحنة
function calculateDaysRemaining(arrivalDateStr) {
    try {
        if (!arrivalDateStr) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const arrivalDate = new Date(arrivalDateStr);
        arrivalDate.setHours(0, 0, 0, 0);
        
        const timeDiff = arrivalDate.getTime() - today.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    } catch (error) {
        console.error('خطأ في حساب الأيام المتبقية:', error);
        return 0;
    }
}

// دالة لإعداد أزرار تصفية الشحنات القادمة
function setupFilterButtons() {
    try {
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (!filterButtons || filterButtons.length === 0) return;
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // إزالة الفئة النشطة من جميع الأزرار
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // إضافة الفئة النشطة للزر المحدد
                this.classList.add('active');
                
                // تطبيق التصفية
                const days = parseInt(this.getAttribute('data-days'));
                filterUpcomingShipments(days);
            });
        });
    } catch (error) {
        console.error('خطأ في إعداد أزرار التصفية:', error);
    }
}

// دالة لتصفية الشحنات القادمة حسب عدد الأيام
function filterUpcomingShipments(days) {
    try {
        const shipmentCards = document.querySelectorAll('.shipment-card');
        if (!shipmentCards || shipmentCards.length === 0) return;
        
        let visibleCount = 0;
        
        shipmentCards.forEach(card => {
            const daysRemaining = parseInt(card.getAttribute('data-days') || '0');
            
            if (daysRemaining <= days) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // تحديث الإحصائيات في العنوان
        const filterTitle = document.querySelector('.upcoming-shipments-section .section-header h3');
        if (filterTitle) {
            filterTitle.textContent = `الشحنات القادمة (${visibleCount})`;
        }
    } catch (error) {
        console.error('خطأ في تصفية الشحنات القادمة:', error);
    }
}

// دالة لتنسيق القيمة المالية
function formatCurrency(value) {
    // التحقق من صحة القيمة
    if (isNaN(value) || value === null || value === undefined) {
        return '0.00 $';
    }
    
    // تنسيق الرقم بإضافة فواصل الآلاف ورقمين عشريين
    return parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' $';
}

// دالة لتحديث إجمالي قيمة الحاويات في البطاقات الإحصائية
function updateContainerValues(weekValue, twoWeeksValue, monthValue) {
    // تحديث إجمالي قيمة الحاويات
    const upcomingContainersValueElement = document.getElementById('upcomingContainersValue');
    if (upcomingContainersValueElement) {
        upcomingContainersValueElement.textContent = formatCurrency(monthValue+twoWeeksValue+weekValue);
    }
    
    // تحديث قيمة الحاويات القادمة خلال أسبوع
    const weekContainerValueElement = document.getElementById('weekContainerValue');
    if (weekContainerValueElement) {
        weekContainerValueElement.textContent = formatCurrency(weekValue) + ' خلال أسبوع';
    }
    
    // تحديث قيمة الحاويات القادمة خلال أسبوعين
    const twoWeeksContainerValueElement = document.getElementById('twoWeeksContainerValue');
    if (twoWeeksContainerValueElement) {
        twoWeeksContainerValueElement.textContent = formatCurrency(twoWeeksValue) + ' خلال أسبوعين';
    }
    
    // تحديث قيمة الحاويات القادمة خلال شهر
    const monthContainerValueElement = document.getElementById('monthContainerValue');
    if (monthContainerValueElement) {
        monthContainerValueElement.textContent = formatCurrency(monthValue) + ' خلال شهر';
    }
}

// دالة إعداد لوحة المعلومات
function setupDashboard() {
    try {
        loadUpcomingShipments();
        setupFilterButtons();
        checkUpcomingShipments();
        updateStatistics();
    } catch (error) {
        console.error('خطأ في إعداد لوحة المعلومات:', error);
    }
}

// دالة فحص الشحنات القادمة وإرسال التنبيهات
function checkUpcomingShipments() {
    try {
        // التحقق من وجود قاعدة البيانات
        if (!database) {
            console.error('قاعدة البيانات غير متاحة لفحص الشحنات القادمة');
            return;
        }
        
        database.ref('shipments').once('value').then(snapshot => {
            const today = new Date();
            let upcomingShipments = [];
            
            snapshot.forEach(child => {
                const shipment = child.val();
                if (shipment.status !== 'تم الوصول') {
                    const arrivalDate = new Date(shipment.arrivalDate);
                    const daysUntilArrival = Math.ceil((arrivalDate - today) / (1000 * 60 * 60 * 24));

                    // جمع الشحنات التي ستصل خلال 3 أيام
                    if (daysUntilArrival <= 3 && daysUntilArrival > 0) {
                        upcomingShipments.push({
                            shipmentNumber: shipment.shipmentNumber,
                            goodsType: shipment.goodsType,
                            arrivalDate: shipment.arrivalDate,
                            daysUntilArrival
                        });
                    }
                }
            });

            // إذا كانت هناك شحنات قادمة، أرسل تنبيه WhatsApp
            if (upcomingShipments.length > 0) {
                const message = `لديك ${upcomingShipments.length} شحنة قادمة خلال 3 أيام`;
                showToast(message, 'info');
            }
        });
    } catch (error) {
        console.error('خطأ غير متوقع في فحص الشحنات القادمة:', error);
    }
}

// تحديث دالة updateStatistics
function updateStatistics() {
    try {
        // إحصائيات الطلبات
        database.ref('orders').once('value').then(snapshot => {
            let total = 0;
            let inProgress = 0;
            let shipped = 0;
            
            snapshot.forEach(child => {
                const order = child.val();
                total++;
                
                if (order.status === 'قيد التصنيع') inProgress++;
                if (order.status === 'تم الشحن') shipped++;
            });
            
            // تحديث العناصر في واجهة المستخدم
            const totalOrdersElement = document.getElementById('totalOrders');
            const inProgressOrdersElement = document.getElementById('inProgressOrders');
            const shippedOrdersElement = document.getElementById('shippedOrders');
            
            if (totalOrdersElement) totalOrdersElement.textContent = total;
            if (inProgressOrdersElement) inProgressOrdersElement.textContent = `${inProgress} قيد التصنيع`;
            if (shippedOrdersElement) shippedOrdersElement.textContent = `${shipped} تم الشحن`;
        }).catch(error => {
            console.error('خطأ في تحديث إحصائيات الطلبات:', error);
        });
        
        // إحصائيات الشحنات
        database.ref('shipments').once('value').then(snapshot => {
            let total = 0;
            let inTransit = 0;
            let arrived = 0;
            let upcomingWeek = 0;
            let nextThreeDays = 0;
            
            const currentDate = new Date();
            const oneWeekLater = new Date(currentDate);
            oneWeekLater.setDate(currentDate.getDate() + 7);
            const threeDaysLater = new Date(currentDate);
            threeDaysLater.setDate(currentDate.getDate() + 3);
            
            const currentDateStr = currentDate.toISOString().split('T')[0];
            const oneWeekLaterStr = oneWeekLater.toISOString().split('T')[0];
            const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];
            
            snapshot.forEach(child => {
                const shipment = child.val();
                total++;
                if (shipment.status === 'في الطريق') inTransit++;
                if (shipment.status === 'تم الوصول') arrived++;
                
                // حساب الشحنات القادمة
                if (shipment.arrivalDate && shipment.arrivalDate >= currentDateStr && shipment.arrivalDate <= oneWeekLaterStr) {
                    upcomingWeek++;
                    
                    if (shipment.arrivalDate <= threeDaysLaterStr) {
                        nextThreeDays++;
                    }
                }
            });
            
            // تحديث العناصر في واجهة المستخدم
            const totalShipmentsElement = document.getElementById('totalShipments');
            const inTransitShipmentsElement = document.getElementById('inTransitShipments');
            const arrivedShipmentsElement = document.getElementById('arrivedShipments');
            const upcomingWeekShipmentsElement = document.getElementById('upcomingWeekShipments');
            const nextThreeDaysElement = document.getElementById('nextThreeDays');
            const nextWeekElement = document.getElementById('nextWeek');
            
            if (totalShipmentsElement) totalShipmentsElement.textContent = total;
            if (inTransitShipmentsElement) inTransitShipmentsElement.textContent = `${inTransit} في الطريق`;
            if (arrivedShipmentsElement) arrivedShipmentsElement.textContent = `${arrived} تم الوصول`;
            if (upcomingWeekShipmentsElement) upcomingWeekShipmentsElement.textContent = upcomingWeek;
            if (nextThreeDaysElement) nextThreeDaysElement.textContent = `${nextThreeDays} خلال 3 أيام`;
            if (nextWeekElement) nextWeekElement.textContent = `${upcomingWeek - nextThreeDays} بعد 3 أيام`;
        }).catch(error => {
            console.error('خطأ في تحديث إحصائيات الشحنات:', error);
        });
    } catch (error) {
        console.error('خطأ غير متوقع في تحديث الإحصائيات:', error);
    }
}

// دالة إظهار الإشعارات
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // اختيار الأيقونة المناسبة حسب نوع الإشعار
    const icon = type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                type === 'info' ? 'fa-info-circle' : 'fa-bell';
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
        <div class="toast-progress"></div>
    `;
    
    document.body.appendChild(toast);
    
    // إظهار الإشعار
    setTimeout(() => toast.classList.add('show'), 100);
    
    // إخفاء الإشعار بعد 3 ثواني
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// إضافة دالة إعداد تصفية المخزون
function setupInventoryFilters() {
    const searchInput = document.getElementById('inventorySearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterInventory);
    }
    
    const branchFilter = document.getElementById('branchFilter');
    if (branchFilter) {
        branchFilter.addEventListener('change', filterInventory);
    }

    const statusFilter = document.getElementById('inventoryStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterInventory);
    }
}

// دالة تصفية المخزون
function filterInventory() {
    const searchValue = document.getElementById('inventorySearchInput')?.value?.toLowerCase() || '';
    const branchValue = document.getElementById('branchFilter')?.value || 'الكل';
    const statusValue = document.getElementById('inventoryStatusFilter')?.value || 'الكل';
    
    const tableBody = document.getElementById('inventoryTableBody');
    tableBody.innerHTML = '';
    
    database.ref('inventory').once('value', (snapshot) => {
        let matchCount = 0;
        snapshot.forEach((child) => {
            const inventory = child.val();
            
            // تصفية حسب كلمة البحث
            const matchesSearch = 
                inventory.inventoryNumber.toLowerCase().includes(searchValue) ||
                inventory.shipmentNumber.toLowerCase().includes(searchValue) ||
                inventory.goodsType.toLowerCase().includes(searchValue) ||
                inventory.branch.toLowerCase().includes(searchValue);
            
            // تصفية حسب الفرع
            const matchesBranch = branchValue === 'الكل' || inventory.branch === branchValue;
            
            // تصفية حسب الحالة
            const matchesStatus = statusValue === 'الكل' || inventory.status === statusValue;
            
            if (matchesSearch && matchesBranch && matchesStatus) {
                addInventoryRow(inventory, tableBody);
                matchCount++;
            }
        });
        
        // تحديث عدد النتائج
        updateResultsCount(matchCount, 'inventory-results-count');
    });
}

// دالة حساب التكلفة النهائية للوحدة
async function calculateFinalUnitCost() {
    const shipmentNumber = document.getElementById('shipmentSelectInventory').value;
    if (!shipmentNumber) return;

    try {
        // جلب بيانات الشحنة
        const shipmentSnapshot = await database.ref('shipments/' + shipmentNumber).once('value');
        const shipment = shipmentSnapshot.val();
        
        // جلب بيانات الطلب
        const orderSnapshot = await database.ref('orders/' + shipment.orderNumber).once('value');
        const order = orderSnapshot.val();
        
        // الحصول على قيمة الكمية المستوردة والتكلفة الإجمالية
        const orderQuantity = parseFloat(order.quantity) || 0;
        const totalContainerCost = parseFloat(document.getElementById('totalContainerCost').value) || 0;
        
        // حساب التكلفة النهائية للوحدة
        const finalUnitCost = orderQuantity > 0 ? totalContainerCost / orderQuantity : 0;
        
        // تحديث حقل التكلفة النهائية للوحدة
        document.getElementById('finalUnitCost').value = finalUnitCost.toFixed(3);
        
        // حساب باقي الأسعار
        calculatePrices();
        
        return finalUnitCost;
    } catch (error) {
        console.error('خطأ في حساب التكلفة النهائية للوحدة:', error);
        return 0;
    }
}

// دالة حساب الأسعار
function calculatePrices() {
    const finalUnitCost = parseFloat(document.getElementById('finalUnitCost').value) || 0;
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    
    // حساب سعر التكلفة (تكلفة الوحدة النهائية + سعر الشراء)
    const costPrice = finalUnitCost + purchasePrice;
    document.getElementById('costPrice').value = costPrice.toFixed(3);
    
    // حساب سعر البيع (سعر التكلفة + هامش ربح 10%)
    const sellingPrice = costPrice * 1.1;  // إضافة هامش ربح 10%
    document.getElementById('sellingPrice').value = sellingPrice.toFixed(3);
}

// دالة تحديث حالة المخزون
function updateInventoryStatus() {
    const importedQuantity = parseFloat(document.getElementById('importedQuantity').value) || 0;
    const receivedQuantity = parseFloat(document.getElementById('receivedQuantity').value) || 0;
    
    // تحديث حالة المخزون بناءً على الكميات
    let status = 'غير متوفر';
    if (receivedQuantity > 0) {
        if (receivedQuantity === importedQuantity) {
            status = 'مكتمل';
        } else if (receivedQuantity < importedQuantity) {
            status = 'جزئي';
        }
    }
    
    document.getElementById('inventoryStatus').value = status;
    
    // إعادة حساب التكلفة النهائية للوحدة
    calculateFinalUnitCost();
}

// دالة معالجة تغيير الفرع
function handleBranchChange() {
    const branchSelect = document.getElementById('branch');
    const otherBranchContainer = document.getElementById('otherBranchContainer');
    
    if (branchSelect.value === 'أخرى') {
        otherBranchContainer.style.display = 'block';
    } else {
        otherBranchContainer.style.display = 'none';
    }
}

// دالة إعداد الإشعارات
function setupNotifications() {
    // التحقق من وجود حاوية الإشعارات
    let notificationsContainer = document.getElementById('notifications');
    
    // إنشاء عنصر الإشعارات إذا لم يكن موجودًا
    if (!notificationsContainer) {
        // التحقق من وجود لوحة المعلومات
        const dashboardContainer = document.getElementById('dashboard');
        if (dashboardContainer) {
            // إنشاء قسم الإشعارات
            const notificationsSection = document.createElement('div');
            notificationsSection.className = 'dashboard-section';
            notificationsSection.innerHTML = `
                <h3>الإشعارات</h3>
                <div id="notifications" class="notifications-container"></div>
                <div id="notificationBadge" class="notification-badge" style="display: none;">0</div>
            `;
            dashboardContainer.appendChild(notificationsSection);
            notificationsContainer = document.getElementById('notifications');
        } else {
            console.log('لوحة المعلومات غير موجودة، لا يمكن إضافة الإشعارات');
            return;
        }
    }
    
    // مراقبة الشحنات التي تقترب من موعد وصولها
    database.ref('shipments').on('value', (snapshot) => {
        const currentDate = new Date();
        let notifications = [];
        
        // تجميع الإشعارات من الشحنات القادمة
        snapshot.forEach((child) => {
            const shipment = child.val();
            const arrivalDate = new Date(shipment.arrivalDate);
            const daysUntilArrival = Math.ceil((arrivalDate - currentDate) / (1000 * 60 * 60 * 24));

            // إضافة إشعار للشحنات التي ستصل خلال 3 أيام
            if (daysUntilArrival <= 3 && daysUntilArrival > 0 && shipment.status !== 'تم الوصول') {
                notifications.push({
                    type: 'arrival',
                    message: `شحنة ${shipment.shipmentNumber} (${shipment.goodsType}) ستصل خلال ${daysUntilArrival} يوم`,
                    shipmentNumber: shipment.shipmentNumber,
                    date: new Date().toISOString()
                });
            }
        });
        
        // تحديث عرض الإشعارات
        updateNotificationsDisplay(notifications);
    });
    
    // مراقبة المخزون منخفض الكمية
    database.ref('inventory').on('value', (snapshot) => {
        let notifications = [];
        
        snapshot.forEach((child) => {
            const inventory = child.val();
            const receivedQuantity = parseFloat(inventory.receivedQuantity) || 0;
            
            // إضافة إشعار للمخزون منخفض الكمية (أقل من 10% من الكمية المستوردة)
            if (receivedQuantity > 0) {
                const importedQuantity = parseFloat(inventory.importedQuantity) || 0;
                const percentage = (receivedQuantity / importedQuantity) * 100;
                
                if (percentage < 10) {
                    notifications.push({
                        type: 'low-stock',
                        message: `المخزون ${inventory.inventoryNumber} (${inventory.goodsType}) منخفض، متبقي ${receivedQuantity} فقط`,
                        inventoryNumber: inventory.inventoryNumber,
                        date: new Date().toISOString()
                    });
                }
            }
        });
        
        // تحديث عرض الإشعارات
        updateNotificationsDisplay(notifications);
    });
    
    // إضافة مراقبة إشعارات الخطط الموسمية
    setupseasonal_plansNotifications();
    
    // تشغيل تحليل تأخير الموردين عند تحميل الصفحة
    analyzeSupplierDelays();
    
    // تشغيل التحليل كل 6 ساعات
    setInterval(analyzeSupplierDelays, 6 * 60 * 60 * 1000);
}

// دالة تحديث عرض الإشعارات
function updateNotificationsDisplay(newNotifications) {
    const notificationsContainer = document.getElementById('notifications');
    const notificationBadge = document.getElementById('notificationBadge');
    
    if (!notificationsContainer || !notificationBadge) return;
    
    // إضافة الإشعارات الجديدة إلى الحاوية
    if (newNotifications.length > 0) {
        // عرض شارة الإشعارات وتحديث العدد
        notificationBadge.style.display = 'block';
        notificationBadge.textContent = newNotifications.length;
        
        // تفريغ الحاوية وإضافة الإشعارات الجديدة
        notificationsContainer.innerHTML = '';
        
        newNotifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `notification ${notification.type}`;
            
            // إنشاء محتوى الإشعار
            const creationDate = new Date(notification.date);
            const formattedDate = creationDate.toLocaleDateString('ar-SA') + ' ' + creationDate.toLocaleTimeString('ar-SA');
            
            notificationElement.innerHTML = `
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-date">${formattedDate}</div>
                </div>
                <button class="dismiss-btn" data-id="${notification.type === 'arrival' ? notification.shipmentNumber : notification.inventoryNumber}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // إضافة مستمع لزر إغلاق الإشعار
            const dismissBtn = notificationElement.querySelector('.dismiss-btn');
            dismissBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationElement.remove();
                
                // تحديث عدد الإشعارات
                const remainingNotifications = notificationsContainer.querySelectorAll('.notification').length;
                if (remainingNotifications === 0) {
                    notificationBadge.style.display = 'none';
                } else {
                    notificationBadge.textContent = remainingNotifications;
                }
            });
            
            // إضافة الإشعار إلى الحاوية
            notificationsContainer.appendChild(notificationElement);
        });
    } else {
        // إخفاء شارة الإشعارات إذا لم تكن هناك إشعارات
        notificationBadge.style.display = 'none';
    }
}

function setupseasonal_plansListeners() {
    addSeasonalPlanBtn.addEventListener('click', () => {
        seasonalPlanForm.reset();
        seasonalPlanModal.style.display = 'block';
    });
    closeSeasonalPlanModal.addEventListener('click', () => {
        seasonalPlanModal.style.display = 'none';
    });
    seasonalPlanForm.addEventListener('submit', handleseasonal_plansubmit);
    closeSeasonalProductModal.addEventListener('click', () => {
        seasonalProductModal.style.display = 'none';
    });
    seasonalProductForm.addEventListener('submit', handleSeasonalProductSubmit);
}

async function handleseasonal_plansubmit(e) {
    e.preventDefault();
    
    try {
        // التحقق من البيانات المطلوبة
        const season = document.getElementById('season')?.value?.trim();
        const year = document.getElementById('planYear')?.value?.trim();
        const supplier = document.getElementById('planSupplier')?.value?.trim();
        
        if (!season || !year || !supplier) {
            showToast('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return;
        }

        const planId = seasonalPlanForm.dataset.editId || Date.now().toString();
        const planData = {
            season,
            year,
            supplier,
            notes: document.getElementById('planNotes')?.value?.trim() || '',
            status: document.getElementById('planStatus')?.value || 'قيد التنفيذ',
            lastModified: new Date().toISOString(),
            modifiedBy: auth.currentUser?.uid || 'system'
        };

        // التحقق من وجود الخطة إذا كان تعديلاً
        if (seasonalPlanForm.dataset.editId) {
            const planRef = database.ref('seasonal_plans/' + planId);
            const snapshot = await planRef.once('value');
            const currentPlan = snapshot.val();
            
            if (!currentPlan) {
                throw new Error('الخطة غير موجودة في قاعدة البيانات');
            }

            // التحقق من تغيير الحالة وإرسال إشعار
            const oldStatus = currentPlan.status;
            if (oldStatus !== planData.status) {
                const statusNotifyCheckbox = document.getElementById('seasonal_planstatusNotifications');
                if (statusNotifyCheckbox?.checked) {
                    const notification = {
                        type: 'seasonal-plan-status',
                        message: `تم تغيير حالة خطة ${currentPlan.season} ${currentPlan.year} من ${oldStatus} إلى ${planData.status}`,
                        planId,
                        date: new Date().toISOString()
                    };
                    updateNotificationsDisplay([notification]);
                }
            }

            // تحديث الخطة مع الحفاظ على المنتجات
            const updatedPlan = {
                ...currentPlan,
                ...planData,
                products: currentPlan.products || []
            };

            await planRef.set(updatedPlan);
            showToast('تم تحديث الخطة بنجاح');
        } else {
            // إضافة خطة جديدة
            const newPlan = {
                ...planData,
                products: [],
                createdAt: new Date().toISOString(),
                createdBy: auth.currentUser?.uid || 'system'
            };

            // إرسال إشعار عند إضافة خطة جديدة
            const planNotifyCheckbox = document.getElementById('seasonalPlanNotifications');
            if (planNotifyCheckbox?.checked) {
                const notification = {
                    type: 'seasonal-plan-new',
                    message: `تم إضافة خطة شراء موسمية جديدة: ${newPlan.season} ${newPlan.year} للمورد ${newPlan.supplier}`,
                    planId,
                    date: new Date().toISOString()
                };
                updateNotificationsDisplay([notification]);
            }

            await database.ref('seasonal_plans/' + planId).set(newPlan);
            showToast('تم إضافة الخطة بنجاح');
        }

        // إغلاق النافذة وتحديث العرض
        seasonalPlanModal.style.display = 'none';
        await loadseasonal_plans();
        reapplyFilters('seasonal_plans');

    } catch (error) {
        console.error('خطأ في حفظ الخطة:', error);
        showToast(error.message || 'حدث خطأ أثناء حفظ الخطة', 'error');
    } finally {
        delete seasonalPlanForm.dataset.editId;
    }
}

function createPlanCard(plan) {
    const card = document.createElement('div');
    card.className = 'plan-card';
    
    const statusClass = {
        'قيد التنفيذ': 'active',
        'مكتملة': 'completed',
        'ملغاة': 'cancelled'
    }[plan.status] || 'active';

    // حساب عدد المنتجات بشكل آمن
    const productsCount = Array.isArray(plan.products) ? plan.products.length : 
                         (plan.products ? Object.keys(plan.products).length : 0);

    card.innerHTML = `
        <div class="plan-header">
            <div class="plan-title">${plan.supplier || 'غير محدد'}</div>
            <span class="plan-status ${statusClass}">${plan.status || 'قيد التنفيذ'}</span>
        </div>
        <div class="plan-details">
            <div class="plan-detail-item">
                <span class="plan-detail-label">الموسم:</span>
                <span>${plan.season || '-'}</span>
            </div>
            <div class="plan-detail-item">
                <span class="plan-detail-label">السنة:</span>
                <span>${plan.year || '-'}</span>
            </div>
            <div class="plan-detail-item">
                <span class="plan-detail-label">عدد المنتجات:</span>
                <span>${productsCount}</span>
            </div>
        </div>
        <div class="plan-actions">
            <button onclick="showEditSeasonalPlanModal('${plan.id}')" class="edit">
                <i class="fas fa-edit"></i>
                تعديل
            </button>
            <button onclick="showAddProductModal('${plan.id}')" class="add">
                <i class="fas fa-plus"></i>
                إضافة منتج
            </button>
            <button onclick="showProductsTimeline('${plan.id}', '${plan.supplier || ''}')" class="products">
                <i class="fas fa-list"></i>
                المنتجات
            </button>
            <button onclick="deleteSeasonalPlan('${plan.id}')" class="delete">
                <i class="fas fa-trash"></i>
                حذف
            </button>
        </div>
    `;
    
    return card;
}

async function loadseasonal_plans() {
    try {
        const plansGrid = document.getElementById('seasonalPlansGrid');
        if (!plansGrid) {
            console.warn('عنصر عرض الخطط غير موجود في الصفحة!');
            return;
        }
        // المسار الموحد
        const plansRef = database.ref('seasonal_plans');
        const snapshot = await plansRef.once('value');
        const plans = snapshot.val() || {};
        // تحديث الإحصائيات
        updateSeasonalStats(plans);
        // تفريغ الشبكة قبل إضافة البطاقات الجديدة
        plansGrid.innerHTML = '';
        // تحويل البيانات إلى مصفوفة وترتيبها
        const plansArray = Object.entries(plans).map(([id, plan]) => ({ id, ...plan })).sort((a, b) => b.year - a.year || b.season.localeCompare(a.season));
        if (plansArray.length === 0) {
            plansGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-calendar-times"></i>
                    <p>لا توجد خطط شراء موسمية حالياً</p>
                    <button onclick="showAddSeasonalPlanModal()" class="primary-btn">
                        <i class="fas fa-plus"></i>
                        إضافة خطة جديدة
                    </button>
                </div>
            `;
            return;
        }
        // إضافة كل خطة كبطاقة
        plansArray.forEach(plan => {
            const card = createPlanCard(plan);
            plansGrid.appendChild(card);
        });
    } catch (error) {
        console.error('خطأ في تحميل الخطط الموسمية:', error);
        const plansGrid = document.getElementById('seasonalPlansGrid');
        if (plansGrid) {
            plansGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>حدث خطأ أثناء تحميل الخطط الموسمية</p>
                    <button onclick="loadseasonal_plans()" class="secondary-btn">
                        <i class="fas fa-redo"></i>
                        إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

function updateSeasonalStats(plans) {
    try {
        const activePlansCount = document.getElementById('activePlansCount');
        const totalProductsCount = document.getElementById('totalProductsCount');
        const upcomingShipmentsCount = document.getElementById('upcomingShipmentsCount');

        if (!activePlansCount || !totalProductsCount || !upcomingShipmentsCount) {
            console.warn('عناصر الإحصائيات غير موجودة');
            return;
        }

        const plansArray = Object.values(plans);
        
        // حساب الخطط النشطة
        const activePlans = plansArray.filter(plan => plan.status === 'قيد التنفيذ').length;
        activePlansCount.textContent = activePlans;

        // حساب إجمالي المنتجات
        const totalProducts = plansArray.reduce((sum, plan) => 
            sum + (plan.products ? Object.keys(plan.products).length : 0), 0);
        totalProductsCount.textContent = totalProducts;

        // حساب الشحنات القادمة
        const upcomingShipments = plansArray.reduce((sum, plan) => {
            if (!plan.products) return sum;
            return sum + Object.values(plan.products).filter(product => 
                product.shipmentDate && new Date(product.shipmentDate) > new Date()
            ).length;
        }, 0);
        upcomingShipmentsCount.textContent = upcomingShipments;

    } catch (error) {
        console.error('خطأ في تحديث إحصائيات الخطط الموسمية:', error);
    }
}

function showAddProductModal(planId) {
    seasonalProductForm.reset();
    seasonalProductForm.dataset.planId = planId;
    seasonalProductModal.style.display = 'block';
}

// إضافة منطق ديناميكي لحقول تواريخ الحاويات في نموذج المنتج
function setupContainerDatesDynamicInput() {
    const containersInput = document.getElementById('productContainers');
    const wrapper = document.getElementById('containerDatesWrapper');
    function renderDatesInputs() {
        wrapper.innerHTML = '';
        const count = parseInt(containersInput.value) || 1;
        // إضافة رأس الأعمدة
        const header = document.createElement('div');
        header.className = 'container-grid-header';
        header.innerHTML = '<span>تاريخ الحاوية</span><span>كمية</span><span>رقم مرجعي</span><span>الحالة</span><span>رقم</span>';
        wrapper.appendChild(header);
        for (let i = 0; i < count; i++) {
            const row = document.createElement('div');
            row.className = 'container-grid-row';
            // تاريخ
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.className = 'container-date-input';
            dateInput.required = true;
            dateInput.name = `containerDate${i}`;
            // كمية
            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.className = 'container-qty-input';
            qtyInput.required = true;
            qtyInput.min = 1;
            // رقم مرجعي
            const refInput = document.createElement('input');
            refInput.type = 'text';
            refInput.className = 'container-ref-input';
            refInput.required = true;
            // حالة الحاوية
            const statusSelect = document.createElement('select');
            statusSelect.className = 'container-status-input';
            ['قيد الطلب','تم الشحن','تم الاستلام','ملغى'].forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                statusSelect.appendChild(opt);
            });
            // رقم الحاوية (عرض فقط)
            const numSpan = document.createElement('span');
            numSpan.textContent = (i+1).toString();
            numSpan.style.textAlign = 'center';
            row.appendChild(dateInput);
            row.appendChild(qtyInput);
            row.appendChild(refInput);
            row.appendChild(statusSelect);
            row.appendChild(numSpan);
            wrapper.appendChild(row);
        }
    }
    containersInput.addEventListener('input', renderDatesInputs);
    renderDatesInputs();
}

// handleSeasonalProductSubmit: تخزين كل حاوية مع خصائصها
function handleSeasonalProductSubmit(e) {
    e.preventDefault();
    const planId = seasonalProductForm.dataset.planId;
    
    if (!planId) {
        console.error('معرف الخطة غير موجود');
        showToast('حدث خطأ: معرف الخطة غير موجود', 'error');
        return;
    }

    // التحقق من البيانات المطلوبة
    const productName = document.getElementById('productName')?.value?.trim();
    if (!productName) {
        showToast('يرجى إدخال اسم المنتج', 'error');
        return;
    }

    const product = {
        name: productName,
        specs: document.getElementById('productSpecs')?.value?.trim() || '',
        price: parseFloat(document.getElementById('productPrice')?.value) || 0,
        containers: parseInt(document.getElementById('productContainers')?.value) || 1,
        containerDetails: [],
        notes: document.getElementById('productNotes')?.value?.trim() || '',
        lastModified: new Date().toISOString(),
        modifiedBy: auth.currentUser?.uid || 'system'
    };

    // جمع بيانات الحاويات
    const dateInputs = document.querySelectorAll('#containerDatesWrapper .container-date-input');
    const qtyInputs = document.querySelectorAll('#containerDatesWrapper .container-qty-input');
    const refInputs = document.querySelectorAll('#containerDatesWrapper .container-ref-input');
    const statusInputs = document.querySelectorAll('#containerDatesWrapper .container-status-input');

    if (dateInputs.length !== qtyInputs.length || 
        dateInputs.length !== refInputs.length || 
        dateInputs.length !== statusInputs.length) {
        showToast('عدد حقول الحاويات غير متطابق', 'error');
        return;
    }

    // التحقق من تعبئة جميع حقول الحاويات
    for (let i = 0; i < dateInputs.length; i++) {
        const date = dateInputs[i].value;
        const quantity = qtyInputs[i].value;
        const ref = refInputs[i].value;

        if (!date || !quantity || !ref) {
            showToast(`يرجى تعبئة جميع بيانات الحاوية رقم ${i + 1}`, 'error');
            return;
        }

        // التحقق من صحة التاريخ
        const containerDate = new Date(date);
        if (isNaN(containerDate.getTime())) {
            showToast(`تاريخ الحاوية رقم ${i + 1} غير صالح`, 'error');
            return;
        }

        // التحقق من صحة الكمية
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            showToast(`كمية الحاوية رقم ${i + 1} غير صالحة`, 'error');
            return;
        }

        product.containerDetails.push({
            date,
            quantity: qty,
            ref,
            status: statusInputs[i].value || 'قيد الانتظار',
            lastModified: new Date().toISOString()
        });
    }

    // استخدام transaction للتأكد من عدم وجود تعارض
    database.ref('seasonal_plans/' + planId).transaction(currentPlan => {
        if (currentPlan === null) {
            throw new Error('الخطة غير موجودة في قاعدة البيانات');
        }

        // التأكد من وجود مصفوفة المنتجات
        if (!Array.isArray(currentPlan.products)) {
            currentPlan.products = [];
        }

        const editIndex = seasonalProductForm.dataset.editIndex;
        if (editIndex !== undefined && editIndex !== null) {
            // تعديل منتج موجود
            if (editIndex >= 0 && editIndex < currentPlan.products.length) {
                // التحقق من عدم وجود منتج آخر بنفس الاسم
                const hasDuplicate = currentPlan.products.some((p, idx) => 
                    idx !== editIndex && p.name.toLowerCase() === product.name.toLowerCase()
                );
                if (hasDuplicate) {
                    throw new Error('يوجد منتج آخر بنفس الاسم في هذه الخطة');
                }
                currentPlan.products[editIndex] = product;
            } else {
                throw new Error('فهرس المنتج غير صالح');
            }
        } else {
            // إضافة منتج جديد
            // التحقق من عدم وجود منتج بنفس الاسم
            const hasDuplicate = currentPlan.products.some(p => 
                p.name.toLowerCase() === product.name.toLowerCase()
            );
            if (hasDuplicate) {
                throw new Error('يوجد منتج آخر بنفس الاسم في هذه الخطة');
            }
            product.createdAt = new Date().toISOString();
            product.createdBy = auth.currentUser?.uid || 'system';
            currentPlan.products.push(product);
        }

        return currentPlan;
    })
    .then(({ committed, snapshot }) => {
        if (committed) {
            seasonalProductModal.style.display = 'none';
            loadseasonal_plans();
            showToast(seasonalProductForm.dataset.editIndex !== undefined ? 
                'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح');
        }
    })
    .catch(error => {
        console.error('خطأ في حفظ المنتج:', error);
        showToast(error.message || 'حدث خطأ أثناء حفظ المنتج', 'error');
    })
    .finally(() => {
        delete seasonalProductForm.dataset.editIndex;
    });
}

// منطق تعديل منتج
function editSeasonalProduct(planId, productIdx) {
    database.ref('seasonal_plans/' + planId).once('value').then(snapshot => {
        const plan = snapshot.val();
        if (!plan || !plan.products || !plan.products[productIdx]) {
            console.error('المنتج غير موجود');
            showToast('لم يتم العثور على المنتج', 'error');
            return;
        }

        const product = plan.products[productIdx];
        
        // تحديث عنوان النافذة
        document.getElementById('seasonalProductModalTitle').innerHTML = 
            '<i class="fas fa-edit" style="color:#2196F3;"></i> تعديل منتج في الخطة';
        
        // تعبئة بيانات المنتج
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productSpecs').value = product.specs || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productNotes').value = product.notes || '';
        
        // تعبئة عدد الحاويات وتوليد حقول الحاويات
        const containersInput = document.getElementById('productContainers');
        containersInput.value = product.containers || 1;
        
        // تخزين معرفات الخطة والمنتج
        seasonalProductForm.dataset.planId = planId;
        seasonalProductForm.dataset.editIndex = productIdx;
        
        // توليد حقول الحاويات
        setupContainerDatesDynamicInput();
        
        // تعبئة بيانات الحاويات بعد توليد الحقول
        setTimeout(() => {
            if (product.containerDetails && product.containerDetails.length > 0) {
            const dateInputs = document.querySelectorAll('#containerDatesWrapper .container-date-input');
            const qtyInputs = document.querySelectorAll('#containerDatesWrapper .container-qty-input');
            const refInputs = document.querySelectorAll('#containerDatesWrapper .container-ref-input');
            const statusInputs = document.querySelectorAll('#containerDatesWrapper .container-status-input');
                
                product.containerDetails.forEach((container, index) => {
                    if (dateInputs[index]) dateInputs[index].value = container.date || '';
                    if (qtyInputs[index]) qtyInputs[index].value = container.quantity || '';
                    if (refInputs[index]) refInputs[index].value = container.ref || '';
                    if (statusInputs[index]) statusInputs[index].value = container.status || 'قيد الانتظار';
                });
            }
        }, 200); // زيادة التأخير لضمان توليد الحقول
        
        // إظهار النافذة
        seasonalProductModal.style.display = 'block';
    }).catch(error => {
        console.error('خطأ في تحميل بيانات المنتج:', error);
        showToast('حدث خطأ أثناء تحميل بيانات المنتج', 'error');
    });
}

// منطق حذف منتج
function deleteSeasonalProduct(planId, productIdx) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    database.ref('seasonal_plans/' + planId).once('value').then(snapshot => {
        const plan = snapshot.val();
        plan.products.splice(productIdx, 1);
        database.ref('seasonal_plans/' + planId).set(plan).then(loadseasonal_plans);
    });
}

// منطق تعديل/حذف خطة
function editSeasonalPlan(planId) {
    database.ref('seasonal_plans/' + planId).once('value').then(snapshot => {
        const plan = snapshot.val();
        document.getElementById('season').value = plan.season;
        document.getElementById('planYear').value = plan.year;
        document.getElementById('planSupplier').value = plan.supplier;
        document.getElementById('planNotes').value = plan.notes;
        document.getElementById('planStatus').value = plan.status;
        seasonalPlanForm.dataset.editId = planId;
        seasonalPlanModal.style.display = 'block';
    });
}
function deleteSeasonalPlan(planId) {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;
    database.ref('seasonal_plans/' + planId).remove().then(loadseasonal_plans);
}

// handleseasonal_plansubmit: دعم التعديل
function handleseasonal_plansubmit(e) {
    e.preventDefault();
    const planId = seasonalPlanForm.dataset.editId || Date.now().toString();
    const newStatus = document.getElementById('planStatus').value;
    
    // إذا كان تعديلاً، تحقق من تغيير الحالة
    if (seasonalPlanForm.dataset.editId) {
        database.ref('seasonal_plans/' + planId).once('value').then(snapshot => {
            const oldPlan = snapshot.val();
            const oldStatus = oldPlan.status;
            
            // تحقق من وجود العنصر قبل استخدام .checked
            const statusNotifyCheckbox = document.getElementById('seasonal_planstatusNotifications');
            if (oldStatus !== newStatus && statusNotifyCheckbox && statusNotifyCheckbox.checked) {
                const notification = {
                    type: 'seasonal-plan-status',
                    message: `تم تغيير حالة خطة ${oldPlan.season} ${oldPlan.year} من ${oldStatus} إلى ${newStatus}`,
                    planId: planId,
                    date: new Date().toISOString()
                };
                updateNotificationsDisplay([notification]);
            }
            
            // تحديث الخطة
            const planData = {
                id: planId,
                season: document.getElementById('season').value,
                year: document.getElementById('planYear').value,
                supplier: document.getElementById('planSupplier').value,
                notes: document.getElementById('planNotes').value,
                status: newStatus,
                products: oldPlan.products || []
            };
            
            database.ref('seasonal_plans/' + planId).set(planData)
                .then(() => {
                    seasonalPlanModal.style.display = 'none';
                    loadseasonal_plans();
                });
        });
    } else {
        // إضافة خطة جديدة
        const planData = {
            id: planId,
            season: document.getElementById('season').value,
            year: document.getElementById('planYear').value,
            supplier: document.getElementById('planSupplier').value,
            notes: document.getElementById('planNotes').value,
            status: newStatus,
            products: []
        };
        
        // تحقق من وجود العنصر قبل استخدام .checked
        const planNotifyCheckbox = document.getElementById('seasonalPlanNotifications');
        if (planNotifyCheckbox && planNotifyCheckbox.checked) {
            const notification = {
                type: 'seasonal-plan-new',
                message: `تم إضافة خطة شراء موسمية جديدة: ${planData.season} ${planData.year} للمورد ${planData.supplier}`,
                planId: planId,
                date: new Date().toISOString()
            };
            updateNotificationsDisplay([notification]);
        }
        
        database.ref('seasonal_plans/' + planId).set(planData)
            .then(() => {
                seasonalPlanModal.style.display = 'none';
                loadseasonal_plans();
            });
    }
    
    delete seasonalPlanForm.dataset.editId;
}

// تحديث عرض الجدول الزمني ليشمل خط زمني وألوان الحالة وأزرار التعديل والحذف
function showProductsTimeline(planId, supplier) {
    productsTimelineContainer.classList.remove('hidden');
    timelineSupplierName.textContent = supplier;
    const timelineList = document.getElementById('productsTimelineList');
    timelineList.innerHTML = '<div class="loading-message">جاري تحميل المنتجات...</div>';

    database.ref('seasonal_plans/' + planId).once('value').then(snapshot => {
        const plan = snapshot.val();
        if (!plan || !plan.products || plan.products.length === 0) {
            timelineList.innerHTML = '<div class="no-data-message">لا توجد منتجات لهذه الخطة</div>';
            return;
        }

        // ترتيب المنتجات حسب أول تاريخ وصول
        const sortedProducts = plan.products.slice().sort((a, b) => {
            const aDate = a.containerDetails && a.containerDetails.length > 0 ? a.containerDetails[0].date : '';
            const bDate = b.containerDetails && b.containerDetails.length > 0 ? b.containerDetails[0].date : '';
            return aDate.localeCompare(bDate);
        });

        timelineList.innerHTML = '';
        sortedProducts.forEach((product, idx) => {
            let containersHtml = '';
            if (product.containerDetails && product.containerDetails.length > 0) {
                containersHtml = '<div class="timeline-containers">';
                product.containerDetails.forEach((container, containerIdx) => {
                    const statusClass = {
                        'قيد الطلب': 'pending',
                        'تم الشحن': 'shipped',
                        'تم الاستلام': 'received',
                        'ملغي': 'cancelled'
                    }[container.status] || 'pending';
                    containersHtml += `
                        <div class="timeline-container ${statusClass}">
                            <div class="container-header">
                                <span class="container-date">${container.date || '-'}</span>
                                <span class="container-status">${container.status || 'قيد الطلب'}</span>
                            </div>
                            <div class="container-details">
                                <span class="container-quantity">الكمية: ${container.quantity || '-'}</span>
                                <span class="container-ref">المرجع: ${container.ref || '-'}</span>
                            </div>
                        </div>
                    `;
                });
                containersHtml += '</div>';
            }

            // بناء بطاقة المنتج
            const productElement = document.createElement('div');
            productElement.className = 'timeline-product';
            productElement.innerHTML = `
                <div class="timeline-product-header">
                    <div class="timeline-product-title">
                        ${product.name}
                        <span class="product-specs">${product.specs || ''}</span>
                        <span class="product-price">${product.price ? ('$' + Number(product.price).toFixed(2)) : ''}</span>
                    </div>
                    <div class="timeline-product-actions">
                        <button onclick="editSeasonalProduct('${planId}', ${plan.products.indexOf(product)})" class="edit-btn">
                            <i class="fas fa-edit"></i>
                            تعديل
                        </button>
                        <button onclick="deleteSeasonalProduct('${planId}', ${plan.products.indexOf(product)})" class="delete-btn">
                            <i class="fas fa-trash"></i>
                            حذف
                        </button>
                    </div>
                </div>
                ${containersHtml}
                ${product.notes ? `<div class="timeline-product-notes">${product.notes}</div>` : ''}
            `;
            timelineList.appendChild(productElement);
        });
    }).catch(error => {
        console.error('خطأ في تحميل المنتجات:', error);
        timelineList.innerHTML = '<div class="error-message">حدث خطأ أثناء تحميل المنتجات</div>';
    });
}

// دالة مراقبة إشعارات الخطط الموسمية
function setupseasonal_plansNotifications() {
    // مراقبة تغييرات الخطط الموسمية
    database.ref('seasonal_plans').on('value', (snapshot) => {
        const currentDate = new Date();
        let notifications = [];
        
        snapshot.forEach((child) => {
            const plan = child.val();
            
            // التحقق من حالة الخطة
            if (plan.status === 'مكتملة' && document.getElementById('seasonalPlanCompletionNotifications').checked) {
                notifications.push({
                    type: 'seasonal-plan-completion',
                    message: `تم إكمال خطة الشراء الموسمية ${plan.season} ${plan.year} للمورد ${plan.supplier}`,
                    planId: plan.id,
                    date: new Date().toISOString()
                });
            }
            
            // التحقق من مواعيد الشحن القادمة
            if (plan.products && document.getElementById('seasonal_planshippingNotifications').checked) {
                const daysBeforeShipping = parseInt(document.getElementById('daysBeforeShipping').value) || 7;
                
                plan.products.forEach(product => {
                    if (product.containerDetails) {
                        product.containerDetails.forEach(container => {
                            if (container.date && container.status !== 'تم الشحن' && container.status !== 'تم الاستلام') {
                                const shippingDate = new Date(container.date);
                                const daysUntilShipping = Math.ceil((shippingDate - currentDate) / (1000 * 60 * 60 * 24));
                                
                                if (daysUntilShipping <= daysBeforeShipping && daysUntilShipping > 0) {
                                    notifications.push({
                                        type: 'seasonal-plan-shipping',
                                        message: `موعد شحن ${product.name} في خطة ${plan.season} ${plan.year} خلال ${daysUntilShipping} يوم`,
                                        planId: plan.id,
                                        productName: product.name,
                                        date: new Date().toISOString()
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
        
        // تحديث عرض الإشعارات
        updateNotificationsDisplay(notifications);
    });
}

async function showProductsTimeline(planId, supplier) {
    try {
        // التحقق من وجود العناصر المطلوبة
        const timelineContainer = document.getElementById('productsTimelineContainer');
        const timelineList = document.getElementById('productsTimelineList');
        const supplierNameSpan = document.getElementById('timelineSupplierName');

        if (!timelineContainer || !timelineList || !supplierNameSpan) {
            console.warn('عناصر الجدول الزمني غير موجودة في الصفحة');
            return;
        }

        // تحديث اسم المورد وإظهار الحاوية
        supplierNameSpan.textContent = supplier || 'غير محدد';
        timelineContainer.classList.remove('hidden');
        timelineList.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> جاري تحميل المنتجات...</div>';

        // جلب بيانات الخطة
        const planRef = database.ref(`seasonal_plans/${planId}`);
        const snapshot = await planRef.once('value');
        const plan = snapshot.val();

        if (!plan) {
            throw new Error('الخطة غير موجودة في قاعدة البيانات');
        }

        if (!plan.products || !Array.isArray(plan.products) || plan.products.length === 0) {
            timelineList.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-box-open"></i>
                    <p>لا توجد منتجات في هذه الخطة</p>
                    <button onclick="showAddProductModal('${planId}')" class="primary-btn">
                        <i class="fas fa-plus"></i>
                        إضافة منتج جديد
                    </button>
                </div>
            `;
            return;
        }

        // ترتيب المنتجات حسب تاريخ الشحن
        const sortedProducts = plan.products
            .map((product, index) => ({ id: index, ...product }))
            .sort((a, b) => {
                const dateA = a.containerDetails?.[0]?.date || '';
                const dateB = b.containerDetails?.[0]?.date || '';
                return dateA.localeCompare(dateB);
            });

        // تفريغ القائمة وعرض المنتجات
        timelineList.innerHTML = '';
        sortedProducts.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'timeline-product';
            
            // بناء تفاصيل الحاويات
            let containersHtml = '';
            if (product.containerDetails && product.containerDetails.length > 0) {
                containersHtml = '<div class="timeline-containers">';
                product.containerDetails.forEach((container, idx) => {
                    const statusClass = {
                        'قيد الطلب': 'pending',
                        'تم الشحن': 'shipped',
                        'تم الاستلام': 'received',
                        'ملغي': 'cancelled'
                    }[container.status] || 'pending';

                    containersHtml += `
                        <div class="timeline-container ${statusClass}">
                            <div class="container-header">
                                <span class="container-date">${container.date || '-'}</span>
                                <span class="container-status">${container.status || 'قيد الطلب'}</span>
                            </div>
                            <div class="container-details">
                                <span class="container-quantity">الكمية: ${container.quantity || '-'}</span>
                                <span class="container-ref">المرجع: ${container.ref || '-'}</span>
                            </div>
                        </div>
                    `;
                });
                containersHtml += '</div>';
            }

            // بناء بطاقة المنتج
            productElement.innerHTML = `
                <div class="timeline-product-header">
                    <div class="timeline-product-title">
                        ${product.name}
                        <span class="product-specs">${product.specs || ''}</span>
                        ${product.price ? `<span class="product-price">$${Number(product.price).toFixed(2)}</span>` : ''}
                    </div>
                    <div class="timeline-product-actions">
                        <button onclick="editSeasonalProduct('${planId}', ${product.id})" class="edit-btn">
                            <i class="fas fa-edit"></i>
                            تعديل
                        </button>
                        <button onclick="deleteSeasonalProduct('${planId}', ${product.id})" class="delete-btn">
                            <i class="fas fa-trash"></i>
                            حذف
                        </button>
                    </div>
                </div>
                ${containersHtml}
                ${product.notes ? `<div class="timeline-product-notes">${product.notes}</div>` : ''}
            `;

            timelineList.appendChild(productElement);
        });

    } catch (error) {
        console.error('خطأ في عرض الجدول الزمني:', error);
        const timelineList = document.getElementById('productsTimelineList');
        if (timelineList) {
            timelineList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${error.message || 'حدث خطأ أثناء تحميل الجدول الزمني'}</p>
                    <button onclick="showProductsTimeline('${planId}', '${supplier}')" class="secondary-btn">
                        <i class="fas fa-redo"></i>
                        إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

function showAddSeasonalPlanModal() {
    const modal = document.getElementById('seasonalPlanModal');
    const form = document.getElementById('seasonalPlanForm');
    const title = document.getElementById('seasonalPlanModalTitle');
    
    if (!modal || !form || !title) {
        console.warn('عناصر نافذة إضافة الخطة غير موجودة');
        return;
    }

    // إعادة تعيين النموذج
    form.reset();
    title.textContent = 'إضافة خطة شراء موسمية';
    
    // إزالة معرف الخطة إذا كان موجوداً
    form.removeAttribute('data-plan-id');
    
    // إظهار النافذة
    modal.style.display = 'block';
}

async function showEditSeasonalPlanModal(planId) {
    try {
        const modal = document.getElementById('seasonalPlanModal');
        const form = document.getElementById('seasonalPlanForm');
        const title = document.getElementById('seasonalPlanModalTitle');
        
        if (!modal || !form || !title) {
            console.warn('عناصر نافذة تعديل الخطة غير موجودة');
            return;
        }

        // جلب بيانات الخطة
        const planRef = database.ref(`seasonal_plans/${planId}`);
        const snapshot = await planRef.once('value');
        const plan = snapshot.val();
        
        if (!plan) {
            console.warn('الخطة غير موجودة');
            return;
        }

        // تعبئة النموذج ببيانات الخطة
        form.querySelector('#season').value = plan.season || '';
        form.querySelector('#planYear').value = plan.year || '';
        form.querySelector('#planSupplier').value = plan.supplier || '';
        form.querySelector('#planNotes').value = plan.notes || '';
        form.querySelector('#planStatus').value = plan.status || 'قيد التنفيذ';
        
        // تخزين معرف الخطة
        form.setAttribute('data-plan-id', planId);
        
        // تحديث العنوان
        title.textContent = 'تعديل خطة الشراء الموسمية';
        
        // إظهار النافذة
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('خطأ في تحميل بيانات الخطة:', error);
        showToast('حدث خطأ أثناء تحميل بيانات الخطة', 'error');
    }
}

function createProductTimelineElement(product) {
    // بناء تفاصيل الحاويات
    let containersHtml = '';
    if (product.containerDetails && product.containerDetails.length > 0) {
        containersHtml = `<div class='timeline-containers-list'>` +
            product.containerDetails.map((c, idx) => {
                let statusClass = 'container-status-qid';
                if (c.status === 'تم الشحن') statusClass = 'container-status-shipped';
                else if (c.status === 'تم الاستلام') statusClass = 'container-status-received';
                else if (c.status === 'ملغى') statusClass = 'container-status-cancelled';
                return `<div class='timeline-container-item'>
                    <i class='fas fa-box'></i> حاوية ${idx + 1}
                    <span style='color:#2196F3'>${c.date}</span>
                    <span>كمية: ${c.quantity}</span>
                    <span>مرجع: ${c.ref}</span>
                    <span class='${statusClass}'>${c.status}</span>
                </div>`;
            }).join('') +
            `</div>`;
    }
    // بناء العنصر الرئيسي
    const div = document.createElement('div');
    div.className = 'timeline-product';
    div.innerHTML = `
        <div class='timeline-product-title'>${product.name}</div>
        <div class='timeline-product-meta'>المواصفات: ${product.specs || '-'} | عدد الحاويات: ${product.containers || 0}</div>
        ${containersHtml}
        <div class='timeline-product-meta'>ملاحظات: ${product.notes || '-'}</div>
    `;
    return div;
}

// نظام التصعيد التلقائي للطلبات والشحنات المتأخرة
function checkForEscalations() {
    const today = new Date();
    // فحص الشحنات المتأخرة
    database.ref('shipments').once('value').then(snapshot => {
        snapshot.forEach(child => {
            const shipment = child.val();
            if (shipment.arrivalDate && shipment.status !== 'تم الاستلام') {
                const arrival = new Date(shipment.arrivalDate);
                if (arrival < today) {
                    escalateItem('shipment', shipment, child.key);
                }
            }
        });
    });
    // فحص الطلبات المتأخرة
    database.ref('orders').once('value').then(snapshot => {
        snapshot.forEach(child => {
            const order = child.val();
            if (order.completionDate && order.status !== 'تم الشحن') {
                const completion = new Date(order.completionDate);
                if (completion < today) {
                    escalateItem('order', order, child.key);
                }
            }
        });
    });
}

// تنفيذ التصعيد: إشعار + تمييز + سجل نشاطات
function escalateItem(type, item, key) {
    // إشعار لجميع المستخدمين
    showToast(`⚠️ ${type === 'shipment' ? 'شحنة متأخرة' : 'طلب متأخر'}: ${item.supplier || item.supplierName || ''}`, 'error');
    // سجل النشاطات
    createNotification({
        type: 'escalation',
        message: `تم تصعيد ${type === 'shipment' ? 'شحنة متأخرة' : 'طلب متأخر'}: ${item.supplier || item.supplierName || ''}`,
        date: new Date().toISOString()
    });
    // تمييز العنصر في الجدول أو البطاقة (بإضافة كلاس)
    setTimeout(() => {
        if (type === 'shipment') {
            const row = document.querySelector(`[data-shipment-id='${key}']`);
            if (row) row.classList.add('escalated');
        } else if (type === 'order') {
            const row = document.querySelector(`[data-order-id='${key}']`);
            if (row) row.classList.add('escalated');
        }
    }, 500);
}

// إضافة كلاس CSS لعناصر التصعيد

// --- مهام الطلبات ---
function showOrderTasksModal(orderNumber) {
    const modal = document.getElementById('orderTasksModal');
    const closeBtn = document.getElementById('closeOrderTasksModal');
    const tasksList = document.getElementById('orderTasksList');
    const addForm = document.getElementById('addOrderTaskForm');
    const newTaskInput = document.getElementById('newOrderTaskTitle');
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    database.ref('orders/' + orderNumber).once('value').then(snapshot => {
        const order = snapshot.val();
        renderOrderTasks(order?.tasks || [], orderNumber);
    });
    addForm.onsubmit = (e) => {
        e.preventDefault();
        const title = newTaskInput.value.trim();
        if (!title) return;
        database.ref('orders/' + orderNumber).once('value').then(snapshot => {
            const order = snapshot.val();
            let tasks = order?.tasks || [];
            tasks.push({ title, status: 'غير منجزة' });
            database.ref('orders/' + orderNumber + '/tasks').set(tasks).then(() => {
                renderOrderTasks(tasks, orderNumber);
                newTaskInput.value = '';
            });
        });
    };
    modal.style.display = 'block';
}
function renderOrderTasks(tasks, orderNumber) {
    const tasksList = document.getElementById('orderTasksList');
    if (!tasks.length) {
        tasksList.innerHTML = '<div class=\"no-data-message\">لا توجد مهام لهذا الطلب</div>';
        return;
    }
    tasksList.innerHTML = tasks.map((task, idx) => `
        <div class=\"task-item\" style=\"display:flex;align-items:center;gap:8px;margin-bottom:8px;\">
            <input type=\"checkbox\" ${task.status === 'منجزة' ? 'checked' : ''} onchange=\"updateOrderTaskStatus('${orderNumber}', ${idx}, this.checked)\">
            <span style=\"flex:1;${task.status === 'منجزة' ? 'text-decoration:line-through;color:#888;' : ''}\">${task.title}</span>
            <button class=\"delete-btn\" onclick=\"deleteOrderTask('${orderNumber}', ${idx})\">حذف</button>
        </div>
    `).join('');
}
function updateOrderTaskStatus(orderNumber, idx, done) {
    database.ref('orders/' + orderNumber).once('value').then(snapshot => {
        const order = snapshot.val();
        let tasks = order?.tasks || [];
        if (tasks[idx]) {
            tasks[idx].status = done ? 'منجزة' : 'غير منجزة';
            database.ref('orders/' + orderNumber + '/tasks').set(tasks).then(() => {
                renderOrderTasks(tasks, orderNumber);
            });
        }
    });
}
function deleteOrderTask(orderNumber, idx) {
    database.ref('orders/' + orderNumber).once('value').then(snapshot => {
        const order = snapshot.val();
        let tasks = order?.tasks || [];
        tasks.splice(idx, 1);
        database.ref('orders/' + orderNumber + '/tasks').set(tasks).then(() => {
            renderOrderTasks(tasks, orderNumber);
        });
    });
}

// --- مهام الشحنات ---
function showShipmentTasksModal(shipmentNumber) {
    const modal = document.getElementById('shipmentTasksModal');
    const closeBtn = document.getElementById('closeShipmentTasksModal');
    const tasksList = document.getElementById('shipmentTasksList');
    const addForm = document.getElementById('addShipmentTaskForm');
    const newTaskInput = document.getElementById('newShipmentTaskTitle');
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    database.ref('shipments/' + shipmentNumber).once('value').then(snapshot => {
        const shipment = snapshot.val();
        renderShipmentTasks(shipment?.tasks || [], shipmentNumber);
    });
    addForm.onsubmit = (e) => {
        e.preventDefault();
        const title = newTaskInput.value.trim();
        if (!title) return;
        database.ref('shipments/' + shipmentNumber).once('value').then(snapshot => {
            const shipment = snapshot.val();
            let tasks = shipment?.tasks || [];
            tasks.push({ title, status: 'غير منجزة' });
            database.ref('shipments/' + shipmentNumber + '/tasks').set(tasks).then(() => {
                renderShipmentTasks(tasks, shipmentNumber);
                newTaskInput.value = '';
            });
        });
    };
    modal.style.display = 'block';
}
function renderShipmentTasks(tasks, shipmentNumber) {
    const tasksList = document.getElementById('shipmentTasksList');
    if (!tasks.length) {
        tasksList.innerHTML = '<div class=\"no-data-message\">لا توجد مهام لهذه الشحنة</div>';
        return;
    }
    tasksList.innerHTML = tasks.map((task, idx) => `
        <div class=\"task-item\" style=\"display:flex;align-items:center;gap:8px;margin-bottom:8px;\">
            <input type=\"checkbox\" ${task.status === 'منجزة' ? 'checked' : ''} onchange=\"updateShipmentTaskStatus('${shipmentNumber}', ${idx}, this.checked)\">
            <span style=\"flex:1;${task.status === 'منجزة' ? 'text-decoration:line-through;color:#888;' : ''}\">${task.title}</span>
            <button class=\"delete-btn\" onclick=\"deleteShipmentTask('${shipmentNumber}', ${idx})\">حذف</button>
        </div>
    `).join('');
}
function updateShipmentTaskStatus(shipmentNumber, idx, done) {
    database.ref('shipments/' + shipmentNumber).once('value').then(snapshot => {
        const shipment = snapshot.val();
        let tasks = shipment?.tasks || [];
        if (tasks[idx]) {
            tasks[idx].status = done ? 'منجزة' : 'غير منجزة';
            database.ref('shipments/' + shipmentNumber + '/tasks').set(tasks).then(() => {
                renderShipmentTasks(tasks, shipmentNumber);
            });
        }
    });
}
function deleteShipmentTask(shipmentNumber, idx) {
    database.ref('shipments/' + shipmentNumber).once('value').then(snapshot => {
        const shipment = snapshot.val();
        let tasks = shipment?.tasks || [];
        tasks.splice(idx, 1);
        database.ref('shipments/' + shipmentNumber + '/tasks').set(tasks).then(() => {
            renderShipmentTasks(tasks, shipmentNumber);
        });
    });
}

// --- ربط الدوال مع window ---
window.showOrderTasksModal = showOrderTasksModal;
window.showShipmentTasksModal = showShipmentTasksModal;

// مقارنة الأسعار تلقائيًا عند إضافة طلب جديد
function compareProductPrice() {
    const productName = document.getElementById('goodsType').value.trim();
    const currentPrice = parseFloat(document.getElementById('containerValue').value) || 0;
    const infoDiv = document.getElementById('priceComparisonInfo');
    if (!infoDiv) return;
    if (!productName || !currentPrice) {
        infoDiv.textContent = '';
        return;
    }
    database.ref('orders').once('value').then(snapshot => {
        let prices = [];
        snapshot.forEach(child => {
            const order = child.val();
            if (order.goodsType && order.goodsType.trim() === productName && order.containerValue) {
                prices.push(parseFloat(order.containerValue));
            }
        });
        if (prices.length === 0) {
            infoDiv.textContent = 'لا يوجد بيانات تاريخية لهذا المنتج.';
            infoDiv.style.color = '#666';
            return;
        }
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        infoDiv.textContent = `متوسط السعر التاريخي: ${avg.toFixed(2)} $`;
        infoDiv.style.color = '#2196F3';
        if (currentPrice > avg * 1.0) {
            const percent = (((currentPrice - avg) / avg) * 100).toFixed(1);
            infoDiv.textContent += ` ⚠️ السعر الحالي أعلى من المتوسط بنسبة ${percent}%`;
            infoDiv.style.color = '#e53935';
        }
    });
}

// إضافة مستمعات الأحداث عند تحميل الصفحة
if (document.getElementById('goodsType')) {
    document.getElementById('goodsType').addEventListener('input', compareProductPrice);
}
if (document.getElementById('containerValue')) {
    document.getElementById('containerValue').addEventListener('input', compareProductPrice);
}

// تحليل تأخير الموردين وإرسال إشعارات ذكية
function analyzeSupplierDelays() {
    const currentDate = new Date();
    const twoMonthsAgo = new Date(currentDate.getTime() - (60 * 24 * 60 * 60 * 1000)); // قبل شهرين

    // تحليل الشحنات
    database.ref('shipments').once('value').then(snapshot => {
        const supplierDelays = {};
        
        snapshot.forEach(child => {
            const shipment = child.val();
            const arrivalDate = new Date(shipment.arrivalDate);
            const actualArrivalDate = shipment.actualArrivalDate ? new Date(shipment.actualArrivalDate) : null;
            
            // تحليل الشحنات في آخر شهرين فقط
            if (arrivalDate >= twoMonthsAgo) {
                const supplier = shipment.supplier;
                if (!supplierDelays[supplier]) {
                    supplierDelays[supplier] = {
                        totalShipments: 0,
                        delayedShipments: 0,
                        delays: []
                    };
                }
                
                supplierDelays[supplier].totalShipments++;
                
                // حساب التأخير إذا كان هناك تاريخ وصول فعلي
                if (actualArrivalDate && actualArrivalDate > arrivalDate) {
                    const delayDays = Math.ceil((actualArrivalDate - arrivalDate) / (1000 * 60 * 60 * 24));
                    supplierDelays[supplier].delayedShipments++;
                    supplierDelays[supplier].delays.push({
                        shipmentNumber: shipment.shipmentNumber,
                        delayDays: delayDays,
                        goodsType: shipment.goodsType
                    });
                }
            }
        });

        // تحليل النتائج وإرسال إشعارات للموردين المتأخرين
        Object.entries(supplierDelays).forEach(([supplier, data]) => {
            if (data.totalShipments >= 3 && data.delayedShipments >= 2) {
                const delayRate = (data.delayedShipments / data.totalShipments) * 100;
                const averageDelay = data.delays.reduce((sum, d) => sum + d.delayDays, 0) / data.delays.length;
                
                // إرسال إشعار ذكي
                createNotification({
                    type: 'smart-alert',
                    message: `تنبيه: المورد ${supplier} لديه ${delayRate.toFixed(0)}% تأخير في الشحنات. 
                             متوسط التأخير ${averageDelay.toFixed(1)} يوم. 
                             عدد الشحنات المتأخرة: ${data.delayedShipments} من أصل ${data.totalShipments}`,
                    priority: 'high',
                    supplier: supplier,
                    delayRate: delayRate,
                    averageDelay: averageDelay
                });
            }
        });
    });
}

// تحديث دالة setupNotifications لتشمل التحليل الذكي
function setupNotifications() {
    // ... existing code ...

    // تشغيل تحليل تأخير الموردين عند تحميل الصفحة
    analyzeSupplierDelays();
    
    // تشغيل التحليل كل 6 ساعات
    setInterval(analyzeSupplierDelays, 6 * 60 * 60 * 1000);
}

// تحديث دالة getNotificationTitle لتشمل الإشعارات الذكية
function getNotificationTitle(type) {
    const titles = {
        // ... existing code ...
        'smart-alert': 'تنبيه ذكي',
        // ... existing code ...
    };
    return titles[type] || 'إشعار';
}

// تحديث دالة فلترة الطلبات
function filterOrdersTable() {
    const searchValue = document.getElementById('orderSearchInput').value;
    const statusFilter = document.getElementById('orderStatusFilter').value;
    const supplierFilter = document.getElementById('orderSupplierFilter').value;
    const startDate = document.getElementById('orderStartDate').value;
    const endDate = document.getElementById('orderEndDate').value;

    // حفظ حالة الفلترة
    filterStates.orders = {
        search: searchValue,
        status: statusFilter,
        supplier: supplierFilter,
        dateRange: { start: startDate, end: endDate }
    };

    const rows = document.querySelectorAll('#ordersTable tbody tr');
    rows.forEach(row => {
        const orderNumber = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
        const supplier = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const status = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const date = new Date(row.querySelector('td:nth-child(4)').textContent);

        const matchesSearch = orderNumber.includes(searchValue.toLowerCase()) ||
                            supplier.includes(searchValue.toLowerCase());
        const matchesStatus = !statusFilter || status === statusFilter.toLowerCase();
        const matchesSupplier = !supplierFilter || supplier === supplierFilter.toLowerCase();
        const matchesDate = (!startDate || date >= new Date(startDate)) &&
                          (!endDate || date <= new Date(endDate));

        row.style.display = matchesSearch && matchesStatus && matchesSupplier && matchesDate ? '' : 'none';
    });
}

// تحديث دالة فلترة الشحنات
function filterShipmentsTable() {
    const searchValue = document.getElementById('shipmentSearchInput').value;
    const statusFilter = document.getElementById('shipmentStatusFilter').value;
    const supplierFilter = document.getElementById('shipmentSupplierFilter').value;
    const startDate = document.getElementById('shipmentStartDate').value;
    const endDate = document.getElementById('shipmentEndDate').value;

    // حفظ حالة الفلترة
    filterStates.shipments = {
        search: searchValue,
        status: statusFilter,
        supplier: supplierFilter,
        dateRange: { start: startDate, end: endDate }
    };

    const rows = document.querySelectorAll('#shipmentsTable tbody tr');
    rows.forEach(row => {
        const shipmentNumber = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
        const supplier = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const status = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const date = new Date(row.querySelector('td:nth-child(4)').textContent);

        const matchesSearch = shipmentNumber.includes(searchValue.toLowerCase()) ||
                            supplier.includes(searchValue.toLowerCase());
        const matchesStatus = !statusFilter || status === statusFilter.toLowerCase();
        const matchesSupplier = !supplierFilter || supplier === supplierFilter.toLowerCase();
        const matchesDate = (!startDate || date >= new Date(startDate)) &&
                          (!endDate || date <= new Date(endDate));

        row.style.display = matchesSearch && matchesStatus && matchesSupplier && matchesDate ? '' : 'none';
    });
}

// تحديث دالة فلترة الخطط الموسمية
function filterseasonal_plansTable() {
    const getElementValue = (elementId) => {
        const element = document.getElementById(elementId);
        return element ? element.value : '';
    };

    const searchValue = getElementValue('seasonal_plansearchInput');
    const supplierFilter = getElementValue('seasonal_plansupplierFilter');
    const statusFilter = getElementValue('seasonal_planstatusFilter');
    const seasonFilter = getElementValue('seasonal_planseasonFilter');

    // حفظ حالة الفلترة
    filterStates.seasonal_plans = {
        search: searchValue,
        supplier: supplierFilter,
        status: statusFilter,
        season: seasonFilter
    };

    const table = document.getElementById('seasonal_plansTable');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    if (!rows.length) return;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return;

        const planName = (cells[0]?.textContent || '').toLowerCase();
        const supplier = (cells[1]?.textContent || '').toLowerCase();
        const status = (cells[2]?.textContent || '').toLowerCase();
        const season = (cells[3]?.textContent || '').toLowerCase();

        const matchesSearch = !searchValue || 
            planName.includes(searchValue.toLowerCase()) ||
            supplier.includes(searchValue.toLowerCase());
        const matchesSupplier = !supplierFilter || supplier === supplierFilter.toLowerCase();
        const matchesStatus = !statusFilter || status === statusFilter.toLowerCase();
        const matchesSeason = !seasonFilter || season === seasonFilter.toLowerCase();

        row.style.display = matchesSearch && matchesSupplier && matchesStatus && matchesSeason ? '' : 'none';
    });
}

// دالة إعادة تطبيق الفلترة بعد تحديث الجدول
function reapplyFilters(tableType) {
    const setElementValue = (elementId, value) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    };

    switch(tableType) {
        case 'orders':
            setElementValue('orderSearchInput', filterStates.orders.search);
            setElementValue('orderStatusFilter', filterStates.orders.status);
            setElementValue('orderSupplierFilter', filterStates.orders.supplier);
            setElementValue('orderStartDate', filterStates.orders.dateRange.start || '');
            setElementValue('orderEndDate', filterStates.orders.dateRange.end || '');
            if (typeof filterOrdersTable === 'function') {
                filterOrdersTable();
            }
            break;
        case 'shipments':
            setElementValue('shipmentSearchInput', filterStates.shipments.search);
            setElementValue('shipmentStatusFilter', filterStates.shipments.status);
            setElementValue('shipmentSupplierFilter', filterStates.shipments.supplier);
            setElementValue('shipmentStartDate', filterStates.shipments.dateRange.start || '');
            setElementValue('shipmentEndDate', filterStates.shipments.dateRange.end || '');
            if (typeof filterShipmentsTable === 'function') {
                filterShipmentsTable();
            }
            break;
        case 'seasonal_plans':
            setElementValue('seasonal_plansearchInput', filterStates.seasonal_plans.search);
            setElementValue('seasonal_plansupplierFilter', filterStates.seasonal_plans.supplier);
            setElementValue('seasonal_planstatusFilter', filterStates.seasonal_plans.status);
            setElementValue('seasonal_planseasonFilter', filterStates.seasonal_plans.season);
            if (typeof filterseasonal_plansTable === 'function') {
                filterseasonal_plansTable();
            }
            break;
    }
}

// تحديث دوال حفظ وتحديث البيانات لتطبيق الفلترة بعد التحديث
function handleOrderSubmit(e) {
    e.preventDefault();
    const orderData = {
        orderNumber: document.getElementById('orderNumber').value,
        supplierName: document.getElementById('supplierName').value,
        goodsType: document.getElementById('goodsType').value,
        quantity: parseFloat(document.getElementById('quantity').value),
        unit: document.getElementById('unit').value,
        packageCount: parseInt(document.getElementById('packageCount').value),
        orderDate: document.getElementById('orderDate').value,
        completionDate: document.getElementById('completionDate').value,
        containerValue: parseFloat(document.getElementById('containerValue').value),
        bookingFees: parseFloat(document.getElementById('bookingFees').value),
        status: document.getElementById('status').value
    };

    // حساب القيم التلقائية
    orderData.totalValue = orderData.containerValue + orderData.bookingFees;
    orderData.unitCost = orderData.bookingFees / orderData.quantity;

    database.ref('orders').push(orderData)
        .then(() => {
            showSuccessMessage('تم حفظ الطلب بنجاح');
            closeModal('addOrderModal');
            loadOrdersTable();
            reapplyFilters('orders'); // إعادة تطبيق الفلترة
        })
        .catch(error => {
            console.error('Error saving order:', error);
            showErrorMessage('حدث خطأ أثناء حفظ الطلب');
        });
}

function handleShipmentSubmit(e) {
    e.preventDefault();
    const shipmentData = {
        shipmentNumber: document.getElementById('shipmentNumber').value,
        orderNumber: orderSelect.value,
        blNumber: document.getElementById('blNumber').value,
        containerNumber: document.getElementById('containerNumber').value,
        goodsType: document.getElementById('goodsTypeShipment').value,
        quantity: document.getElementById('quantityShipment').value,
        unit: document.getElementById('unitShipment').value,
        shipmentDate: document.getElementById('shipmentDate').value,
        arrivalDate: document.getElementById('arrivalDate').value,
        shippingCompany: document.getElementById('shippingCompany').value,
        status: document.getElementById('shipmentStatus').value,
        notes: document.getElementById('shipmentNotes').value || '', // إضافة حقل الملاحظات
        documents: {}, // كائن فارغ للمستندات
        notificationSent: false // إضافة حقل جديد لتتبع حالة التنبيه
    };

    // إضافة المستندات المتوفرة فقط
    if (currentFiles.has('invoice')) {
        shipmentData.documents.invoice = currentFiles.get('invoice');
    }
    if (currentFiles.has('certificate')) {
        shipmentData.documents.certificate = currentFiles.get('certificate');
    }
    if (currentFiles.has('policy')) {
        shipmentData.documents.policy = currentFiles.get('policy');
    }
    if (currentFiles.has('packingList')) {
        shipmentData.documents.packingList = currentFiles.get('packingList');
    }

    database.ref('shipments').push(shipmentData)
        .then(() => {
            showSuccessMessage('تم حفظ الشحنة بنجاح');
            closeModal('addShipmentModal');
            loadShipmentsTable();
            reapplyFilters('shipments'); // إعادة تطبيق الفلترة
        })
        .catch(error => {
            console.error('Error saving shipment:', error);
            showErrorMessage('حدث خطأ أثناء حفظ الشحنة');
        });
}

function handleseasonal_plansubmit(e) {
    e.preventDefault();
    const planData = {
        id: seasonalPlanForm.dataset.editId || Date.now().toString(),
        season: document.getElementById('season').value,
        year: document.getElementById('planYear').value,
        supplier: document.getElementById('planSupplier').value,
        notes: document.getElementById('planNotes').value,
        status: document.getElementById('planStatus').value
    };

    // إذا كان تعديلاً، تحقق من تغيير الحالة
    if (seasonalPlanForm.dataset.editId) {
        database.ref('seasonal_plans/' + planData.id).once('value').then(snapshot => {
            const oldPlan = snapshot.val();
            const oldStatus = oldPlan.status;
            
            // تحقق من وجود العنصر قبل استخدام .checked
            const statusNotifyCheckbox = document.getElementById('seasonal_planstatusNotifications');
            if (oldStatus !== planData.status && statusNotifyCheckbox && statusNotifyCheckbox.checked) {
                const notification = {
                    type: 'seasonal-plan-status',
                    message: `تم تغيير حالة خطة ${oldPlan.season} ${oldPlan.year} من ${oldStatus} إلى ${planData.status}`,
                    planId: planData.id,
                    date: new Date().toISOString()
                };
                updateNotificationsDisplay([notification]);
            }
            
            // تحديث الخطة مع الحفاظ على المنتجات
            const updatedPlan = {
                id: planData.id,
                season: planData.season,
                year: planData.year,
                supplier: planData.supplier,
                notes: planData.notes,
                status: planData.status,
                products: oldPlan.products || []
            };
            
            database.ref('seasonal_plans/' + planData.id).set(updatedPlan)
                .then(() => {
                    showSuccessMessage('تم حفظ الخطة الموسمية بنجاح');
                    closeModal('addSeasonalPlanModal');
                    loadseasonal_plans();
                    reapplyFilters('seasonal_plans'); // إعادة تطبيق الفلترة
                });
        });
    } else {
        // إضافة خطة جديدة
        const newPlan = {
            id: planData.id,
            season: planData.season,
            year: planData.year,
            supplier: planData.supplier,
            notes: planData.notes,
            status: planData.status,
            products: []
        };
        
        // تحقق من وجود العنصر قبل استخدام .checked
        const planNotifyCheckbox = document.getElementById('seasonalPlanNotifications');
        if (planNotifyCheckbox && planNotifyCheckbox.checked) {
            const notification = {
                type: 'seasonal-plan-new',
                message: `تم إضافة خطة شراء موسمية جديدة: ${newPlan.season} ${newPlan.year} للمورد ${newPlan.supplier}`,
                planId: newPlan.id,
                date: new Date().toISOString()
            };
            updateNotificationsDisplay([notification]);
        }
        
        database.ref('seasonal_plans').push(newPlan)
            .then(() => {
                showSuccessMessage('تم حفظ الخطة الموسمية بنجاح');
                closeModal('addSeasonalPlanModal');
                loadseasonal_plans();
                reapplyFilters('seasonal_plans'); // إعادة تطبيق الفلترة
            });
    }
    
    delete seasonalPlanForm.dataset.editId;
}

// تحديث دوال التعديل والحذف أيضاً
function editOrder(orderId) {
    const orderData = {
        orderNumber: document.getElementById('orderNumber').value,
        supplierName: document.getElementById('supplierName').value,
        goodsType: document.getElementById('goodsType').value,
        quantity: parseFloat(document.getElementById('quantity').value),
        unit: document.getElementById('unit').value,
        packageCount: parseInt(document.getElementById('packageCount').value),
        orderDate: document.getElementById('orderDate').value,
        completionDate: document.getElementById('completionDate').value,
        containerValue: parseFloat(document.getElementById('containerValue').value),
        bookingFees: parseFloat(document.getElementById('bookingFees').value),
        status: document.getElementById('status').value
    };

    database.ref('orders/' + orderId).update(orderData)
        .then(() => {
            showSuccessMessage('تم تحديث الطلب بنجاح');
            closeModal('editOrderModal');
            loadOrdersTable();
            reapplyFilters('orders'); // إعادة تطبيق الفلترة
        })
        .catch(error => {
            console.error('Error updating order:', error);
            showErrorMessage('حدث خطأ أثناء تحديث الطلب');
        });
}

function deleteOrder(orderId) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        database.ref('orders/' + orderId).remove()
            .then(() => {
                showSuccessMessage('تم حذف الطلب بنجاح');
                loadOrdersTable();
                reapplyFilters('orders'); // إعادة تطبيق الفلترة
            })
            .catch(error => {
                console.error('Error deleting order:', error);
                showErrorMessage('حدث خطأ أثناء حذف الطلب');
            });
    }
}

// نفس التحديثات لدوال الشحنات والخطط الموسمية
// ... existing code ...

// إضافة دوال الرسائل
function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showErrorMessage(message) {
    showToast(message, 'error');
}

// تحديث دالة تشغيل الصوت
let notificationSound = null;
let soundEnabled = false;

async function initializeNotificationSound() {
    try {
        // إنشاء عنصر صوت جديد
        notificationSound = new Audio('sounds/notification.mp3');
        // تحميل الصوت مسبقاً
        await notificationSound.load();
        // تعطيل التشغيل التلقائي
        notificationSound.autoplay = false;
        soundEnabled = true;
    } catch (error) {
        console.warn('Could not initialize notification sound:', error);
        soundEnabled = false;
    }
}

async function playNotificationSound() {
    if (!soundEnabled || !notificationSound) {
        try {
            await initializeNotificationSound();
        } catch (error) {
            console.warn('Failed to initialize notification sound:', error);
            return;
        }
    }

    try {
        // إعادة تعيين الصوت إلى البداية
        notificationSound.currentTime = 0;
        // محاولة تشغيل الصوت
        const playPromise = notificationSound.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name === 'NotAllowedError') {
                    // إذا كان الخطأ بسبب عدم تفاعل المستخدم، نقوم بتعطيل الصوت
                    soundEnabled = false;
                    console.warn('Sound playback not allowed - user interaction required');
                } else {
                    console.error('Error playing notification sound:', error);
                }
            });
        }
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
}

// تحديث دالة إعداد الإشعارات
function setupNotifications() {
    // تهيئة الصوت عند تحميل الصفحة
    initializeNotificationSound();
    
    // إضافة مستمع لحدث النقر على الصفحة لتفعيل الصوت
    document.addEventListener('click', async () => {
        if (!soundEnabled) {
            try {
                await initializeNotificationSound();
            } catch (error) {
                console.warn('Failed to initialize notification sound on click:', error);
            }
        }
    }, { once: true });

    // ... باقي كود إعداد الإشعارات ...
}

async function showAddProductModal(planId) {
    try {
        // التحقق من وجود الخطة قبل عرض النموذج
        const snapshot = await database.ref('seasonal_plans/' + planId).once('value');
        const plan = snapshot.val();
        
        if (!plan) {
            showToast('الخطة غير موجودة في قاعدة البيانات', 'error');
            return;
        }

        // إعادة تعيين النموذج وتعيين معرف الخطة
        seasonalProductForm.reset();
        seasonalProductForm.dataset.planId = planId;
        
        // تحديث عنوان النافذة
        document.getElementById('seasonalProductModalTitle').innerHTML = 
            `<i class="fas fa-plus" style="color:#4CAF50;"></i> إضافة منتج جديد - ${plan.supplier || 'مورد'} - ${plan.season || 'موسم'} ${plan.year || ''}`;
        
        // عرض النافذة
        seasonalProductModal.style.display = 'block';
        
        // إعادة تهيئة حقول الحاويات
        setupContainerDatesDynamicInput();
    } catch (error) {
        console.error('خطأ في فتح نافذة إضافة المنتج:', error);
        showToast('حدث خطأ أثناء فتح نافذة إضافة المنتج', 'error');
    }
}