# 🛍️ Wuroud Mart - Premium Digital Catalog

A modern, responsive digital product catalog website for local shops. Display products, manage inquiries, and connect customers via WhatsApp or phone—all without e-commerce complexity.

## ✨ Features

✅ **Product Display**
- Responsive grid layout (mobile-first design)
- Product search and filtering by category
- Stock status tracking
- Dynamic pricing display

✅ **Customer Engagement**
- WhatsApp integration with pre-filled messages
- One-click phone calling
- Product inquiry forms
- "Ask for Product" feature

✅ **Admin Panel**
- Secure Firebase authentication
- Product management (add, edit, delete)
- Image uploads to Firebase Storage
- Offer management
- Inquiry viewer and tracking
- Settings management

✅ **Extra Features**
- Multi-language support (English + Malayalam)
- Today's offers section
- Featured products
- PWA support (installable app)
- Google Maps integration
- Lazy loading images
- Modern UI with premium design

## 🚀 Quick Start

### Prerequisites
- A Firebase project (free tier works!)
- A modern web browser
- A code editor (VS Code recommended)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable these services:
   - **Firestore Database** (Create in production mode)
   - **Firebase Storage** (for product images)
   - **Firebase Authentication** (Email/Password)

4. Get your Firebase config:
   - In Project Settings → Your apps → Web
   - Copy the configuration object

5. Create an admin user:
   - Go to Authentication → Users tab
   - Click "Add user"
   - Add your admin email and password

### 2. Configure the App

1. Edit `public/js/config.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };

   const SHOP_CONFIG = {
     name: "Your Shop Name",
     phone: "+1234567890",
     whatsAppNumber: "+1234567890",
     // ... other config
   };
   ```

2. Update shop details (phone, WhatsApp, location, etc.)

### 3. Run Locally

**Option A: Python (Recommended)**
```bash
cd public
python -m http.server 8000
```
Then open `http://localhost:8000`

**Option B: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

**Option C: Node.js**
```bash
npx http-server public
```

### 4. Firebase Setup (Database Structure)

Create these Firestore collections manually:

#### `products` collection
```javascript
{
  name: "Product Name",
  category: "Electronics",
  price: 49.99,
  stock: 10,
  description: "Product description",
  imageURL: "products/path-to-image.jpg",
  createdAt: Timestamp
}
```

#### `inquiries` collection
```javascript
{
  userName: "Customer Name",
  userPhone: "+1234567890",
  productName: "Product Name",
  productId: "product-doc-id",
  message: "User message",
  timestamp: Timestamp,
  viewed: false,
  type: "product_inquiry" // or "general_inquiry"
}
```

#### `offers` collection
```javascript
{
  title: "Special Offer",
  description: "Offer description",
  discount: 20,
  validUntil: "2024-12-31",
  imageURL: "offers/path-to-image.jpg",
  createdAt: Timestamp
}
```

### 5. Set up Firestore Rules

Go to Firestore → Rules and update:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read for products and offers
    match /products/{document=**} {
      allow read;
      allow write: if request.auth != null;
    }
    match /offers/{document=**} {
      allow read;
      allow write: if request.auth != null;
    }
    // Allow public write for inquiries (form submissions)
    match /inquiries/{document=**} {
      allow read, write: if request.auth != null;
      allow create; // Allow public to submit inquiries
    }
  }
}
```

### 6. Set up Firebase Storage Rules

Go to Storage → Rules:

```storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
    match /offers/{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}
```

## 📁 Project Structure

```
public/
├── index.html              # Homepage
├── products.html           # Product listing page
├── admin.html             # Admin panel
├── manifest.json          # PWA manifest
├── css/
│   ├── style.css          # Main styles
│   └── admin.css          # Admin panel styles
├── js/
│   ├── config.js          # Firebase config + shop settings
│   ├── utils.js           # Shared utilities & helpers
│   ├── main.js            # Homepage functionality
│   ├── products.js        # Products page
│   └── admin.js           # Admin panel
└── images/                # Local images (optional)

Root Files:
├── vercel.json            # Deployment config
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🌍 Pages Overview

### 👤 Public Pages

**Homepage** (`index.html`)
- Hero section with shop branding
- Today's offers display
- Featured products preview
- Contact section with forms
- Opening hours & location map

