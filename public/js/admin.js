/**
 * Admin Panel Functionality
 */

let currentUser = null;
let editingProductId = null;
let editingOfferId = null;

// ============================================
// Initialize
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const firebaseReady = await initializeFirebase();
    if (firebaseReady) {
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
// Authentication
// ============================================
function checkAuthStatus() {
  if (auth && typeof auth.onAuthStateChanged === "function") {
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUser = user;
        showDashboard();
        loadAllData();
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

// Close modals on outside click
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("active");
  }
});
