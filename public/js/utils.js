/**
 * Shared Utilities & Helpers
 */

// ============================================
// Firebase Initialization
// ============================================
let db, storage, auth;

async function initializeFirebase() {
  try {
    // Import Firebase modules from CDN (loaded in HTML)
    if (typeof firebase === 'undefined') {
      console.error("Firebase SDK not loaded. Ensure script tags in HTML are correct.");
      return;
    }

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
    auth = firebase.auth();

    console.log("✅ Firebase initialized successfully");
    return { db, storage, auth };
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
  }
}

// ============================================
// Language Strings (Multi-language Support)
// ============================================
const STRINGS = {
  en: {
    home: "Home",
    products: "Products",
    contact: "Contact",
    admin: "Admin",
    aboutUs: "About Us",
    viewProducts: "View Products",
    contactViaWhatsApp: "Contact via WhatsApp",
    todaysOffers: "Today's Offers",
    discount: "Discount",
    validUntil: "Valid Until",
    seeMore: "See More",
    allProducts: "All Products",
    search: "Search products...",
    category: "Category",
    price: "Price",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    contactForPrice: "Contact for Price",
    description: "Description",
    sendInquiry: "Send Inquiry via WhatsApp",
    askForProduct: "Ask for Product",
    yourName: "Your Name",
    yourPhone: "Your Phone Number",
    message: "Message",
    submit: "Submit",
    callUs: "Call Us",
    visitUs: "Visit Us",
    openingHours: "Opening Hours",
    shopLocation: "Shop Location",
    helloInterested: "Hello, I am interested in",
    notification: "Notification",
    success: "Success",
    error: "Error",
    loading: "Loading...",
    noResults: "No results found",
    relatedProducts: "Related Products",
    inquirySubmitted: "Thank you! Your inquiry has been submitted.",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    deleteProduct: "Delete Product",
    uploadImage: "Upload Image",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    logout: "Logout",
    login: "Login",
    adminPanel: "Admin Panel",
    email: "Email",
    password: "Password",
    manageProducts: "Manage Products",
    viewInquiries: "View Inquiries",
    manageOffers: "Manage Offers"
  },
  ml: {
    home: "വീട്",
    products: "ഉൽപ്പന്നങ്ങൾ",
    contact: "ബന്ധപ്പെടുക",
    admin: "അഡ്മിൻ",
    aboutUs: "ഞങ്ങളെക്കുറിച്ച്",
    viewProducts: "ഉൽപ്പന്നങ്ങൾ കാണുക",
    contactViaWhatsApp: "WhatsApp വഴി ബന്ധപ്പെടുക",
    todaysOffers: "ഇന്നത്തെ ഓഫറുകൾ",
    discount: "കിഴ്ച്",
    validUntil: "ശരിയായത് വരെ",
    seeMore: "കൂടുതൽ കാണുക",
    allProducts: "എല്ലാ ഉൽപ്പന്നങ്ങൾ",
    search: "ഉൽപ്പന്നങ്ങൾ തിരയുക...",
    category: "വിഭാഗം",
    price: "വില",
    inStock: "സ്റ്റോക്കിൽ ഉണ്ട്",
    outOfStock: "സ്റ്റോക്കിൽ ഇല്ല",
    contactForPrice: "വിലയ്ക്കായി ബന്ധപ്പെടുക",
    description: "വിവരണം",
    sendInquiry: "WhatsApp വഴി അയ്യാചനം അയക്കുക",
    askForProduct: "ഉൽപ്പന്നത്തിനായി ആവശ്യപ്പെടുക",
    yourName: "നിങ്ങളുടെ പേര്",
    yourPhone: "നിങ്ങളുടെ ഫോൺ നമ്പർ",
    message: "സന്ദേശം",
    submit: "സമർപ്പിക്കുക",
    callUs: "ഞങ്ങളെ വിളിക്കുക",
    visitUs: "ഞങ്ങളെ സന്ദർശിക്കുക",
    openingHours: "തുറക്കുന്ന സമയം",
    shopLocation: "കടയിലെ സ്ഥാനം",
    helloInterested: "ഹലോ, ഞാൻ താൽപ്പര്യമുണ്ട്",
    notification: "അറിയിപ്പ്",
    success: "വിജയം",
    error: "പിശക്",
    loading: "ലോഡ് ചെയ്യുന്നു...",
    noResults: "ഫലങ്ങൾ കണ്ടെത്തിയില്ല",
    relatedProducts: "ബന്ധപ്പെട്ട ഉൽപ്പന്നങ്ങൾ",
    inquirySubmitted: "നന്ദി! നിങ്ങളുടെ അയ്യാചനം സമർപ്പിച്ചു.",
    addProduct: "ഉൽപ്പന്നം ചേർക്കുക",
    editProduct: "ഉൽപ്പന്നം എഡിറ്റ് ചെയ്യുക",
    deleteProduct: "ഉൽപ്പന്നം ഇല്ലാതാക്കുക",
    uploadImage: "ഇമേജ് അപ്‌ലോഡ് ചെയ്യുക",
    save: "സംരക്ഷിക്കുക",
    cancel: "റദ്ദാക്കുക",
    delete: "ഇല്ലാതാക്കുക",
    edit: "എഡിറ്റ്",
    logout: "ലോഗ് ഔട്ട്",
    login: "ലോഗിൻ ചെയ്യുക",
    adminPanel: "അഡ്മിൻ പാനൽ",
    email: "ഇമെയിൽ",
    password: "രഹസ്യവാക്കുകൾ",
    manageProducts: "ഉൽപ്പന്നങ്ങൾ കൈകാര്യം ചെയ്യുക",
    viewInquiries: "അയ്യാചനങ്ങൾ കാണുക",
    manageOffers: "ഓഫറുകൾ കൈകാര്യം ചെയ്യുക"
  }
};

