# 📚 Wuroud Mart - Features & API Documentation

## Project Overview

Wuroud Mart is a complete digital product catalog system built with vanilla HTML/CSS/JavaScript and Firebase backend. It includes:
- **Public Website**: Homepage, Products page, Contact forms
- **Admin Dashboard**: Product management, Offer management, Inquiry tracking
- **Multi-language Support**: English & Malayalam
- **PWA Support**: Installable as app
- **Fully Responsive**: Mobile, tablet, desktop

## 🎯 Key Features

### 1. Public Pages

#### Homepage (`index.html`)
- Hero section with shop branding
- CTA buttons (View Products, Contact via WhatsApp)
- Today's Offers carousel
- Featured Products grid (6 products)
- Contact section with:
  - Phone call button
  - WhatsApp button
  - Google Maps embed
  - Opening hours
  - General inquiry form
- Footer with copyright

#### Products Page (`products.html`)
- Full product grid (responsive, 1-4 columns)
- Real-time search filtering
- Category filtering (dropdown)
- Sorting options:
  - Newest first
  - Price: Low to High
  - Price: High to Low
  - Name: A to Z
- Click product → Detail modal with:
  - Large image
  - Full description
  - Stock status
  - "Send Inquiry via WhatsApp" button
  - "Ask for Product" form

### 2. Admin Dashboard (`admin.html`)

#### Authentication
- Firebase Email/Password login
- Session management
- Automatic redirect if not logged in

#### Products Management Tab
- View all products in list (with images)
- Add new product:
  - Name, category, price, stock, description
  - Image upload (stores in Firebase Storage)
- Edit product (prepopulate form)
- Delete product (with confirmation)
- Image preview before upload

#### Offers Management Tab
- Create promotional offers:
  - Title, description, discount %, valid until date
  - Image upload
- Edit offers
- Delete offers
- Calendar date picker for validity

#### Inquiries Tab
- View all customer inquiries:
  - Customer name & phone (clickable tel: link)
  - Product name (if product inquiry)
  - Inquiry message
  - Timestamp
- Mark as read/unread
- Delete inquiry
- Visual differentiation (new vs. viewed)

#### Settings Tab
- Update shop configuration:
  - Shop name
  - Phone number
  - WhatsApp number
  - Shop description
- Settings stored in localStorage

### 3. Shared Features

#### Multi-Language Support
- English (en) - Default
- Malayalam (ml)
- Language toggle in header
- Persisted in localStorage
- Page reloads with new language

#### WhatsApp Integration
- Click-to-message functionality
- Pre-filled product names
- Works on mobile (opens WhatsApp app)
- Works on desktop (opens WhatsApp Web)

#### Responsive Design
- **Mobile**: Single column, hamburger menu
- **Tablet**: 2 columns, optimized spacing
- **Desktop**: 3-4 columns, full navigation

#### Form Handling
- Form validation (email, phone, required fields)
- Real-time feedback (toast notifications)
- Error handling with user-friendly messages
- Data persisted to Firestore

## 🔧 Technical Architecture

### Frontend Stack
```
├── HTML5 (semantic markup)
├── CSS3 (CSS Grid, Flexbox, variables)
├── JavaScript (vanilla, modular)
└── Firebase SDK (from CDN)
```

### File Organization

```
Main Application:
- index.html          (HomePage)
- products.html       (Products listing)
- admin.html          (Admin dashboard)

Styling:
- css/style.css       (Global + responsive styles)
- css/admin.css       (Admin-specific styles)

JavaScript:
- js/config.js        (Firebase config + shop settings)
- js/utils.js         (Shared utilities & helpers)
- js/main.js          (Homepage logic)
- js/products.js      (Products page logic)
- js/admin.js         (Admin panel logic)

Infrastructure:
- manifest.json       (PWA manifest)
- sw.js              (Service worker - offline support)
- vercel.json        (Vercel deployment config)
```

### Firebase Integration

#### Firestore Collections

**`products` Collection**
```javascript
{
  id: "auto-generated",
  name: string,
  category: string,
  price: number,
  stock: number,
  description: string,
  imageURL: string (storage path),
  createdAt: timestamp
}
```

**`offers` Collection**
```javascript
{
  id: "auto-generated",
  title: string,
  description: string,
  discount: number (0-100),
  validUntil: string (date),
  imageURL: string (storage path),
  createdAt: timestamp
}
```

**`inquiries` Collection**
```javascript
{
  id: "auto-generated",
  userName: string,
  userPhone: string,
  message: string,
  productName: string (optional),
  productId: string (optional),
  timestamp: timestamp,
  viewed: boolean,
  type: "product_inquiry" | "general_inquiry"
}
```

#### Firebase Storage
- `/products/{filename}` - Product images
- `/offers/{filename}` - Offer images

#### Firebase Authentication
- Email/Password provider
- Admin users stored in Authentication

## 📱 API Reference

### Utility Functions Available (`utils.js`)

#### Language Management
```javascript
t(key)                  // Get translated string
setLanguage(lang)       // Switch language (en/ml)
currentLanguage         // Current language code
```

#### Firebase
```javascript
initializeFirebase()    // Initialize Firebase (called automatically)
db                      // Firestore instance
storage                 // Firebase Storage instance
auth                    // Firebase Authentication instance
```

#### WhatsApp
```javascript
openWhatsApp(phone, productName, message)    // Open WhatsApp link
getWhatsAppLink(phone, message)              // Get WhatsApp URL
```

