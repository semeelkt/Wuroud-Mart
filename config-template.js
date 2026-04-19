/**
 * Firebase Configuration Template
 *
 * IMPORTANT: Replace these values with your own Firebase project credentials
 *
 * Steps:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing
 * 3. Go to Project Settings → Your apps → Web
 * 4. Copy the firebaseConfig object
 * 5. Replace the values below
 * 6. Set this file to private (don't commit with real credentials)
 */

// ============================================
// STEP 1: Update with your Firebase Config
// ============================================
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

// ============================================
// STEP 2: Customize Your Shop Details
// ============================================
const SHOP_CONFIG = {
  // Basic Information
  name: "Wuroud Mart",
  tagline: "Premium Products Delivered",
  description: "Your trusted local shop for quality products",

  // Contact Information
  phone: "+1234567890",
  whatsAppNumber: "+1234567890",

  // Location (Google Maps)
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=YOUR_EMBED_URL",

  // Opening Hours
  openingHours: {
    monday: "09:00 - 22:00",
    tuesday: "09:00 - 22:00",
    wednesday: "09:00 - 22:00",
    thursday: "09:00 - 22:00",
    friday: "09:00 - 22:00",
    saturday: "10:00 - 23:00",
    sunday: "10:00 - 21:00"
  }
};

// ============================================
// STEP 3: Add Your Product Categories
// ============================================
const PRODUCT_CATEGORIES = [
  "All",
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Beauty & Personal Care",
  "Food & Beverages",
  "Books & Media",
  "Sports & Outdoors"
  // Add your own categories here
];

// ============================================
// Firestore Collection Names (Don't Change)
// ============================================
const COLLECTIONS = {
  products: "products",
  inquiries: "inquiries",
  offers: "offers"
};

/**
 * TROUBLESHOOTING:
 *
 * 1. Firebase not connecting?
 *    - Verify apiKey and projectId are correct
 *    - Check Firebase console for any errors
 *    - Ensure all required services are enabled
 *
 * 2. Images not uploading?
 *    - Check storageBucket is correct
 *    - Enable Firebase Storage in your project
 *
 * 3. Getting authentication errors?
 *    - Verify users exist in Firebase Authentication
 *    - Check Firestore Security Rules
 *
 * For detailed setup instructions, see README.md
 */
