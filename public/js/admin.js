/**
 * Admin Panel Functionality
 */

let currentUser = null;
let editingProductId = null;
let editingOfferId = null;

// Admin credentials
const ADMIN_EMAIL = "mrflux3602@gmail.com";
const ADMIN_PASSWORD = "3602mskt";

// ============================================
// Initialize
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const firebaseReady = await initializeFirebase();
    if (firebaseReady) {
      // Check if admin account needs to be created
      await setupAdminAccount();
      checkAuthStatus();
      setupEventListeners();
    } else {
      console.error("Failed to initialize Firebase");
      alert("Firebase initialization failed. Please refresh.");
    }
  } catch (error) {
    console.error("Initialization error:", error);
    alert("Error initializing app: " + error.message);
  }
});

// ============================================
// Setup Admin Account
// ============================================
async function setupAdminAccount() {
  try {
    console.log('Starting admin account setup...');

    // Wait a moment to ensure Firebase is ready
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!db || !auth) {
      console.warn('Firebase not ready yet');
      return;
    }

    // Check if admin user already exists in Firestore
    const adminDoc = await db.collection('admins').doc(ADMIN_EMAIL).get();

    if (!adminDoc.exists) {
      console.log('Admin account does not exist, creating...');

      try {
        // Try to create the admin user
        const userCredential = await auth.createUserWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Admin user created successfully!');

        // Store admin info in Firestore
        await db.collection('admins').doc(ADMIN_EMAIL).set({
          email: ADMIN_EMAIL,
          uid: userCredential.user.uid,
          createdAt: new Date(),
          role: 'admin'
        });

        console.log('✅ Admin data saved to Firestore!');
        console.log(`🎉 Admin account ready! Login with:\n   Email: ${ADMIN_EMAIL}\n   Password: ${ADMIN_PASSWORD}`);

        // Logout so user can login with admin credentials
        await auth.signOut();
        console.log('Logged out - Please login with admin credentials');

      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log('Admin user already exists in Firebase');

          // Add to admins collection if not there
          const currentUser = auth.currentUser;
          if (currentUser && currentUser.email === ADMIN_EMAIL) {
            await db.collection('admins').doc(ADMIN_EMAIL).set({
              email: ADMIN_EMAIL,
              uid: currentUser.uid,
              createdAt: new Date(),
              role: 'admin'
            });
            await auth.signOut();
          }
        } else {
          console.error('❌ Error creating admin:', error.message);
          throw error;
        }
      }
    } else {
      console.log('✅ Admin account already exists');
    }
  } catch (error) {
    console.error('⚠️ Error in setupAdminAccount:', error);
  }
}

/**
 * Manual setup button for admin account
 */
async function manualSetupAdmin() {
  try {
    const btn = event.target.closest('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';

    console.log('Manual admin setup starting...');

    if (!db || !auth) {
      throw new Error('Firebase not initialized');
    }

    // Create user
    console.log('Creating user:', ADMIN_EMAIL);
    const userCredential = await auth.createUserWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ User created:', userCredential.user.uid);

    // Save to Firestore
    console.log('Saving to Firestore...');
    await db.collection('admins').doc(ADMIN_EMAIL).set({
      email: ADMIN_EMAIL,
      uid: userCredential.user.uid,
      createdAt: new Date(),
      role: 'admin'
    });
    console.log('✅ Admin saved to Firestore');

    // Logout
    await auth.signOut();
    console.log('✅ Setup complete!');

    alert('✅ Admin account created successfully!\n\nEmail: ' + ADMIN_EMAIL + '\nPassword: ' + ADMIN_PASSWORD + '\n\nPlease refresh and login.');
    location.reload();

  } catch (error) {
    console.error('❌ Error:', error.message);
    const btn = event.target.closest('button');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-wrench"></i> Setup Admin Account';

    if (error.code === 'auth/email-already-in-use') {
      alert('✅ Admin account already exists!\n\nJust login with:\nEmail: ' + ADMIN_EMAIL + '\nPassword: ' + ADMIN_PASSWORD);
    } else {
      alert('❌ Error: ' + error.message);
    }
  }
}

// ============================================
// Authentication
// ============================================
function checkAuthStatus() {
  if (auth && typeof auth.onAuthStateChanged === "function") {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Check if user is admin
        try {
          const adminDoc = await db.collection('admins').doc(user.email).get();

          if (adminDoc.exists) {
            // User is admin - show dashboard
            currentUser = user;
            console.log('✅ Admin verified:', user.email);
            showDashboard();
            loadAllData();
          } else {
            // User exists but is not admin - logout
            console.warn('⚠️ User is not admin:', user.email);
            await auth.signOut();
            showLogin();
            alert('❌ Access Denied!\n\nYou are not authorized as an admin.\n\nPlease login with admin credentials.');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          showLogin();
        }
      } else {
        showLogin();
      }
    });
  }
}