#### Formatting
```javascript
formatCurrency(price)   // Format as currency (₹ symbol)
formatDate(timestamp)   // Format Firestore timestamp
getImageUrl(path)       // Convert path to Firebase Storage URL
slugify(text)          // Convert text to slug format
```

#### Notifications
```javascript
showNotification(msg, type)    // Show toast (success/error)
showLoader()                   // Show loading spinner
hideLoader()                   // Hide loading spinner
```

#### DOM Utilities
```javascript
$(selector)             // querySelector shorthand
$$(selector)            // querySelectorAll shorthand
on(element, event, fn)  // addEventListener shorthand
off(element, event, fn) // removeEventListener shorthand
```

#### Validation
```javascript
validateEmail(email)    // Check valid email format
validatePhone(phone)    // Check valid 10-digit phone
```

#### Storage (localStorage)
```javascript
setCache(key, value)    // Store JSON to localStorage
getCache(key)          // Retrieve JSON from localStorage
removeCache(key)        // Delete from localStorage
```

## 🌍 Pages & Routes

```
/ or /index.html              → Homepage
/products.html                → Products listing
/admin.html                   → Admin panel
/manifest.json                → PWA manifest
/sw.js                        → Service worker
```

## 📊 Data Flow

### Product Display Flow
1. User opens `/products.html`
2. `loadAllProducts()` fetches from Firestore
3. Products rendered in grid
4. User searches/filters (client-side)
5. Click product → Modal opens with details

### Admin Product Creation Flow
1. Admin logs in with Firebase Auth
2. Clicks "Add Product"
3. Fills form with product details
4. Selects image file
5. `saveProduct()` uploads image to Storage
6. Product data saved to Firestore
7. Admin notified of success
8. Products list reloads

### Customer Inquiry Flow
1. Customer fills inquiry form
2. Form submitted to Firestore
3. Document added to `inquiries` collection
4. Success notification shown
5. Admin sees new inquiry in dashboard
6. Admin can mark as read/delete

## 🎨 Styling System

### CSS Variables
```css
--primary-color: #2563eb        /* Main blue */
--secondary-color: #1e40af      /* Dark blue */
--accent-color: #f59e0b         /* Orange */
--success-color: #10b981        /* Green */
--danger-color: #ef4444         /* Red */
--text-primary: #1f2937         /* Dark gray */
--text-secondary: #6b7280       /* Light gray */
--border-color: #e5e7eb
--bg-light: #f9fafb
--bg-white: #ffffff
--shadow-sm/md/lg                /* Shadow levels */
--radius: 12px                  /* Border radius */
--transition: all 0.3s ease     /* Transitions */
```

### Responsive Breakpoints
- Mobile: < 640px (default)
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🚀 Performance Features

- **Lazy Loading**: Images load on-demand
- **Model Splitting**: Separate JS files for each page
- **CSS Variables**: Single source of truth for styling
- **Service Worker**: Offline support and caching
- **Responsive Images**: srcset attributes
- **No Dependencies**: No npm packages required

## 🔐 Security Features

- **Firebase Auth**: Secured admin access
- **Firestore Rules**: Public read, admin write
- **Storage Rules**: Restricted uploads
- **Input Validation**: Form validation on client
- **No Secrets in Code**: Placeholder config
- **HTTPS**: Enforced in production

## 📦 Deployment Ready

- **Vercel Config**: Included
- **Static Files**: No build step needed
- **PWA Manifest**: Installable app
- **Service Worker**: Offline functionality
- **Environment Variables**: Support for secrets
- **No Database Migrations**: Cloud-hosted

## 🔄 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📈 Scalability

**Current Limitations:**
- Firestore: Free tier supports ~25k reads/day
- Storage: Free tier supports 5GB/month
- Functions: Not used (scalable to unlimited)

**For High Traffic:**
- Upgrade Firestore to Blaze plan (pay-as-you-go)
- Implement image CDN for storage
- Add caching layer
- Optimize queries with indexes

## 🎓 Code Examples

### Add New Product (Admin)
```javascript
async function saveProduct() {
  const productData = {
    name: document.getElementById("productName").value,
    category: document.getElementById("productCategory").value,
    price: parseFloat(document.getElementById("productPrice").value),
    stock: parseInt(document.getElementById("productStock").value),
    description: document.getElementById("productDescription").value
  };
  
  // Upload image first
  const imageFile = document.getElementById("productImage").files[0];
  if (imageFile) {
    // Upload to Storage, then save document
  }
  
  // Save to Firestore
  await db.collection("products").add(productData);
}
```

### Display Products (Public)
```javascript
async function loadAllProducts() {
  const snapshot = await db.collection("products").get();
  snapshot.forEach((doc) => {
    const product = { id: doc.id, ...doc.data() };
    displayProduct(product);
  });
}
```

### Submit Inquiry (Public)
```javascript
async function submitInquiry(name, phone, message) {
  await db.collection("inquiries").add({
    userName: name,
    userPhone: phone,
    message: message,
    timestamp: new Date(),
    viewed: false
  });
  showNotification("Inquiry submitted!");
}
```

---

## 📝 Version Info

- **Version**: 1.0.0
- **Built**: 2024
- **Framework**: Vanilla HTML/CSS/JavaScript
- **Backend**: Firebase (Firestore + Storage + Auth)
- **Deployment**: Vercel / Firebase Hosting

---

**Fully featured, production-ready, and ready to deploy! 🚀**
