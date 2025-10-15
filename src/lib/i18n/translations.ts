export type Language = 'en' | 'ar'

export const translations = {
  en: {
    // Auth
    login: 'Login',
    email: 'Email',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    loginButton: 'Sign in',
    loggingIn: 'Signing in...',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    loginError: 'Invalid email or password',

    // Dashboard
    dashboard: 'Dashboard',
    welcome: 'Welcome to your ERP Mobile Progressive Web App',
    totalEmployees: 'Total Employees',
    active: 'Active',
    inactive: 'Inactive',
    activeOrders: 'Active Orders',
    inventoryItems: 'Inventory Items',
    lowStock: 'low stock',
    newToday: 'new today',
    recentActivity: 'Recent Activity',

    // Navigation
    home: 'Home',
    sales: 'Sales',
    inventory: 'Inventory',
    products: 'Products',
    customers: 'Customers',
    reports: 'Reports',
    documents: 'Documents',
    settings: 'Settings',
    more: 'More',

    // Common
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    logout: 'Logout',
    language: 'Language',
  },
  ar: {
    // Auth
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    rememberMe: 'تذكرني',
    forgotPassword: 'نسيت كلمة المرور؟',
    loginButton: 'دخول',
    loggingIn: 'جاري تسجيل الدخول...',
    emailRequired: 'البريد الإلكتروني مطلوب',
    passwordRequired: 'كلمة المرور مطلوبة',
    loginError: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',

    // Dashboard
    dashboard: 'لوحة التحكم',
    welcome: 'مرحباً بك في تطبيق ERP للهاتف المحمول',
    totalEmployees: 'إجمالي الموظفين',
    active: 'نشط',
    inactive: 'غير نشط',
    activeOrders: 'الطلبات النشطة',
    inventoryItems: 'عناصر المخزون',
    lowStock: 'مخزون منخفض',
    newToday: 'جديد اليوم',
    recentActivity: 'النشاط الأخير',

    // Navigation
    home: 'الرئيسية',
    sales: 'المبيعات',
    inventory: 'المخزون',
    products: 'المنتجات',
    customers: 'العملاء',
    reports: 'التقارير',
    documents: 'المستندات',
    settings: 'الإعدادات',
    more: 'المزيد',

    // Common
    loading: 'جاري التحميل...',
    error: 'خطأ',
    save: 'حفظ',
    cancel: 'إلغاء',
    logout: 'تسجيل الخروج',
    language: 'اللغة',
  },
}

export type TranslationKey = keyof typeof translations.en