function setupEventListeners() {
  // Login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      await login(email, password);
    });
  }

  // Tabs
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      switchTab(e.target.dataset.tab);
    });
  });

  // Product Form
  const productForm = document.getElementById("productForm");
  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveProduct();
    });

    const productImage = document.getElementById("productImage");
    if (productImage) {
      productImage.addEventListener("blur", (e) => previewImageURL(e, "previewImg", "imagePreview"));
    }

    // Handle offerPrice field visibility when modal closes
    const productModal = document.getElementById("productFormModal");
    if (productModal) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            if (!productModal.classList.contains("active")) {
              // Reset offerPrice field when modal closes
              document.getElementById("productOfferPrice").value = "";
              document.getElementById("offerPriceGroup").style.display = "none";
            }
          }
        });
      });
      observer.observe(productModal, { attributes: true });
    }
  }

  // Offer Form
  const offerForm = document.getElementById("offerForm");
  if (offerForm) {
    offerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveOffer();
    });

    const offerImage = document.getElementById("offerImage");
    if (offerImage) {
      offerImage.addEventListener("blur", (e) => previewImageURL(e, "offerPreviewImg", "offerImagePreview"));
    }
  }

  // Settings Form
  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveSettings();
    });
  }
}

async function login(email, password) {
  try {
    showLoader();
    await auth.signInWithEmailAndPassword(email, password);
    showNotification("Login successful!", "success");
  } catch (error) {
    console.error("Login error:", error);
    showNotification(error.message || "Login failed. Please check your credentials.", "error");
  } finally {
    hideLoader();
  }
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    auth.signOut().then(() => {
      showLogin();
      showNotification("Logged out successfully", "success");
    });
  }
}

function showLogin() {
  document.getElementById("loginSection").classList.add("active");
  document.getElementById("adminDashboard").classList.remove("active");
}

function showDashboard() {
  document.getElementById("loginSection").classList.remove("active");
  document.getElementById("adminDashboard").classList.add("active");
}

// ============================================
// Tab Switching
// ============================================
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Remove active from all nav buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab
  const tabElement = document.getElementById(`${tabName}-tab`);
  if (tabElement) {
    tabElement.classList.add("active");
  }

  // Mark nav button as active
  event.target.classList.add("active");

  // Load tab data
  if (tabName === "products") loadProducts();
  if (tabName === "orders") loadOrders();
  if (tabName === "offers") loadOffers();
  if (tabName === "inquiries") loadInquiries();
  if (tabName === "settings") loadSettings();
}

// ============================================
// Products Management
// ============================================
async function loadProducts() {
  const container = document.getElementById("productsList");
  try {
    if (!db) {
      container.innerHTML = "<p style='text-align: center; color: red;'>Firebase not initialized</p>";
      return;
    }

    const snapshot = await db.collection(COLLECTIONS.products).get();
    if (snapshot.empty) {
      container.innerHTML = "<p style='text-align: center;'>No products yet</p>";
      return;
    }

    container.innerHTML = "";
    snapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      const item = createProductItem(product);
      container.appendChild(item);
    });
  } catch (error) {
    console.error("Error loading products:", error);
    container.innerHTML = "<p style='text-align: center; color: red;'>Error loading products</p>";
  }
}

