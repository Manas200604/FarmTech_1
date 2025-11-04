import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation data
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    schemes: 'Schemes',
    contacts: 'Contacts',
    treatments: 'Treatments',
    materials: 'Materials',
    support: 'Support',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    
    // Common
    welcome: 'Welcome',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    
    // Materials
    orderMaterials: 'Order Materials',
    materialName: 'Material Name',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    addToCart: 'Add to Cart',
    cart: 'Cart',
    checkout: 'Checkout',
    paymentDetails: 'Payment Details',
    transactionId: 'Transaction ID',
    customerName: 'Customer Name',
    paymentScreenshot: 'Payment Screenshot',
    uploadScreenshot: 'Upload Payment Screenshot',
    orderPlaced: 'Order Placed Successfully',
    pendingVerification: 'Pending Manual Verification',
    
    // Enhanced Materials System
    materialsManagement: 'Materials Management',
    addMaterial: 'Add Material',
    editMaterial: 'Edit Material',
    deleteMaterial: 'Delete Material',
    materialDescription: 'Material Description',
    materialCategory: 'Category',
    materialUnit: 'Unit',
    materialStock: 'Stock',
    availability: 'Availability',
    available: 'Available',
    outOfStock: 'Out of Stock',
    materialImage: 'Material Image',
    
    // Shopping Cart
    shoppingCart: 'Shopping Cart',
    cartEmpty: 'Your cart is empty',
    removeFromCart: 'Remove from Cart',
    updateQuantity: 'Update Quantity',
    cartTotal: 'Cart Total',
    proceedToCheckout: 'Proceed to Checkout',
    
    // Order Management
    orderHistory: 'Order History',
    orderStatus: 'Order Status',
    orderDate: 'Order Date',
    orderNumber: 'Order Number',
    orderItems: 'Order Items',
    orderTotal: 'Order Total',
    trackOrder: 'Track Order',
    cancelOrder: 'Cancel Order',
    
    // Payment System
    paymentInstructions: 'Payment Instructions',
    paymentMethod: 'Payment Method',
    upiPayment: 'UPI Payment',
    qrCodePayment: 'QR Code Payment',
    paymentAmount: 'Payment Amount',
    paymentStatus: 'Payment Status',
    paymentVerification: 'Payment Verification',
    paymentApproved: 'Payment Approved',
    paymentRejected: 'Payment Rejected',
    
    // Admin Panel
    adminDashboard: 'Admin Dashboard',
    pendingOrders: 'Pending Orders',
    verifyPayment: 'Verify Payment',
    approvePayment: 'Approve Payment',
    rejectPayment: 'Reject Payment',
    orderManagement: 'Order Management',
    
    // Status Messages
    orderConfirmed: 'Order Confirmed',
    orderProcessing: 'Order Processing',
    orderShipped: 'Order Shipped',
    orderDelivered: 'Order Delivered',
    orderCancelled: 'Order Cancelled',
    
    // Product Catalog
    browseProducts: 'Browse Products',
    farmingMaterials: 'Farming Materials',
    addedToCart: 'added to cart',
    productCatalog: 'Product Catalog',
    
    // Forms
    name: 'Name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    phone: 'Phone Number',
    address: 'Address',
    
    // Messages
    somethingWentWrong: 'Something went wrong',
    tryAgain: 'Try Again',
    refreshPage: 'Refresh Page',
    
    // Navigation Items
    upload: 'Upload',
    
    // Agricultural Store
    agriculturalStore: 'Agricultural Materials Store',
    storeDescription: 'Complete range of pesticides, fertilizers, and agricultural tools with market prices',
    allProducts: 'All Products',
    pesticides: 'Pesticides',
    tools: 'Agricultural Tools',
    priceRange: 'Price Range',
    clearFilters: 'Clear Filters',
    category: 'Category',
    type: 'Type',
    brand: 'Brand',
    stock: 'Stock',
    
    // Cart specific
    subtotal: 'Subtotal',
    tax: 'Tax',
    clearCart: 'Clear Cart',
    proceedToPayment: 'Proceed to Payment',
    
    // Orders
    recentOrders: 'Recent Orders',
    order: 'Order',
    
    // Common UI Elements
    per: 'per',
    inCart: 'in cart',
    found: 'found',
    sortBy: 'Sort by',
    sortName: 'Name',
    sortPriceLow: 'Price: Low to High',
    sortPriceHigh: 'Price: High to Low',
    sortCategory: 'Category',
    sortStock: 'Stock',
    
    // Additional UI Elements
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    open: 'Open',
    view: 'View',
    details: 'Details',
    remove: 'Remove',
    update: 'Update',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    
    // Checkout Process
    'checkout.paymentMethod': 'Payment Method',
    'checkout.orderSummary': 'Order Summary',
    'checkout.subtotal': 'Subtotal',
    'checkout.tax': 'Tax (5%)',
    'checkout.shipping': 'Shipping',
    'checkout.free': 'Free',
    'checkout.total': 'Total',
    'checkout.shippingAddress': 'Shipping Address',
    'checkout.fullName': 'Full Name',
    'checkout.phone': 'Phone Number',
    'checkout.address': 'Address',
    'checkout.city': 'City',
    'checkout.state': 'State',
    'checkout.pincode': 'Pincode',
    'checkout.selectPaymentMethod': 'Select Payment Method',
    'checkout.placeOrder': 'Place Order',
    'checkout.proceedToPayment': 'Proceed to Payment',
    'checkout.paymentVerification': 'Payment Verification',
    'checkout.scanQR': 'Scan QR Code to Pay',
    'checkout.amount': 'Amount',
    'checkout.cardPayment': 'Card Payment',
    'checkout.cardInstructions': 'Please make the payment using your preferred card payment method and upload the transaction screenshot below.',
    'checkout.verificationDetails': 'Verification Details',
    'checkout.farmerName': 'Farmer Name',
    'checkout.transactionId': 'Transaction ID',
    'checkout.enterTransactionId': 'Enter UPI/Card transaction ID',
    'checkout.paymentScreenshot': 'Payment Screenshot',
    'checkout.uploadScreenshot': 'Click to upload payment screenshot',
    'checkout.note': 'Note',
    'checkout.verificationNote': 'After submitting, our team will manually verify your payment within 24 hours.',
    'checkout.submitting': 'Submitting...',
    'checkout.submitOrder': 'Submit Order',
    'checkout.orderSuccess': 'Order Submitted Successfully!',
    'checkout.codConfirmation': 'Your order has been confirmed. We will contact you soon for delivery.',
    'checkout.paymentConfirmation': 'Your payment verification has been submitted. We will verify and process your order within 24 hours.',
    'checkout.orderDetails': 'Order Details',
    'checkout.orderTotal': 'Order Total',
    'checkout.status': 'Status',
    'checkout.confirmed': 'Confirmed',
    'checkout.pendingVerification': 'Pending Verification',
    'checkout.continueShopping': 'Continue Shopping',
    'checkout.fillAllFields': 'Please fill all required fields',
    'checkout.fileTooLarge': 'File size should be less than 5MB',
    'checkout.invalidFile': 'Please select a valid image file',
    'checkout.orderConfirmed': 'Order confirmed! We will contact you soon.',
    'checkout.orderSubmitted': 'Order submitted! Awaiting payment verification.',
    'checkout.orderFailed': 'Failed to submit order. Please try again.',
    'checkout.fillVerificationFields': 'Please fill all verification fields',
    
    // Payment Methods
    'payment.upi': 'UPI Payment',
    'payment.upiDesc': 'Pay using UPI apps like PhonePe, GPay, Paytm',
    'payment.card': 'Credit/Debit Card',
    'payment.cardDesc': 'Pay using your credit or debit card',
    'payment.cod': 'Cash on Delivery',
    'payment.codDesc': 'Pay when your order is delivered',
    
    // Common Actions
    'common.back': 'Back',
    'common.next': 'Next',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.update': 'Update',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Schemes Page
    governmentSchemes: 'Government Schemes',
    schemesDescription: 'Explore available schemes and subsidies for farmers',
    searchSchemes: 'Search schemes...',
    allCategories: 'All Categories',
    manageSchemes: 'Manage Schemes',
    added: 'Added',
    viewDetails: 'View Details',
    noSchemesFound: 'No schemes found',
    adjustSearchCriteria: 'Try adjusting your search or filter criteria',
    noSchemesAvailable: 'No schemes are currently available',
    
    // Contacts Page
    agriculturalSpecialists: 'Agricultural Specialists',
    connectWithExperts: 'Connect with verified experts for agricultural guidance',
    searchSpecialists: 'Search specialists...',
    allRegions: 'All Regions',
    allSpecializations: 'All Specializations',
    specialistsFound: 'specialists found',
    manageContacts: 'Manage Contacts',
    region: 'Region',
    specializesIn: 'Specializes in',
    call: 'Call',
    noSpecialistsFound: 'No specialists found',
    noSpecialistsAvailable: 'No specialists are currently available',
    
    // Admin Material Requests
    materialRequests: 'Material Requests',
    totalRequests: 'total requests',
    farmer: 'Farmer',
    orderedItems: 'Ordered Items',
    contactInfo: 'Contact Information',
    paymentInfo: 'Payment Information',
    submittedAt: 'Submitted At',
    markCompleted: 'Mark as Completed',
    noOrdersFound: 'No material requests found',
    noOrdersDescription: 'Farmers haven\'t placed any material orders yet',
    orderStatusUpdated: 'Order status updated successfully',
    paymentSubmitted: 'Payment Submitted',
    verified: 'Verified',
    completed: 'Completed',
    analytics: 'Analytics',
    lowStock: 'Low Stock',
    deleteOrder: 'Delete Order',
    confirmDeleteOrder: 'Are you sure you want to delete this order? This action cannot be undone.',
    orderDeleted: 'Order deleted successfully',
    refresh: 'Refresh',
    
    // Enhanced Cart
    materialsCart: 'Materials Cart',
    itemsInCart: 'items in your cart',
    cartEmptyDesc: 'Add some materials to get started with your order',
    selectAll: 'Select All',
    removeSelected: 'Remove Selected',
    orderSummary: 'Order Summary',
    deliveryOptions: 'Delivery Options',
    standardDelivery: 'Standard Delivery',
    standardDeliveryDesc: '5-7 business days',
    expressDelivery: 'Express Delivery',
    expressDeliveryDesc: '2-3 business days',
    promoCode: 'Promo Code',
    enterPromoCode: 'Enter promo code',
    apply: 'Apply',
    discountApplied: 'Discount applied!',
    discount: 'Discount',
    selectedItemsRemoved: 'Selected items removed from cart',
    promoCodeApplied: 'Promo code applied!',
    invalidPromoCode: 'Invalid promo code',
    secureCheckout: 'Your payment information is secure and encrypted',
    free: 'Free'
  },
  
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    schemes: 'योजनाएं',
    contacts: 'संपर्क',
    treatments: 'उपचार',
    materials: 'सामग्री',
    support: 'सहायता',
    login: 'लॉगिन',
    register: 'पंजीकरण',
    logout: 'लॉगआउट',
    
    // Common
    welcome: 'स्वागत है',
    loading: 'लोड हो रहा है...',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    submit: 'जमा करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    add: 'जोड़ें',
    search: 'खोजें',
    filter: 'फिल्टर',
    
    // Materials
    orderMaterials: 'सामग्री ऑर्डर करें',
    materialName: 'सामग्री का नाम',
    quantity: 'मात्रा',
    price: 'कीमत',
    total: 'कुल',
    addToCart: 'कार्ट में जोड़ें',
    cart: 'कार्ट',
    checkout: 'चेकआउट',
    paymentDetails: 'भुगतान विवरण',
    transactionId: 'लेनदेन आईडी',
    customerName: 'ग्राहक का नाम',
    paymentScreenshot: 'भुगतान स्क्रीनशॉट',
    uploadScreenshot: 'भुगतान स्क्रीनशॉट अपलोड करें',
    orderPlaced: 'ऑर्डर सफलतापूर्वक दिया गया',
    pendingVerification: 'मैन्युअल सत्यापन लंबित',
    
    // Enhanced Materials System
    materialsManagement: 'सामग्री प्रबंधन',
    addMaterial: 'सामग्री जोड़ें',
    editMaterial: 'सामग्री संपादित करें',
    deleteMaterial: 'सामग्री हटाएं',
    materialDescription: 'सामग्री विवरण',
    materialCategory: 'श्रेणी',
    materialUnit: 'इकाई',
    materialStock: 'स्टॉक',
    availability: 'उपलब्धता',
    available: 'उपलब्ध',
    outOfStock: 'स्टॉक समाप्त',
    materialImage: 'सामग्री छवि',
    
    // Shopping Cart
    shoppingCart: 'शॉपिंग कार्ट',
    cartEmpty: 'आपका कार्ट खाली है',
    removeFromCart: 'कार्ट से हटाएं',
    updateQuantity: 'मात्रा अपडेट करें',
    cartTotal: 'कार्ट कुल',
    proceedToCheckout: 'चेकआउट पर जाएं',
    
    // Order Management
    orderHistory: 'ऑर्डर इतिहास',
    orderStatus: 'ऑर्डर स्थिति',
    orderDate: 'ऑर्डर दिनांक',
    orderNumber: 'ऑर्डर संख्या',
    orderItems: 'ऑर्डर आइटम',
    orderTotal: 'ऑर्डर कुल',
    trackOrder: 'ऑर्डर ट्रैक करें',
    cancelOrder: 'ऑर्डर रद्द करें',
    
    // Payment System
    paymentInstructions: 'भुगतान निर्देश',
    paymentMethod: 'भुगतान विधि',
    upiPayment: 'UPI भुगतान',
    qrCodePayment: 'QR कोड भुगतान',
    paymentAmount: 'भुगतान राशि',
    paymentStatus: 'भुगतान स्थिति',
    paymentVerification: 'भुगतान सत्यापन',
    paymentApproved: 'भुगतान स्वीकृत',
    paymentRejected: 'भुगतान अस्वीकृत',
    
    // Admin Panel
    adminDashboard: 'एडमिन डैशबोर्ड',
    pendingOrders: 'लंबित ऑर्डर',
    verifyPayment: 'भुगतान सत्यापित करें',
    approvePayment: 'भुगतान स्वीकृत करें',
    rejectPayment: 'भुगतान अस्वीकार करें',
    orderManagement: 'ऑर्डर प्रबंधन',
    
    // Status Messages
    orderConfirmed: 'ऑर्डर पुष्ट',
    orderProcessing: 'ऑर्डर प्रसंस्करण',
    orderShipped: 'ऑर्डर भेजा गया',
    orderDelivered: 'ऑर्डर वितरित',
    orderCancelled: 'ऑर्डर रद्द',
    
    // Product Catalog
    browseProducts: 'उत्पाद ब्राउज़ करें',
    farmingMaterials: 'कृषि सामग्री',
    addedToCart: 'कार्ट में जोड़ा गया',
    productCatalog: 'उत्पाद कैटलॉग',
    
    // Forms
    name: 'नाम',
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    phone: 'फोन नंबर',
    address: 'पता',
    
    // Messages
    somethingWentWrong: 'कुछ गलत हुआ',
    tryAgain: 'पुनः प्रयास करें',
    refreshPage: 'पेज रीफ्रेश करें',
    
    // Navigation Items
    upload: 'अपलोड',
    
    // Agricultural Store
    agriculturalStore: 'कृषि सामग्री स्टोर',
    storeDescription: 'कीटनाशक, उर्वरक और कृषि उपकरणों की पूरी श्रृंखला बाजार मूल्य के साथ',
    allProducts: 'सभी उत्पाद',
    pesticides: 'कीटनाशक',
    tools: 'कृषि उपकरण',
    priceRange: 'मूल्य सीमा',
    clearFilters: 'फिल्टर साफ़ करें',
    category: 'श्रेणी',
    type: 'प्रकार',
    brand: 'ब्रांड',
    stock: 'स्टॉक',
    
    // Cart specific
    subtotal: 'उप-योग',
    tax: 'कर',
    clearCart: 'कार्ट साफ़ करें',
    proceedToPayment: 'भुगतान पर जाएं',
    
    // Orders
    recentOrders: 'हाल के ऑर्डर',
    order: 'ऑर्डर',
    
    // Common UI Elements
    per: 'प्रति',
    inCart: 'कार्ट में',
    found: 'मिला',
    sortBy: 'इसके अनुसार क्रमबद्ध करें',
    sortName: 'नाम',
    sortPriceLow: 'कीमत: कम से अधिक',
    sortPriceHigh: 'कीमत: अधिक से कम',
    sortCategory: 'श्रेणी',
    sortStock: 'स्टॉक',
    
    // Additional UI Elements
    back: 'वापस',
    next: 'अगला',
    previous: 'पिछला',
    close: 'बंद करें',
    open: 'खोलें',
    view: 'देखें',
    details: 'विवरण',
    remove: 'हटाएं',
    update: 'अपडेट करें',
    confirm: 'पुष्टि करें',
    yes: 'हां',
    no: 'नहीं',
    
    // Checkout Process
    'checkout.paymentMethod': 'भुगतान विधि',
    'checkout.orderSummary': 'ऑर्डर सारांश',
    'checkout.subtotal': 'उप-योग',
    'checkout.tax': 'कर (5%)',
    'checkout.shipping': 'शिपिंग',
    'checkout.free': 'मुफ्त',
    'checkout.total': 'कुल',
    'checkout.shippingAddress': 'शिपिंग पता',
    'checkout.fullName': 'पूरा नाम',
    'checkout.phone': 'फोन नंबर',
    'checkout.address': 'पता',
    'checkout.city': 'शहर',
    'checkout.state': 'राज्य',
    'checkout.pincode': 'पिनकोड',
    'checkout.selectPaymentMethod': 'भुगतान विधि चुनें',
    'checkout.placeOrder': 'ऑर्डर दें',
    'checkout.proceedToPayment': 'भुगतान पर जाएं',
    'checkout.paymentVerification': 'भुगतान सत्यापन',
    'checkout.scanQR': 'भुगतान के लिए QR कोड स्कैन करें',
    'checkout.amount': 'राशि',
    'checkout.cardPayment': 'कार्ड भुगतान',
    'checkout.cardInstructions': 'कृपया अपनी पसंदीदा कार्ड भुगतान विधि का उपयोग करके भुगतान करें और नीचे लेनदेन स्क्रीनशॉट अपलोड करें।',
    'checkout.verificationDetails': 'सत्यापन विवरण',
    'checkout.farmerName': 'किसान का नाम',
    'checkout.transactionId': 'लेनदेन आईडी',
    'checkout.enterTransactionId': 'UPI/कार्ड लेनदेन आईडी दर्ज करें',
    'checkout.paymentScreenshot': 'भुगतान स्क्रीनशॉट',
    'checkout.uploadScreenshot': 'भुगतान स्क्रीनशॉट अपलोड करने के लिए क्लिक करें',
    'checkout.note': 'नोट',
    'checkout.verificationNote': 'सबमिट करने के बाद, हमारी टीम 24 घंटों के भीतर आपके भुगतान को मैन्युअल रूप से सत्यापित करेगी।',
    'checkout.submitting': 'सबमिट कर रहे हैं...',
    'checkout.submitOrder': 'ऑर्डर सबमिट करें',
    'checkout.orderSuccess': 'ऑर्डर सफलतापूर्वक सबमिट किया गया!',
    'checkout.codConfirmation': 'आपका ऑर्डर पुष्ट हो गया है। हम जल्द ही डिलीवरी के लिए आपसे संपर्क करेंगे।',
    'checkout.paymentConfirmation': 'आपका भुगतान सत्यापन सबमिट कर दिया गया है। हम 24 घंटों के भीतर आपके ऑर्डर को सत्यापित और प्रोसेस करेंगे।',
    'checkout.orderDetails': 'ऑर्डर विवरण',
    'checkout.orderTotal': 'ऑर्डर कुल',
    'checkout.status': 'स्थिति',
    'checkout.confirmed': 'पुष्ट',
    'checkout.pendingVerification': 'सत्यापन लंबित',
    'checkout.continueShopping': 'खरीदारी जारी रखें',
    'checkout.fillAllFields': 'कृपया सभी आवश्यक फ़ील्ड भरें',
    'checkout.fileTooLarge': 'फ़ाइल का आकार 5MB से कम होना चाहिए',
    'checkout.invalidFile': 'कृपया एक वैध छवि फ़ाइल चुनें',
    'checkout.orderConfirmed': 'ऑर्डर पुष्ट! हम जल्द ही आपसे संपर्क करेंगे।',
    'checkout.orderSubmitted': 'ऑर्डर सबमिट किया गया! भुगतान सत्यापन की प्रतीक्षा में।',
    'checkout.orderFailed': 'ऑर्डर सबमिट करने में विफल। कृपया पुनः प्रयास करें।',
    'checkout.fillVerificationFields': 'कृपया सभी सत्यापन फ़ील्ड भरें',
    
    // Payment Methods
    'payment.upi': 'UPI भुगतान',
    'payment.upiDesc': 'PhonePe, GPay, Paytm जैसे UPI ऐप्स का उपयोग करके भुगतान करें',
    'payment.card': 'क्रेडिट/डेबिट कार्ड',
    'payment.cardDesc': 'अपने क्रेडिट या डेबिट कार्ड का उपयोग करके भुगतान करें',
    'payment.cod': 'कैश ऑन डिलीवरी',
    'payment.codDesc': 'जब आपका ऑर्डर डिलीवर हो तो भुगतान करें',
    
    // Common Actions
    'common.back': 'वापस',
    'common.next': 'अगला',
    'common.close': 'बंद करें',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.add': 'जोड़ें',
    'common.update': 'अपडेट करें',
    'common.confirm': 'पुष्टि करें',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    
    // Schemes Page
    governmentSchemes: 'सरकारी योजनाएं',
    schemesDescription: 'किसानों के लिए उपलब्ध योजनाओं और सब्सिडी का अन्वेषण करें',
    searchSchemes: 'योजनाएं खोजें...',
    allCategories: 'सभी श्रेणियां',
    manageSchemes: 'योजनाओं का प्रबंधन',
    added: 'जोड़ा गया',
    viewDetails: 'विवरण देखें',
    noSchemesFound: 'कोई योजना नहीं मिली',
    adjustSearchCriteria: 'अपने खोज या फिल्टर मानदंड को समायोजित करने का प्रयास करें',
    noSchemesAvailable: 'वर्तमान में कोई योजना उपलब्ध नहीं है',
    
    // Contacts Page
    agriculturalSpecialists: 'कृषि विशेषज्ञ',
    connectWithExperts: 'कृषि मार्गदर्शन के लिए सत्यापित विशेषज्ञों से जुड़ें',
    searchSpecialists: 'विशेषज्ञ खोजें...',
    allRegions: 'सभी क्षेत्र',
    allSpecializations: 'सभी विशेषज्ञताएं',
    specialistsFound: 'विशेषज्ञ मिले',
    manageContacts: 'संपर्कों का प्रबंधन',
    region: 'क्षेत्र',
    specializesIn: 'में विशेषज्ञता',
    call: 'कॉल करें',
    noSpecialistsFound: 'कोई विशेषज्ञ नहीं मिले',
    noSpecialistsAvailable: 'वर्तमान में कोई विशेषज्ञ उपलब्ध नहीं हैं',
    
    // Admin Material Requests
    materialRequests: 'सामग्री अनुरोध',
    totalRequests: 'कुल अनुरोध',
    farmer: 'किसान',
    orderedItems: 'ऑर्डर की गई वस्तुएं',
    contactInfo: 'संपर्क जानकारी',
    paymentInfo: 'भुगतान जानकारी',
    submittedAt: 'सबमिट किया गया',
    markCompleted: 'पूर्ण के रूप में चिह्नित करें',
    noOrdersFound: 'कोई सामग्री अनुरोध नहीं मिला',
    noOrdersDescription: 'किसानों ने अभी तक कोई सामग्री ऑर्डर नहीं दिया है',
    orderStatusUpdated: 'ऑर्डर स्थिति सफलतापूर्वक अपडेट की गई',
    paymentSubmitted: 'भुगतान सबमिट किया गया',
    verified: 'सत्यापित',
    completed: 'पूर्ण',
    analytics: 'विश्लेषण',
    lowStock: 'कम स्टॉक',
    deleteOrder: 'ऑर्डर हटाएं',
    confirmDeleteOrder: 'क्या आप वाकई इस ऑर्डर को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।',
    orderDeleted: 'ऑर्डर सफलतापूर्वक हटा दिया गया',
    refresh: 'रीफ्रेश करें',
    
    // Enhanced Cart
    materialsCart: 'सामग्री कार्ट',
    itemsInCart: 'आपके कार्ट में आइटम',
    cartEmptyDesc: 'अपने ऑर्डर की शुरुआत करने के लिए कुछ सामग्री जोड़ें',
    selectAll: 'सभी चुनें',
    removeSelected: 'चयनित हटाएं',
    orderSummary: 'ऑर्डर सारांश',
    deliveryOptions: 'डिलीवरी विकल्प',
    standardDelivery: 'मानक डिलीवरी',
    standardDeliveryDesc: '5-7 कार्यदिवस',
    expressDelivery: 'एक्सप्रेस डिलीवरी',
    expressDeliveryDesc: '2-3 कार्यदिवस',
    promoCode: 'प्रोमो कोड',
    enterPromoCode: 'प्रोमो कोड दर्ज करें',
    apply: 'लागू करें',
    discountApplied: 'छूट लागू की गई!',
    discount: 'छूट',
    selectedItemsRemoved: 'चयनित आइटम कार्ट से हटा दिए गए',
    promoCodeApplied: 'प्रोमो कोड लागू किया गया!',
    invalidPromoCode: 'अमान्य प्रोमो कोड',
    secureCheckout: 'आपकी भुगतान जानकारी सुरक्षित और एन्क्रिप्टेड है',
    free: 'मुफ्त'
  },
  
  mr: {
    // Navigation
    dashboard: 'डॅशबोर्ड',
    schemes: 'योजना',
    contacts: 'संपर्क',
    treatments: 'उपचार',
    materials: 'साहित्य',
    support: 'सहाय्य',
    login: 'लॉगिन',
    register: 'नोंदणी',
    logout: 'लॉगआउट',
    
    // Common
    welcome: 'स्वागत आहे',
    loading: 'लोड होत आहे...',
    save: 'सेव्ह करा',
    cancel: 'रद्द करा',
    submit: 'सबमिट करा',
    delete: 'हटवा',
    edit: 'संपादित करा',
    add: 'जोडा',
    search: 'शोधा',
    filter: 'फिल्टर',
    
    // Materials
    orderMaterials: 'साहित्य ऑर्डर करा',
    materialName: 'साहित्याचे नाव',
    quantity: 'प्रमाण',
    price: 'किंमत',
    total: 'एकूण',
    addToCart: 'कार्टमध्ये जोडा',
    cart: 'कार्ट',
    checkout: 'चेकआउट',
    paymentDetails: 'पेमेंट तपशील',
    transactionId: 'व्यवहार आयडी',
    customerName: 'ग्राहकाचे नाव',
    paymentScreenshot: 'पेमेंट स्क्रीनशॉट',
    uploadScreenshot: 'पेमेंट स्क्रीनशॉट अपलोड करा',
    orderPlaced: 'ऑर्डर यशस्वीरित्या दिली',
    pendingVerification: 'मॅन्युअल पडताळणी प्रलंबित',
    
    // Enhanced Materials System
    materialsManagement: 'साहित्य व्यवस्थापन',
    addMaterial: 'साहित्य जोडा',
    editMaterial: 'साहित्य संपादित करा',
    deleteMaterial: 'साहित्य हटवा',
    materialDescription: 'साहित्य वर्णन',
    materialCategory: 'श्रेणी',
    materialUnit: 'एकक',
    materialStock: 'स्टॉक',
    availability: 'उपलब्धता',
    available: 'उपलब्ध',
    outOfStock: 'स्टॉक संपला',
    materialImage: 'साहित्य प्रतिमा',
    
    // Shopping Cart
    shoppingCart: 'शॉपिंग कार्ट',
    cartEmpty: 'तुमचा कार्ट रिकामा आहे',
    removeFromCart: 'कार्टमधून काढा',
    updateQuantity: 'प्रमाण अपडेट करा',
    cartTotal: 'कार्ट एकूण',
    proceedToCheckout: 'चेकआउटला जा',
    
    // Order Management
    orderHistory: 'ऑर्डर इतिहास',
    orderStatus: 'ऑर्डर स्थिती',
    orderDate: 'ऑर्डर दिनांक',
    orderNumber: 'ऑर्डर क्रमांक',
    orderItems: 'ऑर्डर वस्तू',
    orderTotal: 'ऑर्डर एकूण',
    trackOrder: 'ऑर्डर ट्रॅक करा',
    cancelOrder: 'ऑर्डर रद्द करा',
    
    // Payment System
    paymentInstructions: 'पेमेंट सूचना',
    paymentMethod: 'पेमेंट पद्धत',
    upiPayment: 'UPI पेमेंट',
    qrCodePayment: 'QR कोड पेमेंट',
    paymentAmount: 'पेमेंट रक्कम',
    paymentStatus: 'पेमेंट स्थिती',
    paymentVerification: 'पेमेंट पडताळणी',
    paymentApproved: 'पेमेंट मंजूर',
    paymentRejected: 'पेमेंट नाकारले',
    
    // Admin Panel
    adminDashboard: 'अॅडमिन डॅशबोर्ड',
    pendingOrders: 'प्रलंबित ऑर्डर',
    verifyPayment: 'पेमेंट पडताळा',
    approvePayment: 'पेमेंट मंजूर करा',
    rejectPayment: 'पेमेंट नाकारा',
    orderManagement: 'ऑर्डर व्यवस्थापन',
    
    // Status Messages
    orderConfirmed: 'ऑर्डर पुष्ट',
    orderProcessing: 'ऑर्डर प्रक्रिया',
    orderShipped: 'ऑर्डर पाठवली',
    orderDelivered: 'ऑर्डर वितरित',
    orderCancelled: 'ऑर्डर रद्द',
    
    // Product Catalog
    browseProducts: 'उत्पादने ब्राउझ करा',
    farmingMaterials: 'शेती साहित्य',
    addedToCart: 'कार्टमध्ये जोडले',
    productCatalog: 'उत्पादन कॅटलॉग',
    
    // Forms
    name: 'नाव',
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्डची पुष्टी करा',
    phone: 'फोन नंबर',
    address: 'पत्ता',
    
    // Messages
    somethingWentWrong: 'काहीतरी चूक झाली',
    tryAgain: 'पुन्हा प्रयत्न करा',
    refreshPage: 'पेज रीफ्रेश करा',
    
    // Navigation Items
    upload: 'अपलोड',
    
    // Agricultural Store
    agriculturalStore: 'कृषी साहित्य स्टोअर',
    storeDescription: 'बाजार किंमतीसह कीटकनाशके, खते आणि कृषी साधनांची संपूर्ण श्रेणी',
    allProducts: 'सर्व उत्पादने',
    pesticides: 'कीटकनाशके',
    tools: 'कृषी साधने',
    priceRange: 'किंमत श्रेणी',
    clearFilters: 'फिल्टर साफ करा',
    category: 'श्रेणी',
    type: 'प्रकार',
    brand: 'ब्रँड',
    stock: 'स्टॉक',
    
    // Cart specific
    subtotal: 'उप-एकूण',
    tax: 'कर',
    clearCart: 'कार्ट साफ करा',
    proceedToPayment: 'पेमेंटकडे जा',
    
    // Orders
    recentOrders: 'अलीकडील ऑर्डर',
    order: 'ऑर्डर',
    
    // Common UI Elements
    per: 'प्रति',
    inCart: 'कार्टमध्ये',
    found: 'सापडले',
    sortBy: 'यानुसार क्रमवारी लावा',
    sortName: 'नाव',
    sortPriceLow: 'किंमत: कमी ते जास्त',
    sortPriceHigh: 'किंमत: जास्त ते कमी',
    sortCategory: 'श्रेणी',
    sortStock: 'स्टॉक',
    
    // Additional UI Elements
    back: 'मागे',
    next: 'पुढे',
    previous: 'मागील',
    close: 'बंद करा',
    open: 'उघडा',
    view: 'पहा',
    details: 'तपशील',
    remove: 'काढा',
    update: 'अपडेट करा',
    confirm: 'पुष्टी करा',
    yes: 'होय',
    no: 'नाही',
    
    // Checkout Process
    'checkout.paymentMethod': 'पेमेंट पद्धत',
    'checkout.orderSummary': 'ऑर्डर सारांश',
    'checkout.subtotal': 'उप-एकूण',
    'checkout.tax': 'कर (5%)',
    'checkout.shipping': 'शिपिंग',
    'checkout.free': 'मोफत',
    'checkout.total': 'एकूण',
    'checkout.shippingAddress': 'शिपिंग पत्ता',
    'checkout.fullName': 'पूर्ण नाव',
    'checkout.phone': 'फोन नंबर',
    'checkout.address': 'पत्ता',
    'checkout.city': 'शहर',
    'checkout.state': 'राज्य',
    'checkout.pincode': 'पिनकोड',
    'checkout.selectPaymentMethod': 'पेमेंट पद्धत निवडा',
    'checkout.placeOrder': 'ऑर्डर द्या',
    'checkout.proceedToPayment': 'पेमेंटकडे जा',
    'checkout.paymentVerification': 'पेमेंट पडताळणी',
    'checkout.scanQR': 'पेमेंटसाठी QR कोड स्कॅन करा',
    'checkout.amount': 'रक्कम',
    'checkout.cardPayment': 'कार्ड पेमेंट',
    'checkout.cardInstructions': 'कृपया तुमच्या पसंतीच्या कार्ड पेमेंट पद्धतीचा वापर करून पेमेंट करा आणि खाली व्यवहार स्क्रीनशॉट अपलोड करा.',
    'checkout.verificationDetails': 'पडताळणी तपशील',
    'checkout.farmerName': 'शेतकऱ्याचे नाव',
    'checkout.transactionId': 'व्यवहार आयडी',
    'checkout.enterTransactionId': 'UPI/कार्ड व्यवहार आयडी टाका',
    'checkout.paymentScreenshot': 'पेमेंट स्क्रीनशॉट',
    'checkout.uploadScreenshot': 'पेमेंट स्क्रीनशॉट अपलोड करण्यासाठी क्लिक करा',
    'checkout.note': 'टीप',
    'checkout.verificationNote': 'सबमिट केल्यानंतर, आमची टीम 24 तासांच्या आत तुमच्या पेमेंटची मॅन्युअल पडताळणी करेल.',
    'checkout.submitting': 'सबमिट करत आहे...',
    'checkout.submitOrder': 'ऑर्डर सबमिट करा',
    'checkout.orderSuccess': 'ऑर्डर यशस्वीरित्या सबमिट केला!',
    'checkout.codConfirmation': 'तुमचा ऑर्डर पुष्ट झाला आहे. आम्ही लवकरच डिलिव्हरीसाठी तुमच्याशी संपर्क साधू.',
    'checkout.paymentConfirmation': 'तुमची पेमेंट पडताळणी सबमिट केली आहे. आम्ही 24 तासांच्या आत तुमचा ऑर्डर पडताळून प्रोसेस करू.',
    'checkout.orderDetails': 'ऑर्डर तपशील',
    'checkout.orderTotal': 'ऑर्डर एकूण',
    'checkout.status': 'स्थिती',
    'checkout.confirmed': 'पुष्ट',
    'checkout.pendingVerification': 'पडताळणी प्रलंबित',
    'checkout.continueShopping': 'खरेदी सुरू ठेवा',
    'checkout.fillAllFields': 'कृपया सर्व आवश्यक फील्ड भरा',
    'checkout.fileTooLarge': 'फाइलचा आकार 5MB पेक्षा कमी असावा',
    'checkout.invalidFile': 'कृपया वैध इमेज फाइल निवडा',
    'checkout.orderConfirmed': 'ऑर्डर पुष्ट! आम्ही लवकरच तुमच्याशी संपर्क साधू.',
    'checkout.orderSubmitted': 'ऑर्डर सबमिट केला! पेमेंट पडताळणीची प्रतीक्षा.',
    'checkout.orderFailed': 'ऑर्डर सबमिट करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
    'checkout.fillVerificationFields': 'कृपया सर्व पडताळणी फील्ड भरा',
    
    // Payment Methods
    'payment.upi': 'UPI पेमेंट',
    'payment.upiDesc': 'PhonePe, GPay, Paytm सारख्या UPI अॅप्स वापरून पेमेंट करा',
    'payment.card': 'क्रेडिट/डेबिट कार्ड',
    'payment.cardDesc': 'तुमच्या क्रेडिट किंवा डेबिट कार्डचा वापर करून पेमेंट करा',
    'payment.cod': 'कॅश ऑन डिलिव्हरी',
    'payment.codDesc': 'तुमचा ऑर्डर डिलिव्हर झाल्यावर पेमेंट करा',
    
    // Common Actions
    'common.back': 'मागे',
    'common.next': 'पुढे',
    'common.close': 'बंद करा',
    'common.save': 'सेव्ह करा',
    'common.cancel': 'रद्द करा',
    'common.delete': 'हटवा',
    'common.edit': 'संपादित करा',
    'common.add': 'जोडा',
    'common.update': 'अपडेट करा',
    'common.confirm': 'पुष्टी करा',
    'common.loading': 'लोड होत आहे...',
    'common.error': 'त्रुटी',
    'common.success': 'यश',
    
    // Schemes Page
    governmentSchemes: 'सरकारी योजना',
    schemesDescription: 'शेतकऱ्यांसाठी उपलब्ध योजना आणि अनुदानाचा शोध घ्या',
    searchSchemes: 'योजना शोधा...',
    allCategories: 'सर्व श्रेणी',
    manageSchemes: 'योजना व्यवस्थापन',
    added: 'जोडले',
    viewDetails: 'तपशील पहा',
    noSchemesFound: 'कोणतीही योजना सापडली नाही',
    adjustSearchCriteria: 'तुमचे शोध किंवा फिल्टर निकष समायोजित करण्याचा प्रयत्न करा',
    noSchemesAvailable: 'सध्या कोणतीही योजना उपलब्ध नाही',
    
    // Contacts Page
    agriculturalSpecialists: 'कृषी तज्ञ',
    connectWithExperts: 'कृषी मार्गदर्शनासाठी सत्यापित तज्ञांशी संपर्क साधा',
    searchSpecialists: 'तज्ञ शोधा...',
    allRegions: 'सर्व प्रदेश',
    allSpecializations: 'सर्व विशेषज्ञता',
    specialistsFound: 'तज्ञ सापडले',
    manageContacts: 'संपर्क व्यवस्थापन',
    region: 'प्रदेश',
    specializesIn: 'मध्ये तज्ञता',
    call: 'कॉल करा',
    noSpecialistsFound: 'कोणतेही तज्ञ सापडले नाहीत',
    noSpecialistsAvailable: 'सध्या कोणतेही तज्ञ उपलब्ध नाहीत',
    
    // Admin Material Requests
    materialRequests: 'साहित्य विनंत्या',
    totalRequests: 'एकूण विनंत्या',
    farmer: 'शेतकरी',
    orderedItems: 'ऑर्डर केलेल्या वस्तू',
    contactInfo: 'संपर्क माहिती',
    paymentInfo: 'पेमेंट माहिती',
    submittedAt: 'सबमिट केले',
    markCompleted: 'पूर्ण म्हणून चिन्हांकित करा',
    noOrdersFound: 'कोणत्याही साहित्य विनंत्या सापडल्या नाहीत',
    noOrdersDescription: 'शेतकऱ्यांनी अद्याप कोणतेही साहित्य ऑर्डर दिले नाहीत',
    orderStatusUpdated: 'ऑर्डर स्थिती यशस्वीरित्या अपडेट केली',
    paymentSubmitted: 'पेमेंट सबमिट केले',
    verified: 'पडताळले',
    completed: 'पूर्ण',
    analytics: 'विश्लेषण',
    lowStock: 'कमी स्टॉक',
    deleteOrder: 'ऑर्डर हटवा',
    confirmDeleteOrder: 'तुम्हाला खरोखर हा ऑर्डर हटवायचा आहे का? ही क्रिया पूर्ववत केली जाऊ शकत नाही.',
    orderDeleted: 'ऑर्डर यशस्वीरित्या हटवला',
    refresh: 'रीफ्रेश करा',
    
    // Enhanced Cart
    materialsCart: 'साहित्य कार्ट',
    itemsInCart: 'तुमच्या कार्टमधील वस्तू',
    cartEmptyDesc: 'तुमच्या ऑर्डरची सुरुवात करण्यासाठी काही साहित्य जोडा',
    selectAll: 'सर्व निवडा',
    removeSelected: 'निवडलेले काढा',
    orderSummary: 'ऑर्डर सारांश',
    deliveryOptions: 'डिलिव्हरी पर्याय',
    standardDelivery: 'मानक डिलिव्हरी',
    standardDeliveryDesc: '5-7 कामकाजाचे दिवस',
    expressDelivery: 'एक्सप्रेस डिलिव्हरी',
    expressDeliveryDesc: '2-3 कामकाजाचे दिवस',
    promoCode: 'प्रोमो कोड',
    enterPromoCode: 'प्रोमो कोड टाका',
    apply: 'लागू करा',
    discountApplied: 'सूट लागू केली!',
    discount: 'सूट',
    selectedItemsRemoved: 'निवडलेल्या वस्तू कार्टमधून काढल्या',
    promoCodeApplied: 'प्रोमो कोड लागू केला!',
    invalidPromoCode: 'अवैध प्रोमो कोड',
    secureCheckout: 'तुमची पेमेंट माहिती सुरक्षित आणि एन्क्रिप्टेड आहे',
    free: 'मोफत'
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('farmtech-language');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (language) => {
    if (translations[language]) {
      setCurrentLanguage(language);
      localStorage.setItem('farmtech-language', language);
    }
  };

  const t = (key) => {
    return translations[currentLanguage][key] || translations.en[key] || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages: [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'हिंदी' },
      { code: 'mr', name: 'मराठी' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};