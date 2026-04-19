# 🚀 Wuroud Mart - Complete Setup Guide

## Overview

This guide will walk you through setting up Wuroud Mart, a premium digital product catalog for local shops.

**Total Setup Time: ~15-20 minutes**

## Part 1: Firebase Project Setup

### Step 1.1: Create Firebase Project

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., "Wuroud-Mart")
4. Accept terms and click **"Continue"**
5. Keep default analytics settings, click **"Create project"**
6. Wait for project to initialize (1-2 minutes)

### Step 1.2: Enable Required Services

#### A. Firestore Database

1. In Firebase Console, click **"Firestore Database"** (left sidebar)
2. Click **"Create database"**
3. Select **"Production mode"**
4. Choose location (closest to your users)
5. Click **"Create"**

#### B. Firebase Storage

1. Click **"Storage"** (left sidebar)
2. Click **"Get started"**
3. Accept default rules for now
4. Click **"Done"**

#### C. Authentication

1. Click **"Authentication"** (left sidebar)
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. Enable both options (Email/password)
5. Click **"Save"**

### Step 1.3: Create Admin User

1. Still in Authentication section
2. Click **"Users"** tab
3. Click **"Add user"**
4. Enter your admin email and password
5. Click **"Add user"**

**Save these credentials** - you'll need them to login to the admin panel!

## Part 2: Get Firebase Credentials

### Step 2.1: Find Your Config

1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Click **"Your apps"** section
3. Click the **Web** icon (looks like `</>`)
4. If no app exists, click **"Add app"** → **"Web"**
5. Copy the config object (starts with `const firebaseConfig = {`)

### Step 2.2: Update config.js

1. Open `/public/js/config.js` in your code editor
2. Replace the placeholder values:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",                    // Copy from Firebase
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

3. Update `SHOP_CONFIG`:
   ```javascript
   const SHOP_CONFIG = {
     name: "Your Shop Name",
     phone: "+1234567890",           // Your actual number
     whatsAppNumber: "+1234567890",  // Same or different
     // ... update other fields
   };
   ```

## Part 3: Test Locally

### Option A: Python (Recommended)

```bash
cd public
python -m http.server 8000
```

Open browser: `http://localhost:8000`

### Option B: VS Code Live Server

1. Install extension: "Live Server" by Ritwick Dey
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option C: Node.js

```bash
npx http-server public -p 8000
```

## Part 4: Configure Firestore

### Step 4.1: Create Collections

In Firebase Console → Firestore Database:

1. Click **"Create collection"**
2. Name it **"products"**
3. Click **"Auto-generate ID"**
4. Add these fields:
   - `name` (string): "Sample Product"
   - `category` (string): "Electronics"
   - `price` (number): 49.99
   - `stock` (number): 10
   - `description` (string): "Product description"
   - `imageURL` (string): "products/sample.jpg" (or leave empty for now)

5. Click **"Save"**

### Step 4.2: Create Other Collections

Repeat above for:
- **"offers"** collection (add sample offer)
- **"inquiries"** collection (will auto-populate when customers submit forms)

## Part 5: Configure Security Rules

### Step 5.1: Firestore Rules

1. In Firestore → **"Rules"** tab
2. Replace all content with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: public read, authenticated write
    match /products/{document=**} {
      allow read;
      allow write: if request.auth != null;
    }
    
    // Offers: public read, authenticated write
    match /offers/{document=**} {
      allow read;
      allow write: if request.auth != null;
    }
    
    // Inquiries: public create, authenticated read/write
    match /inquiries/{document=**} {
      allow read, write: if request.auth != null;
      allow create; // Public form submissions
    }
  }
}
```

3. Click **"Publish"**

### Step 5.2: Storage Rules

1. In Storage → **"Rules"** tab
2. Replace with:

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

3. Click **"Publish"**

## Part 6: Test the Website

### Homepage

1. Open `http://localhost:8000`
2. Verify:
   - Shop name displays
   - "View Products" button works
   - "Contact via WhatsApp" button works
   - Featured products loading

### Products Page

1. Click "View Products"
2. Should see sample product
3. Test:
   - Search functionality
   - Category filtering
   - Click product → detail modal
   - WhatsApp link

### Admin Panel

1. Go to `http://localhost:8000/admin.html`
2. Login with your admin credentials (from Step 1.3)
3. Test:
   - Add a new product with image
   - Edit product
   - View inquiries
   - Update settings

## Part 7: Deploy to Vercel

### Step 7.1: Push to GitHub

```bash
git add .
git commit -m "Wuroud Mart - Complete digital catalog"
git push origin main
```

### Step 7.2: Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select project
5. **Framework Preset**: None (static)
6. **Root Directory**: `public`
7. Click **"Deploy"**

### Step 7.3: Add Environment Variables (Optional)

If you want to hide Firebase credentials:

1. In Vercel Project Settings → **"Environment Variables"**
2. Add each Firebase config value
3. Update `config.js` to use environment variables (if deployed on server)

## Customization

### Change Colors

Edit `/public/css/style.css`:

```css
:root {
  --primary-color: #2563eb;      /* Blue */
  --secondary-color: #1e40af;    /* Dark blue */
  --accent-color: #f59e0b;       /* Orange */
  --success-color: #10b981;      /* Green */
  --danger-color: #ef4444;       /* Red */
}
```

### Add Product Categories

Edit `/public/js/config.js`:

```javascript
const PRODUCT_CATEGORIES = [
  "All",
  "Your Category 1",
  "Your Category 2",
  "Your Category 3"
];
```

### Update Shop Info

Edit `/public/js/config.js`:

```javascript
const SHOP_CONFIG = {
  name: "Your Shop Name",
  tagline: "Your tagline",
  description: "Your description",
  phone: "+1234567890",
  whatsAppNumber: "+1234567890",
  mapEmbedUrl: "https://...", // Get from Google Maps
  openingHours: { /* ... */ }
};
```

## Troubleshooting

### Issue: "Firebase not connected"

**Solution:**
- Check `/public/js/config.js` has correct credentials
- Verify Firebase project is activated
- Check browser console for errors (F12)

### Issue: "Can't upload images"

**Solution:**
- Verify Storage Bucket name is correct in config
- Check Storage Rules allow authenticated writes
- Try smaller image file

### Issue: "Admin login fails"

**Solution:**
- Verify user exists in Firebase Authentication
- Check you're entering correct email/password
- Clear browser cache and try again
- Check if Authentication is enabled in Firebase

### Issue: "WhatsApp links don't work"

**Solution:**
- Ensure phone number format: **+CC digits** (e.g., +919876543210)
- On mobile: WhatsApp app must be installed
- On desktop: Opens WhatsApp Web

### Issue: Products not showing

**Solution:**
- Create products in Firestore console first
- Check Firestore Rules allow public read
- Verify product document has all required fields
- Check browser console for errors

## Next Steps

1. **Add more products** via admin panel
2. **Create offers** for promotions
3. **Customize colors and branding**
4. **Add category-specific products**
5. **Monitor inquiries** from customers
6. **Share your link** with customers

## Security Checklist

- ✅ Firebase credentials in `config.js`
- ✅ Firestore Rules configured
- ✅ Storage Rules configured
- ✅ Admin user created
- ✅ Only authorized people have admin access
- ✅ Phone number format is correct (+CC digits)

## Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Guide**: https://firebase.google.com/docs/firestore
- **Storage Guide**: https://firebase.google.com/docs/storage
- **Authentication**: https://firebase.google.com/docs/auth

---

**You're all set! Happy selling! 🚀**