function createProductItem(product) {
  const item = document.createElement("div");
  item.className = "product-item";
  const manageButton = product.category === "Footwear"
    ? `<button class="btn btn-info btn-small" onclick="manageSizes('${product.id}')">Sizes</button>`
    : "";

  const offerBadge = product.isOfferProduct
    ? `<span style="background: #ff6b6b; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.5rem;">🎁 OFFER</span>`
    : "";

  const priceDisplay = product.isOfferProduct && product.offerPrice
    ? `<p><strong>Price:</strong> <span style="text-decoration: line-through; color: #999;">~${formatCurrency(product.price)}</span> → <span style="color: #d4a574; font-weight: bold;">${formatCurrency(product.offerPrice)}</span></p>`
    : `<p><strong>Price:</strong> ${formatCurrency(product.price)}</p>`;

  item.innerHTML = `
    <img src="${getImageUrl(product.imageURL)}" alt="${product.name}" class="product-item-image" onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
    <div class="product-item-info">
      <h3>${offerBadge}${product.name}</h3>
      <p><strong>Category:</strong> ${product.category}</p>
      ${priceDisplay}
      <p><strong>Stock:</strong> ${product.stock}</p>
      <p><strong>Description:</strong> ${(product.description || "No description").substring(0, 100)}...</p>
    </div>
    <div class="product-item-actions">
      ${manageButton}
      <button class="btn ${product.isOfferProduct ? 'btn-success' : 'btn-outline'} btn-small" onclick="toggleOfferProduct('${product.id}', ${!product.isOfferProduct})">
        ${product.isOfferProduct ? '✅ Offer' : '⭕ Mark Offer'}
      </button>
      <button class="btn btn-secondary btn-small" onclick="editProduct('${product.id}')">Edit</button>
      <button class="btn btn-danger btn-small" onclick="deleteProduct('${product.id}')">Delete</button>
    </div>
  `;
  return item;
}

function openAddProductForm() {
  editingProductId = null;
  document.getElementById("productFormTitle").textContent = "Add Product";
  document.getElementById("productForm").reset();
  document.getElementById("productOfferPrice").value = "";
  document.getElementById("offerPriceGroup").style.display = "none";
  document.getElementById("imagePreview").style.display = "none";
  populateProductCategories();
  document.getElementById("productFormModal").classList.add("active");
}

async function editProduct(productId) {
  try {
    editingProductId = productId;
    const doc = await db.collection(COLLECTIONS.products).doc(productId).get();
    const product = doc.data();

    document.getElementById("productFormTitle").textContent = "Edit Product";
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productPrice").value = product.price || "";
    document.getElementById("productStock").value = product.stock;
    document.getElementById("productDescription").value = product.description || "";

    // Load offer price if product is an offer
    if (product.isOfferProduct && product.offerPrice) {
      document.getElementById("productOfferPrice").value = product.offerPrice || "";
      document.getElementById("offerPriceGroup").style.display = "block";
    } else {
      document.getElementById("productOfferPrice").value = "";
      document.getElementById("offerPriceGroup").style.display = "none";
    }

    populateProductCategories();

    if (product.imageURL) {
      document.getElementById("previewImg").src = getImageUrl(product.imageURL);
      document.getElementById("imagePreview").style.display = "block";
    }

    document.getElementById("productFormModal").classList.add("active");
  } catch (error) {
    console.error("Error loading product:", error);
    showNotification("Error loading product", "error");
  }
}

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    showLoader();
    await db.collection(COLLECTIONS.products).doc(productId).delete();
    showNotification("Product deleted successfully", "success");
    loadProducts();
  } catch (error) {
    console.error("Error deleting product:", error);
    showNotification("Error deleting product", "error");
  } finally {
    hideLoader();
  }
}

async function toggleOfferProduct(productId, isOffer) {
  try {
    showLoader();
    const updateData = {
      isOfferProduct: isOffer
    };

    // If marking as not an offer, clear the offer price
    if (!isOffer) {
      updateData.offerPrice = null;
    }

    await db.collection(COLLECTIONS.products).doc(productId).update(updateData);
    showNotification(isOffer ? "Product marked as offer! ✅" : "Removed from offers", "success");
    loadProducts();
  } catch (error) {
    console.error("Error updating product:", error);
    showNotification("Error updating product", "error");
  } finally {
    hideLoader();
  }
}

async function saveProduct() {
  try {
    showLoader();
    const productData = {
      name: document.getElementById("productName").value,
      category: document.getElementById("productCategory").value,
      price: parseFloat(document.getElementById("productPrice").value) || 0,
      stock: parseInt(document.getElementById("productStock").value),
      description: document.getElementById("productDescription").value
    };

    // Get image URL from input
    const imageURL = document.getElementById("productImage").value.trim();
    if (imageURL) {
      productData.imageURL = imageURL;
      console.log("Using image URL:", imageURL);
    }

    // Handle offer price
    const offerPrice = document.getElementById("productOfferPrice").value.trim();
    if (offerPrice) {
      productData.offerPrice = parseFloat(offerPrice);
    }

    await saveProductToFirestore(productData);
  } catch (error) {
    console.error("Error saving product:", error);
    showNotification("Error saving product: " + error.message, "error");
    hideLoader();
  }
}

