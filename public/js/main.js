/**
 * Homepage Functionality
 */

// ============================================
// Initialize
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const firebaseReady = await initializeFirebase();
    if (firebaseReady) {
      setupNavigationMenu();
      loadOffers();
      loadFeaturedProducts();
      setupInquiryForm();
    }
  } catch (error) {
    console.error("Initialization error:", error);
  }
});

// ============================================
// Navigation Menu
// ============================================
function setupNavigationMenu() {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 640) {
      navMenu.classList.remove("active");
    }
  });
}

function closeMenu() {
  const navMenu = document.getElementById("navMenu");
  if (window.innerWidth < 640) {
    navMenu.classList.remove("active");
  }
}

// ============================================
// Language Switcher - REMOVED (Feature removed)
// ============================================
// Multi-language support has been disabled

// ============================================
// Load Offers Section
// ============================================
async function loadOffers() {
  const offersContainer = document.getElementById("offersContainer");

  try {
    showLoader();
    const snapshot = await db.collection(COLLECTIONS.offers).limit(3).get();

    if (snapshot.empty) {
      offersContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
          <p style="color: var(--text-secondary);">No offers available right now</p>
        </div>
      `;
      hideLoader();
      return;
    }

    offersContainer.innerHTML = "";
    snapshot.forEach((doc) => {
      const offer = doc.data();
      const card = createOfferCard(offer);
      offersContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading offers:", error);
    offersContainer.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
        <p style="color: var(--text-secondary);">Error loading offers</p>
      </div>
    `;
  } finally {
    hideLoader();
  }
}

function createOfferCard(offer) {
  const card = document.createElement("div");
  card.className = "card product-card fade-in";
  card.innerHTML = `
    <img src="${getImageUrl(offer.imageURL || 'offers/default.jpg')}"
         alt="${offer.title}"
         class="product-card-image"
         loading="lazy">
    <div class="product-card-content">
      <h3 class="product-card-name">${offer.title}</h3>
      <p style="color: var(--text-secondary); font-size: 0.875rem;">${offer.description}</p>
      <div class="flex-between mt-2">
        <span class="badge badge-success">${offer.discount || '0'}% OFF</span>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">
          Valid: ${new Date(offer.validUntil).toLocaleDateString()}
        </span>
      </div>
    </div>
  `;
  return card;
}

// ============================================
// Load Featured Products
// ============================================
async function loadFeaturedProducts() {
  const container = document.getElementById("featuredProducts");

  try {
    const snapshot = await db
      .collection(COLLECTIONS.products)
      .limit(6)
      .get();

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
          <p style="color: var(--text-secondary);">No products available</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    snapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      const card = createProductCard(product, true);
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading featured products:", error);
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
        <p style="color: var(--text-secondary);">Error loading products</p>
      </div>
    `;
  }
}

function createProductCard(product, isFeatured = false) {
  const card = document.createElement("div");
  card.className = "card product-card fade-in";
  card.onclick = () => viewProductDetails(product);

  const stockBadge = product.stock > 0
    ? `<span class="badge badge-success">${t("inStock")}</span>`
    : `<span class="badge badge-danger">${t("outOfStock")}</span>`;

  const price = product.price
    ? formatCurrency(product.price)
    : `<span style="color: var(--accent-color); font-weight: 700;">${t("contactForPrice")}</span>`;

  card.innerHTML = `
    <img src="${getImageUrl(product.imageURL)}"
         alt="${product.name}"
         class="product-card-image"
         loading="lazy">
    <div class="product-card-content">
      <p class="product-card-category">${product.category}</p>
      <h3 class="product-card-name">${product.name}</h3>
      <div class="product-card-price">${price}</div>
      <div class="flex-between">
        ${stockBadge}
        <span style="font-size: 0.875rem; color: var(--text-secondary);">👁️ Quick view</span>
      </div>
    </div>
  `;
  return card;
}

// ============================================
// Product Details Modal
// ============================================
function viewProductDetails(product) {
  const modal = document.getElementById("productModal") || createProductModal();

  const content = modal.querySelector(".modal-content");
  content.innerHTML = `
    <div class="modal-header">
      <h2>${product.name}</h2>
      <button class="close-btn" onclick="closeProductModal()">✕</button>
    </div>
    <div class="modal-body">
      <img src="${getImageUrl(product.imageURL)}"
           alt="${product.name}"
           style="width: 100%; max-height: 300px; object-fit: cover; border-radius: var(--radius); margin-bottom: 1rem;">

      <div class="flex-between mb-2">
        <div>
          <p class="text-secondary">${product.category}</p>
          <h3 class="product-card-price">${formatCurrency(product.price)}</h3>
        </div>
        ${product.stock > 0
          ? `<span class="badge badge-success">${t("inStock")}</span>`
          : `<span class="badge badge-danger">${t("outOfStock")}</span>`}
      </div>

      <h4 style="margin-top: 1.5rem;">Description</h4>
      <p>${product.description || "No description available"}</p>

      <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-direction: column;">
        <button class="btn btn-success btn-block" onclick="sendInquiryViaWhatsApp('${product.name.replace(/'/g, "\\'")}')">
          💬 Send Inquiry via WhatsApp
        </button>
        <button class="btn btn-outline btn-block" onclick="openAskForProductForm('${product.name.replace(/'/g, "\\'")}', '${product.id}')">
          📝 Ask for Product
        </button>
      </div>
    </div>
  `;

  modal.classList.add("active");
}

function createProductModal() {
  const modal = document.createElement("div");
  modal.id = "productModal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content"></div>
  `;
  modal.onclick = (e) => {
    if (e.target === modal) closeProductModal();
  };
  document.body.appendChild(modal);
  return modal;
}