// Current language (default: English)
let currentLanguage = localStorage.getItem("language") || "en";

function t(key) {
  return STRINGS[currentLanguage]?.[key] || STRINGS["en"]?.[key] || key;
}

function setLanguage(lang) {
  if (["en", "ml"].includes(lang)) {
    currentLanguage = lang;
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    location.reload(); // Reload to apply language changes
  }
}

// ============================================
// WhatsApp Integration
// ============================================
function getWhatsAppLink(phoneNumber, message) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodedMessage}`;
}

function openWhatsApp(phoneNumber, productName = null, customMessage = null) {
  let message = customMessage || "";
  if (productName && !customMessage) {
    message = `${t("helloInterested")} ${productName}`;
  }
  const link = getWhatsAppLink(phoneNumber, message);
  window.open(link, "_blank");
}

// ============================================
// Utility Functions
// ============================================
function formatCurrency(price) {
  if (!price) return t("contactForPrice");
  return `₹${parseFloat(price).toFixed(2)}`;
}

function getImageUrl(path) {
  if (!path) return "https://via.placeholder.com/300?text=No+Image";
  if (path.startsWith("http")) return path;
  return `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === "success" ? "#4CAF50" : "#f44336"};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 90%;
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function showLoader() {
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  loader.innerHTML = `<div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>`;
  document.body.appendChild(loader);
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.remove();
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString(currentLanguage === "ml" ? "ml-IN" : "en-US");
}

// ============================================
// DOM Utilities
// ============================================
function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function on(element, event, callback) {
  if (typeof element === "string") element = $(element);
  if (element) element.addEventListener(event, callback);
}

function off(element, event, callback) {
  if (typeof element === "string") element = $(element);
  if (element) element.removeEventListener(event, callback);
}

// ============================================
// LocalStorage Helpers
// ============================================
function setCache(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCache(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

function removeCache(key) {
  localStorage.removeItem(key);
}

// ============================================
// Validation
// ============================================
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^\d{10}$/.test(phone.replace(/[^0-9]/g, ""));
}

// Initialize language on page load
window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.lang = currentLanguage;
});