async function saveProductToFirestore(productData) {
  try {
    if (editingProductId) {
      await db.collection(COLLECTIONS.products).doc(editingProductId).update(productData);
      showNotification("Product updated successfully", "success");
    } else {
      productData.createdAt = new Date();
      await db.collection(COLLECTIONS.products).add(productData);
      showNotification("Product added successfully", "success");
    }
    closeProductForm();
    loadProducts();
  } catch (error) {
    console.error("Error:", error);
    showNotification("Error saving product", "error");
  } finally {
    hideLoader();
  }
}

function closeProductForm() {
  document.getElementById("productFormModal").classList.remove("active");
  editingProductId = null;
}

function populateProductCategories() {
  const select = document.getElementById("productCategory");
  if (!select.querySelector("option[value='Electronics']")) {
    PRODUCT_CATEGORIES.slice(1).forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
  }
}

// ============================================
// Offers Management
// ============================================
async function loadOffers() {
  const container = document.getElementById("offersList");
  try {
    if (!db) {
      container.innerHTML = "<p style='text-align: center; color: red;'>Firebase not initialized</p>";
      return;
    }

    const snapshot = await db.collection(COLLECTIONS.offers).get();
    if (snapshot.empty) {
      container.innerHTML = "<p style='text-align: center;'>No offers yet</p>";
      return;
    }

    container.innerHTML = "";
    snapshot.forEach((doc) => {
      const offer = { id: doc.id, ...doc.data() };
      const item = createOfferItem(offer);
      container.appendChild(item);
    });
  } catch (error) {
    console.error("Error loading offers:", error);
    container.innerHTML = "<p style='text-align: center; color: red;'>Error loading offers</p>";
  }
}

function createOfferItem(offer) {
  const item = document.createElement("div");
  item.className = "offer-item";
  item.innerHTML = `
    <img src="${getImageUrl(offer.imageURL)}" alt="${offer.title}" class="offer-item-image" onerror="this.src='https://via.placeholder.com/120?text=No+Image'">
    <div class="offer-item-info">
      <h3>${offer.title}</h3>
      <p>${offer.description}</p>
      <div class="offer-item-discount">${offer.discount || 0}% OFF</div>
      <p style="font-size: 0.85rem; color: var(--text-secondary);">Valid: ${new Date(offer.validUntil).toLocaleDateString()}</p>
    </div>
    <div class="offer-item-actions">
      <button class="btn btn-secondary btn-small" onclick="editOffer('${offer.id}')">Edit</button>
      <button class="btn btn-danger btn-small" onclick="deleteOffer('${offer.id}')">Delete</button>
    </div>
  `;
  return item;
}

function openAddOfferForm() {
  editingOfferId = null;
  document.getElementById("offerFormTitle").textContent = "Add Offer";
  document.getElementById("offerForm").reset();
  document.getElementById("offerImagePreview").style.display = "none";
  document.getElementById("offerFormModal").classList.add("active");
}

async function editOffer(offerId) {
  try {
    editingOfferId = offerId;
    const doc = await db.collection(COLLECTIONS.offers).doc(offerId).get();
    const offer = doc.data();

    document.getElementById("offerFormTitle").textContent = "Edit Offer";
    document.getElementById("offerTitle").value = offer.title;
    document.getElementById("offerDescription").value = offer.description || "";
    document.getElementById("offerDiscount").value = offer.discount;
    document.getElementById("offerValidUntil").value = new Date(offer.validUntil).toISOString().split("T")[0];

    if (offer.imageURL) {
      document.getElementById("offerPreviewImg").src = getImageUrl(offer.imageURL);
      document.getElementById("offerImagePreview").style.display = "block";
    }

    document.getElementById("offerFormModal").classList.add("active");
  } catch (error) {
    console.error("Error loading offer:", error);
    showNotification("Error loading offer", "error");
  }
}

async function deleteOffer(offerId) {
  if (!confirm("Are you sure you want to delete this offer?")) return;

  try {
    showLoader();
    await db.collection(COLLECTIONS.offers).doc(offerId).delete();
    showNotification("Offer deleted successfully", "success");
    loadOffers();
  } catch (error) {
    console.error("Error deleting offer:", error);
    showNotification("Error deleting offer", "error");
  } finally {
    hideLoader();
  }
}