**Products** (`products.html`)
- Full product grid with filters
- Search functionality
- Category filtering
- Price sorting
- Product detail modals
- WhatsApp integration

### 🔐 Admin Pages

**Admin Panel** (`admin.html`)
- Login with Firebase Auth
- **Products Tab**: Add, edit, delete products with image upload
- **Offers Tab**: Manage shop offers
- **Inquiries Tab**: View and manage customer inquiries
- **Settings Tab**: Update shop details

## 🔧 Configuration Guide

### Shop Configuration (`config.js`)

```javascript
const SHOP_CONFIG = {
  name: "Your Shop Name",
  tagline: "Your Tagline",
  description: "Shop description",
  phone: "+1234567890",
  whatsAppNumber: "+1234567890", // Use full country code
  mapEmbedUrl: "...", // Get from Google Maps
  openingHours: {
    monday: "09:00 - 22:00",
    // ...
  }
};

const PRODUCT_CATEGORIES = [
  "Electronics",
  "Clothing",
  // Add your categories
];
```

### Multi-Language Support

Supported languages: **English (en)** and **Malayalam (ml)**

Add translations in `utils.js` → `STRINGS` object:

```javascript
const STRINGS = {
  en: { /* English translations */ },
  ml: { /* Malayalam translations */ }
};
```

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `public` folder as root directory
   - Add Environment Variables:
     - `FIREBASE_API_KEY`
     - `FIREBASE_PROJECT_ID`
     - etc.
   - Deploy!

3. **Update Config for Production**
   - Update `config.js` with your Firebase project credentials
   - Test all features (WhatsApp, forms, admin panel)

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase init hosting
# Select `public` folder
firebase deploy
```

## 🔐 Security Checklist

- ✅ Update `config.js` with your Firebase credentials
- ✅ Configure Firestore rules to restrict admin operations
- ✅ Set up Firebase Storage rules
- ✅ Create admin users only for authorized people
- ✅ Enable HTTPS for production
- ✅ Configure CORS for Firebase Storage (if needed)

## 🎨 Customization

### Change Colors

Edit CSS variables in `style.css`:

```css
:root {
  --primary-color: #2563eb;      /* Main blue */
  --secondary-color: #1e40af;    /* Dark blue */
  --accent-color: #f59e0b;       /* Orange/Yellow */
  --success-color: #10b981;      /* Green */
  --danger-color: #ef4444;       /* Red */
  /* Add more colors */
}
```

### Add Categories

Add to `PRODUCT_CATEGORIES` in `config.js`:

```javascript
const PRODUCT_CATEGORIES = [
  "All",
  "Your Category 1",
  "Your Category 2",
];
```

### Customize WhatsApp Messages

Edit the message format in `utils.js`:

```javascript
function openWhatsApp(phoneNumber, productName, customMessage) {
  // Customize message here
  let message = customMessage || `Hello, I'm interested in ${productName}`;
  // ...
}
```

## 🐛 Troubleshooting

### Firebase not initializing?
- Check `config.js` has correct credentials
- Ensure all Firebase SDN scripts are loaded in HTML
- Check browser console for errors

### Images not uploading?
- Verify Firebase Storage rules allow uploads
- Check file size (max 5MB recommended)
- Ensure `public/js/config.js` has correct storage bucket

### Admin login not working?
- Verify user exists in Firebase Authentication
- Check browser localStorage is enabled
- Clear browser cache and try again

### WhatsApp links not working?
- Ensure phone number format is correct (+CC digits)
- On mobile, WhatsApp app must be installed
- Desktop redirects to WhatsApp Web

## 📞 Support

For issues:
1. Check browser console for error messages
2. Verify Firebase project configuration
3. Test with sample data first
4. Check Firestore/Storage rules

## 📝 License

MIT License - Feel free to use and modify!

## 🎯 Future Enhancements

- [ ] Email notifications for inquiries
- [ ] SMS integration
- [ ] Customer ratings & reviews
- [ ] Wishlist feature
- [ ] Inventory alerts
- [ ] Analytics dashboard
- [ ] Multiple shop support
- [ ] Appointment booking

---

**Built with ❤️ for small businesses and local shops**

Happy selling! 🚀