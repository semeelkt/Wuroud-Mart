# 🔐 Firebase Security Rules

Copy and paste these rules into your Firebase Console.

## Firestore Rules

Go to: **Firebase Console → Firestore Database → Rules**

Delete all content and replace with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: Public read, authenticated write
    match /products/{document=**} {
      allow read;
      allow write: if request.auth != null;
    }
    
    // Product Sizes: Authenticated read/write only
    match /productSizes/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Offers: Public read, authenticated write
    match /offers/{document=**} {
      allow read;
      allow write: if request.auth != null;
    }
    
    // Orders: Public create (pre-orders), authenticated read/write
    match /orders/{document=**} {
      allow read, write: if request.auth != null;
      allow create; // Allow public users to submit pre-orders
    }
    
    // Inquiries: Authenticated read/write, public create (for forms)
    match /inquiries/{document=**} {
      allow read, write: if request.auth != null;
      allow create; // Allow public to submit inquiries via forms
    }

    // Admins collection: Read/write for authenticated users only
    match /admins/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **"Publish"** button

---

## Firebase Storage Rules

Go to: **Firebase Console → Storage → Rules**

Delete all content and replace with:

```storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Products folder: public read, authenticated write
    match /products/{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
    
    // Offers folder: public read, authenticated write
    match /offers/{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}
```

Click **"Publish"** button

---

## What These Rules Do

### Firestore Rules Explained

| Collection | Public Users | Admin (Authenticated) |
|-----------|------------|----------------------|
| **products** | Read ✅ | Read ✅ Write ✅ |
| **offers** | Read ✅ | Read ✅ Write ✅ |
| **inquiries** | Create ✅ (forms only) | Read ✅ Write ✅ |

### Storage Rules Explained

| Folder | Public Users | Admin (Authenticated) |
|--------|------------|----------------------|
| **products/** | Read images ✅ | Write images ✅ |
| **offers/** | Read images ✅ | Write images ✅ |

---

## Security Features

✅ **Customers can:**
- View all products
- View all offers
- Submit inquiries via forms
- View images

❌ **Customers cannot:**
- Delete or modify products
- Delete or modify offers
- Delete other inquiries
- Upload images

✅ **Admin (logged in) can:**
- Create, read, update, delete products
- Create, read, update, delete offers
- View, update, delete inquiries
- Upload product/offer images

---

## Testing Your Rules

### Test Public Access (Products Page)

1. Open Products page in **Incognito/Private** browser (not logged in)
2. Products should load ✅
3. Should NOT be able to edit any product ❌

### Test Admin Access (Admin Panel)

1. Login with admin credentials
2. Should be able to add/edit/delete products ✅
3. Should be able to upload images ✅

### Test Form Submission (Contact Form)

1. Fill inquiry form on homepage (not logged in)
2. Submit form
3. Should save to Firestore `inquiries` collection ✅

---

## Troubleshooting

### "Permission denied" when viewing products?
- Check Firestore rules allow public `read` for products
- Verify rules are published (click Publish button)
- Wait 30 seconds and refresh page

### "Cannot upload image" in admin?
- Check you're logged in (see user in top-right)
- Verify Storage rules allow authenticated `write`
- Check file size (max ~5MB)

### "Cannot submit form" as public user?
- Verify rules allow `create` for inquiries collection
- Check network tab in browser console for exact error

### Rules don't seem to work?
- Make sure you clicked **"Publish"** button
- Clear browser cache (Ctrl+Shift+Delete)
- Wait 1-2 minutes for rules to propagate
- Check browser console (F12) for error messages

---

## Advanced Rule Customization

### Allow CSV import/export?

Add this rule:
```firestore
match /exports/{document=**} {
  allow read, write: if request.auth != null;
}
```

### Add email notifications?

Add Cloud Functions rule:
```firestore
match /notifications/{document=**} {
  allow read, write: if request.auth != null;
}
```

### Restrict to specific admin emails?

Replace admin rules:
```firestore
match /products/{document=**} {
  allow read;
  allow write: if request.auth.token.email in ['admin@yourshop.com', 'owner@yourshop.com'];
}
```

---

## Best Practices

✅ **DO:**
- Review rules before publishing
- Test with both public and admin access
- Keep sensitive operations behind auth
- Use specific collection paths
- Monitor Security Rules usage in Firebase Console

❌ **DON'T:**
- Use overly permissive rules (`allow read, write;`)
- Store sensitive data (passwords, credit cards)
- Leave default "allow all" rules
- Forget to publish rule changes

---

## Documentation Links

- Firebase Rules: https://firebase.google.com/docs/firestore/security/start
- Storage Rules: https://firebase.google.com/docs/storage/security
- Security Guide: https://firebase.google.com/docs/firestore/security/get-started

---

**Your security rules are now configured! 🔐**