async function saveOffer() {
  try {
    showLoader();
    const offerData = {
      title: document.getElementById("offerTitle").value,
      description: document.getElementById("offerDescription").value,
      discount: parseInt(document.getElementById("offerDiscount").value),
      validUntil: new Date(document.getElementById("offerValidUntil").value).toISOString()
    };

    // Handle image upload - Store in Firebase Storage
    // Get image URL from input
    const imageURL = document.getElementById("offerImage").value.trim();
    if (imageURL) {
      offerData.imageURL = imageURL;
      console.log("Using offer image URL:", imageURL);
    }

    await saveOfferToFirestore(offerData);
  } catch (error) {
    console.error("Error saving offer:", error);
    showNotification("Error saving offer", "error");
    hideLoader();
  }
}

async function saveOfferToFirestore(offerData) {
  try {
    if (editingOfferId) {
      await db.collection(COLLECTIONS.offers).doc(editingOfferId).update(offerData);
      showNotification("Offer updated successfully", "success");
    } else {
      offerData.createdAt = new Date();
      await db.collection(COLLECTIONS.offers).add(offerData);
      showNotification("Offer added successfully", "success");
    }
    closeOfferForm();
    loadOffers();
  } catch (error) {
    console.error("Error:", error);
    showNotification("Error saving offer", "error");
  } finally {
    hideLoader();
  }
}

function closeOfferForm() {
  document.getElementById("offerFormModal").classList.remove("active");
  editingOfferId = null;
}

// ============================================
// Inquiries
// ============================================
async function loadInquiries() {
  const container = document.getElementById("inquiriesList");
  try {
    if (!db) {
      container.innerHTML = "<p style='text-align: center; color: red;'>Firebase not initialized</p>";
      return;
    }

    const snapshot = await db.collection(COLLECTIONS.inquiries).orderBy("timestamp", "desc").get();

    if (snapshot.empty) {
      container.innerHTML = "<p style='text-align: center;'>No inquiries yet</p>";
      return;
    }

    container.innerHTML = "";
    snapshot.forEach((doc) => {
      const inquiry = { id: doc.id, ...doc.data() };
      const item = createInquiryItem(inquiry);
      container.appendChild(item);
    });
  } catch (error) {
    console.error("Error loading inquiries:", error);
    container.innerHTML = "<p style='text-align: center; color: red;'>Error loading inquiries</p>";
  }
}

function createInquiryItem(inquiry) {
  const item = document.createElement("div");
  item.className = `inquiry-item ${inquiry.viewed ? "viewed" : ""}`;

  const timestamp = inquiry.timestamp?.toDate
    ? inquiry.timestamp.toDate().toLocaleString()
    : new Date().toLocaleString();

  item.innerHTML = `
    <div class="inquiry-header">
      <h4>${inquiry.userName}</h4>
      <span class="text-secondary" style="font-size: 0.85rem;">${timestamp}</span>
    </div>
    <div class="inquiry-meta">
      <strong>Phone:</strong> <a href="tel:${inquiry.userPhone}">${inquiry.userPhone}</a>
    </div>
    ${inquiry.productName ? `<div class="inquiry-product">${inquiry.productName}</div>` : ""}
    <div class="inquiry-message"><strong>Message:</strong> ${inquiry.message}</div>
    <div class="inquiry-actions">
      <button class="btn btn-secondary btn-small" onclick="markAsRead('${inquiry.id}', ${inquiry.viewed})">
        ${inquiry.viewed ? "Mark as Unread" : "Mark as Read"}
      </button>
      <button class="btn btn-danger btn-small" onclick="deleteInquiry('${inquiry.id}')">Delete</button>
    </div>
  `;
  return item;
}

async function markAsRead(inquiryId, isViewed) {
  try {
    await db.collection(COLLECTIONS.inquiries).doc(inquiryId).update({
      viewed: !isViewed
    });
    loadInquiries();
  } catch (error) {
    console.error("Error updating inquiry:", error);
    showNotification("Error updating inquiry", "error");
  }
}

async function deleteInquiry(inquiryId) {
  if (!confirm("Are you sure you want to delete this inquiry?")) return;

  try {
    await db.collection(COLLECTIONS.inquiries).doc(inquiryId).delete();
    showNotification("Inquiry deleted", "success");
    loadInquiries();
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    showNotification("Error deleting inquiry", "error");
  }
}

// ============================================
// Settings
// ============================================
async function loadSettings() {
  document.getElementById("shopName").value = SHOP_CONFIG.name;
  document.getElementById("shopPhone").value = SHOP_CONFIG.phone;
  document.getElementById("shopWhatsApp").value = SHOP_CONFIG.whatsAppNumber || SHOP_CONFIG.phone;
  document.getElementById("shopDescription").value = SHOP_CONFIG.description;
}