function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) modal.classList.remove("active");
}

// ============================================
// WhatsApp Integration
// ============================================
function contactViaWhatsApp() {
  const message = `${t("helloInterested")} your products`;
  openWhatsApp(SHOP_CONFIG.whatsAppNumber, null, message);
}

function sendInquiryViaWhatsApp(productName) {
  const message = `${t("helloInterested")} ${productName}`;
  openWhatsApp(SHOP_CONFIG.whatsAppNumber, null, message);
  closeProductModal();
}

// ============================================
// Ask for Product Form
// ============================================
function openAskForProductForm(productName, productId) {
  const form = document.createElement("div");
  form.className = "modal";
  form.id = "askProductModal";
  form.innerHTML = `
    <div class="modal-content fade-in">
      <div class="modal-header">
        <h2>Ask for ${productName}</h2>
        <button class="close-btn" onclick="document.getElementById('askProductModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <form id="askProductForm" style="margin: 0;">
          <div class="form-group">
            <label for="askName">Your Name</label>
            <input type="text" id="askName" required>
          </div>
          <div class="form-group">
            <label for="askPhone">Phone Number</label>
            <input type="tel" id="askPhone" required>
          </div>
          <div class="form-group">
            <label for="askMessage">Message (Optional)</label>
            <textarea id="askMessage" placeholder="Tell us what you need..." style="min-height: 80px;"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Submit</button>
        </form>
      </div>
    </div>
  `;

  form.onclick = (e) => {
    if (e.target === form) form.remove();
  };

  document.body.appendChild(form);

  document.getElementById("askProductForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitProductInquiry(productName, productId, {
      name: document.getElementById("askName").value,
      phone: document.getElementById("askPhone").value,
      message: document.getElementById("askMessage").value
    });
    form.remove();
  });
}

async function submitProductInquiry(productName, productId, data) {
  try {
    showLoader();
    await db.collection(COLLECTIONS.inquiries).add({
      productName,
      productId,
      userName: data.name,
      userPhone: data.phone,
      message: data.message,
      timestamp: new Date(),
      viewed: false
    });
    showNotification(t("inquirySubmitted"), "success");
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    showNotification("Error submitting inquiry. Please try again.", "error");
  } finally {
    hideLoader();
  }
}

// ============================================
// Inquiry Form
// ============================================
function setupInquiryForm() {
  const form = document.getElementById("inquiryForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitGeneralInquiry();
    });
  }
}

async function submitGeneralInquiry() {
  try {
    showLoader();
    const name = document.getElementById("contactName").value;
    const phone = document.getElementById("contactPhone").value;
    const message = document.getElementById("contactMessage").value;

    if (!validatePhone(phone)) {
      showNotification("Please enter a valid 10-digit phone number", "error");
      hideLoader();
      return;
    }

    await db.collection(COLLECTIONS.inquiries).add({
      userName: name,
      userPhone: phone,
      message: message,
      timestamp: new Date(),
      viewed: false,
      type: "general_inquiry"
    });

    showNotification(t("inquirySubmitted"), "success");
    document.getElementById("inquiryForm").reset();
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    showNotification("Error submitting inquiry. Please try again.", "error");
  } finally {
    hideLoader();
  }
}