async function saveSettings() {
  try {
    showLoader();
    const settings = {
      shopName: document.getElementById("shopName").value,
      shopPhone: document.getElementById("shopPhone").value,
      shopWhatsApp: document.getElementById("shopWhatsApp").value,
      shopDescription: document.getElementById("shopDescription").value
    };

    // Save to localStorage for demo purposes
    localStorage.setItem("shopSettings", JSON.stringify(settings));
    showNotification("Settings saved successfully", "success");
  } catch (error) {
    console.error("Error saving settings:", error);
    showNotification("Error saving settings", "error");
  } finally {
    hideLoader();
  }
}

// ============================================
// Load All Data
// ============================================
function loadAllData() {
  // Wait for Firebase to be ready
  if (!db || !auth) {
    console.warn("Firebase not ready, retrying in 500ms...");
    setTimeout(loadAllData, 500);
    return;
  }

  populateProductCategories();
  switchTab("products");
}

// ============================================
// Utility Functions
// ============================================
function previewImage(event, imgId, previewId) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById(imgId).src = e.target.result;
      document.getElementById(previewId).style.display = "block";
    };
    reader.readAsDataURL(file);
  }
}

function previewImageURL(event, imgId, previewId) {
  const url = event.target.value.trim();
  if (url) {
    document.getElementById(imgId).src = url;
    document.getElementById(previewId).style.display = "block";
  } else {
    document.getElementById(previewId).style.display = "none";
  }
}

// ============================================
// Footwear Size Management
// ============================================
let sizesData = {}; // { productId: { sizes: [...] } }

async function manageSizes(productId) {
  try {
    showLoader();
    const productDoc = await db.collection(COLLECTIONS.products).doc(productId).get();
    const product = productDoc.data();

    // Only allow for footwear category
    if (product.category !== "Footwear") {
      showNotification("Size management is only for Footwear products", "error");
      hideLoader();
      return;
    }

    // Load or create size data
    const sizeDocRef = db.collection(COLLECTIONS.productSizes).doc(productId);
    const sizeDoc = await sizeDocRef.get();
    const currentSizes = sizeDoc.exists ? sizeDoc.data().sizes || [] : [];

    // Display size management modal
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "sizesModal";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>Manage Sizes: ${product.name}</h2>
          <button class="close-btn" onclick="document.getElementById('sizesModal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div id="sizesList" style="margin-bottom: 1.5rem;"></div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
            <h4>Add New Size</h4>
            <form id="addSizeForm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <label>Size</label>
                <input type="text" id="newSize" placeholder="e.g., 40" required>
              </div>
              <div>
                <label>Stock</label>
                <input type="number" id="newStock" placeholder="0" min="0" required>
              </div>
              <div style="grid-column: 1 / -1;">
                <button type="submit" class="btn btn-primary btn-block">Add Size</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add("active");

    // Display existing sizes
    const sizesList = modal.querySelector("#sizesList");
    if (currentSizes.length === 0) {
      sizesList.innerHTML = "<p style='text-align: center; color: var(--text-secondary);'>No sizes yet</p>";
    } else {
      sizesList.innerHTML = currentSizes.map((s, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius); margin-bottom: 0.5rem;">
          <div>
            <strong>Size ${s.size}</strong> - Stock: ${s.stock}
          </div>
          <button type="button" class="btn btn-danger btn-small" onclick="removeSize('${productId}', ${idx})">Remove</button>
        </div>
      `).join("");
    }

    // Handle add size form
    document.getElementById("addSizeForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      await addSize(productId, currentSizes);
    });

    hideLoader();
  } catch (error) {
    console.error("Error managing sizes:", error);
    showNotification("Error loading size management", "error");
    hideLoader();
  }
}

async function addSize(productId, currentSizes) {
  try {
    const newSize = document.getElementById("newSize").value.trim();
    const newStock = parseInt(document.getElementById("newStock").value);

    if (!newSize || isNaN(newStock)) {
      showNotification("Please fill in all fields", "error");
      return;
    }

    // Check for duplicate size
    if (currentSizes.some(s => s.size === newSize)) {
      showNotification("Size already exists for this product", "error");
      return;
    }

    currentSizes.push({ size: newSize, stock: newStock });

    await db.collection(COLLECTIONS.productSizes).doc(productId).set({
      productId,
      sizes: currentSizes,
      updatedAt: new Date()
    });

    showNotification(`Size ${newSize} added successfully`, "success");

    // Refresh modal
    const modal = document.getElementById("sizesModal");
    if (modal) modal.remove();
    manageSizes(productId);
  } catch (error) {
    console.error("Error adding size:", error);
    showNotification("Error adding size", "error");
  }
}

async function removeSize(productId, sizeIndex) {
  try {
    if (!confirm("Are you sure you want to delete this size?")) return;

    const sizeDoc = await db.collection(COLLECTIONS.productSizes).doc(productId).get();
    const sizes = sizeDoc.data().sizes || [];

    if (sizeIndex >= 0 && sizeIndex < sizes.length) {
      sizes.splice(sizeIndex, 1);

      if (sizes.length === 0) {
        await db.collection(COLLECTIONS.productSizes).doc(productId).delete();
      } else {
        await db.collection(COLLECTIONS.productSizes).doc(productId).set({
          productId,
          sizes: sizes,
          updatedAt: new Date()
        });
      }

      showNotification("Size deleted successfully", "success");

      // Refresh modal
      const modal = document.getElementById("sizesModal");
      if (modal) {
        modal.remove();
        manageSizes(productId);
      }
    }
  } catch (error) {
    console.error("Error removing size:", error);
    showNotification("Error deleting size", "error");
  }
}

// ============================================
// Orders Management
// ============================================
async function loadOrders() {
  const container = document.getElementById("ordersList");
  try {
    if (!db) {
      container.innerHTML = "<p style='text-align: center; color: red;'>Firebase not initialized</p>";
      return;
    }

    let query = db.collection(COLLECTIONS.orders || "orders");

    // Apply filters
    const statusFilter = document.getElementById("orderStatusFilter").value;
    const phoneFilter = document.getElementById("orderSearchPhone").value;

    if (statusFilter) {
      query = query.where("status", "==", statusFilter);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    if (snapshot.empty) {
      container.innerHTML = "<p style='text-align: center;'>No orders yet</p>";
      return;
    }

    container.innerHTML = "";
    let filteredCount = 0;

    snapshot.forEach((doc) => {
      const order = { id: doc.id, ...doc.data() };

      // Apply phone filter
      if (phoneFilter && !order.customer.phone.includes(phoneFilter)) {
        return;
      }

      filteredCount++;
      const item = createOrderItem(order);
      container.appendChild(item);
    });

    if (filteredCount === 0) {
      container.innerHTML = "<p style='text-align: center;'>No orders match your filters</p>";
    }
  } catch (error) {
    console.error("Error loading orders:", error);
    container.innerHTML = "<p style='text-align: center; color: red;'>Error loading orders</p>";
  }
}

function createOrderItem(order) {
  const item = document.createElement("div");
  item.className = "order-item card";
  item.style.marginBottom = "1rem";

  const timestamp = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleString()
    : new Date().toLocaleString();

  const statusColors = {
    pending: "#FF9800",
    confirmed: "#2196F3",
    shipped: "#9C27B0",
    delivered: "#4CAF50",
    cancelled: "#F44336"
  };

  const itemsList = order.items.map(item => `
    <li>${item.name} x${item.quantity}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''} - ₹${((item.offerPrice || item.price) * item.quantity).toLocaleString()}</li>
  `).join('');

  item.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; margin-bottom: 1rem;">
      <div>
        <h3>#${order.id.substring(0, 8).toUpperCase()}</h3>
        <p style="margin: 0.25rem 0; color: var(--text-secondary);">
          <strong>Customer:</strong> ${order.customer.name}
        </p>
        <p style="margin: 0.25rem 0; color: var(--text-secondary);">
          <strong>Phone:</strong> <a href="tel:${order.customer.phone}" style="color: var(--primary-blue);">${order.customer.phone}</a>
        </p>
        <p style="margin: 0.25rem 0; color: var(--text-secondary);">
          <strong>Delivery:</strong> ${order.customer.address}
        </p>
        <p style="margin: 0.25rem 0; color: var(--text-secondary);">
          <strong>Preferred Date:</strong> ${order.customer.preferredDeliveryDate || 'Not specified'}
        </p>
        ${order.customer.preferredPickupTime ? `<p style="margin: 0.25rem 0; color: var(--text-secondary);"><strong>Preferred Time:</strong> ${order.customer.preferredPickupTime}</p>` : ''}
      </div>
      <div style="text-align: right;">
        <span style="background: ${statusColors[order.status] || '#999'}; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 700; display: inline-block; text-transform: uppercase; font-size: 0.85rem;">
          ${order.status}
        </span>
        <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
          ${timestamp}
        </p>
      </div>
    </div>

    <div style="background: var(--bg-light); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
      <p style="margin: 0 0 0.5rem 0; font-weight: 700;">Items:</p>
      <ul style="margin: 0; padding-left: 1.5rem;">
        ${itemsList}
      </ul>
      <div style="margin-top: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; text-align: right; font-weight: 700; color: var(--primary-blue);">
        Total: ₹${order.totalAmount.toLocaleString()}
      </div>
      ${order.specialRequests || order.additionalNotes ? `<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); background: #fff8e1; padding: 0.75rem; border-radius: 4px;"><strong>📝 Notes:</strong> ${order.specialRequests || order.additionalNotes}</div>` : ''}
    </div>

    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <select id="status-${order.id}" value="${order.status}"
        style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; font-weight: 600;"
        onchange="updateOrderStatus('${order.id}', this.value)">
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <button class="btn btn-success btn-small" onclick="sendOrderWhatsAppMessage('${order.customer.phone}', '${order.id}')">
        <i class="fab fa-whatsapp"></i> Send WhatsApp
      </button>

      <button class="btn btn-secondary btn-small" onclick="viewOrderDetails('${order.id}')">
        View Details
      </button>

      <button class="btn btn-danger btn-small" onclick="deleteOrder('${order.id}')">
        Delete
      </button>
    </div>
  `;

  // Set the current value
  setTimeout(() => {
    const select = document.getElementById(`status-${order.id}`);
    if (select) {
      select.value = order.status;
    }
  }, 0);

  return item;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    showLoader();
    await db.collection(COLLECTIONS.orders || "orders").doc(orderId).update({
      status: newStatus,
      updatedAt: new Date()
    });
    showNotification("Order status updated!", "success");
    loadOrders();
  } catch (error) {
    console.error("Error updating order status:", error);
    showNotification("Error updating order status", "error");
  } finally {
    hideLoader();
  }
}

function sendOrderWhatsAppMessage(phone, orderId) {
  const message = `Order #${orderId.substring(0, 8).toUpperCase()} has been updated. Thank you for booking with us!`;
  const link = getWhatsAppLink(phone, message);
  window.open(link, "_blank");
}

function viewOrderDetails(orderId) {
  db.collection(COLLECTIONS.orders || "orders").doc(orderId).get().then(doc => {
    if (doc.exists) {
      const order = { id: doc.id, ...doc.data() };

      const itemsHTML = order.items.map(item => `
        <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
          <strong>${item.name}</strong><br>
          Quantity: ${item.quantity}${item.selectedSize ? ` | Size: ${item.selectedSize}` : ''}<br>
          Price: ₹${item.price} ${item.offerPrice ? `→ ₹${item.offerPrice}` : ''}<br>
          Subtotal: ₹${((item.offerPrice || item.price) * item.quantity).toLocaleString()}
        </div>
      `).join('');

      const timestamp = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date().toLocaleString();

      alert(`
ORDER DETAILS
═══════════════════════════
Order ID: ${order.id}
Date: ${timestamp}
Status: ${order.status}

CUSTOMER INFO
─────────────
Name: ${order.customer.name}
Phone: ${order.customer.phone}
Email: ${order.customer.email || 'Not provided'}
Address: ${order.customer.address}
Preferred Date: ${order.customer.preferredDeliveryDate}
Preferred Time: ${order.customer.preferredPickupTime || 'Not specified'}

ITEMS
─────────────
${order.items.map(item => `${item.name} × ${item.quantity}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}`).join('\n')}

TOTAL: ₹${order.totalAmount?.toLocaleString() || 0}

${order.specialRequests || order.additionalNotes ? `NOTES: ${order.specialRequests || order.additionalNotes}` : ''}
      });
    }
  }).catch(error => {
    console.error('Error loading order details:', error);
    alert('Error loading order details');
  });
}

async function deleteOrder(orderId) {
  if (!confirm("Are you sure you want to delete this order?")) return;

  try {
    showLoader();
    await db.collection(COLLECTIONS.orders || "orders").doc(orderId).delete();
    showNotification("Order deleted successfully", "success");
    loadOrders();
  } catch (error) {
    console.error("Error deleting order:", error);
    showNotification("Error deleting order", "error");
  } finally {
    hideLoader();
  }
}

function exportOrdersToCSV() {
  alert("Export to CSV feature can be implemented here");
  // Can integrate with a library like papa-parse to export CSV
}

// Close modals on outside click

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("active");
  }
});
