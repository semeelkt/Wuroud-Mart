/**
 * Products Listing Page Functionality
 */

let allProducts = [];
let filteredProducts = [];

// ============================================
// Initialize
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const firebaseReady = await initializeFirebase();
    if (firebaseReady) {
      setupNavigationMenu();
      await loadAllProducts();
      setupFilters();
      displayProducts(allProducts);
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
// Load All Products
// ============================================
async function loadAllProducts() {
  try {
    showLoader();
    const snapshot = await db.collection(COLLECTIONS.products).get();

    allProducts = [];
    snapshot.forEach((doc) => {
      allProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Load product sizes for footwear items
    await loadProductSizes();

    // Populate category filter
    populateCategoryFilter();
    filteredProducts = [...allProducts];
    hideLoader();
  } catch (error) {
    console.error("Error loading products:", error);
    showNotification("Error loading products. Please refresh the page.", "error");
    hideLoader();
  }
}

// ============================================
// Load Product Sizes (for footwear)
// ============================================
let productSizes = {}; // Cache: { productId: [{ size, stock, images }] }

async function loadProductSizes() {
  try {
    const snapshot = await db.collection(COLLECTIONS.productSizes || "productSizes").get();
    snapshot.forEach((doc) => {
      const data = doc.data();
      productSizes[data.productId] = data.sizes || [];
    });
    console.log("Product sizes loaded:", productSizes);
  } catch (error) {
    console.warn("Error loading product sizes:", error);
    productSizes = {};
  }
}

// ============================================
// Filter Setup
// ============================================
function setupFilters() {
  const searchBox = document.getElementById("searchBox");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortBy = document.getElementById("sortBy");

  if (searchBox) {
    searchBox.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      filterAndSort(query, categoryFilter.value, sortBy.value);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      const query = searchBox.value.toLowerCase();
      filterAndSort(query, e.target.value, sortBy.value);
    });
  }

  if (sortBy) {
    sortBy.addEventListener("change", (e) => {
      const query = searchBox.value.toLowerCase();
      filterAndSort(query, categoryFilter.value, e.target.value);
    });
  }
}

function populateCategoryFilter() {
  const categories = [...new Set(allProducts.map((p) => p.category))];
  const categoryFilter = document.getElementById("categoryFilter");

  categories.forEach((category) => {
    if (category) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    }
  });
}

function filterAndSort(searchQuery, category, sortOption) {
  // Filter by search
  filteredProducts = allProducts.filter((product) => {
    const matchSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery) ||
      product.description?.toLowerCase().includes(searchQuery);

    const matchCategory = !category || product.category === category;

    return matchSearch && matchCategory;
  });

  // Sort
  switch (sortOption) {
    case "price-low":
      filteredProducts.sort((a, b) => {
        const priceA = (a.isOfferProduct && a.offerPrice) ? a.offerPrice : (a.price || 0);
        const priceB = (b.isOfferProduct && b.offerPrice) ? b.offerPrice : (b.price || 0);
        return priceA - priceB;
      });
      break;
    case "price-high":
      filteredProducts.sort((a, b) => {
        const priceA = (a.isOfferProduct && a.offerPrice) ? a.offerPrice : (a.price || 0);
        const priceB = (b.isOfferProduct && b.offerPrice) ? b.offerPrice : (b.price || 0);
        return priceB - priceA;
      });
      break;
    case "name":
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "newest":
    default:
      filteredProducts.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
  }

  displayProducts(filteredProducts);
}

function clearFilters() {
  document.getElementById("searchBox").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("sortBy").value = "newest";
  filteredProducts = [...allProducts];
  displayProducts(filteredProducts);
}

// ============================================
// Display Products
// ============================================
function displayProducts(products) {
  const container = document.getElementById("productsContainer");
  const noResults = document.getElementById("noResults");

  if (products.length === 0) {
    container.innerHTML = "";
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";
  container.innerHTML = "";

  products.forEach((product) => {
    const card = createProductCard(product);
    container.appendChild(card);
  });
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  const stockBadge = product.stock > 0
    ? `<span class="badge badge-success">In Stock</span>`
    : `<span class="badge badge-danger">Out of Stock</span>`;

  const offerBadge = (product.isOfferProduct && product.offerPrice)
    ? `<div class="badge-offer">Save ${Math.round(((product.price - product.offerPrice) / product.price * 100))}%</div>`
    : "";

  // Get rating stats
  const ratingStats = getProductRatingStats(product.id);
  const ratingHTML = ratingStats.reviewCount > 0
    ? `
      <div class="product-rating">
        <div class="rating-stars">
          ${getRatingStarsHTML(ratingStats.averageRating)}
        </div>
        <span class="rating-count">(${ratingStats.reviewCount})</span>
      </div>
    `
    : `<div class="product-rating"><span class="rating-count">No reviews</span></div>`;

  // Display price with offer support
  let priceHTML;
  if (product.price === null || product.price === undefined) {
    priceHTML = `<div class="product-price" style="color: var(--primary-blue);">Contact Price</div>`;
  } else if (product.isOfferProduct && product.offerPrice) {
    // Show original price crossed out and offer price
    priceHTML = `
      <div class="product-price-wrapper">
        <div class="product-price-original">${formatCurrency(product.price)}</div>
        <div class="product-price">${formatCurrency(product.offerPrice)}</div>
      </div>
    `;
  } else {
    priceHTML = `<div class="product-price">${formatCurrency(product.price)}</div>`;
  }

  const inWishlist = isInWishlist(product.id);

  card.innerHTML = `
    <div class="product-image-wrapper">
      ${offerBadge}
      <img src="${getImageUrl(product.imageURL)}"
           alt="${product.name}"
           class="product-card-image"
           loading="lazy"
           onerror="this.src='https://via.placeholder.com/280?text=No+Image'">
    </div>
    <div class="product-card-content">
      <p class="product-card-category">${product.category}</p>
      <h3 class="product-card-name">${product.name}</h3>
      ${ratingHTML}
      ${priceHTML}
      <div class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
        ${product.stock > 0 ? `✓ ${product.stock} in stock` : '✕ Out of stock'}
      </div>
      <div class="product-card-actions">
        <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart({id: '${product.id}', name: '${product.name}', price: ${product.price}, offerPrice: ${product.offerPrice || 'null'}, imageURL: '${product.imageURL}'})" ${product.stock === 0 ? 'disabled' : ''}>
          🛒 Add to Cart
        </button>
        <button class="btn-buy-now" onclick="event.stopPropagation(); addToCart({id: '${product.id}', name: '${product.name}', price: ${product.price}, offerPrice: ${product.offerPrice || 'null'}, imageURL: '${product.imageURL}'}); openOrderForm();" ${product.stock === 0 ? 'disabled' : ''}>
          🛍️ Buy Now
        </button>
        <button class="btn-wishlist ${inWishlist ? 'active' : ''}" data-product-id="${product.id}" onclick="event.stopPropagation(); toggleWishlist({id: '${product.id}', name: '${product.name}', price: ${product.price}, offerPrice: ${product.offerPrice || 'null'}, imageURL: '${product.imageURL}', category: '${product.category}'}); updateWishlistButtons();">
          ${inWishlist ? '❤️' : '🤍'}
        </button>
      </div>
      <button class="btn btn-outline btn-small btn-block" onclick="event.stopPropagation(); viewProductDetails({...this.parentElement.data, id: '${product.id}'})">
        View Details
      </button>
    </div>
  `;

  card.data = product;
  return card;
}

// ============================================
// Product Details Modal
// ============================================
function viewProductDetails(product) {
  const modal = document.getElementById("productModal") || createProductModal();
  const content = modal.querySelector(".modal-content");

  // Get sizes for footwear products
  const sizes = product.category === "Footwear" ? (productSizes[product.id] || []) : [];

  let sizesHTML = "";
  if (sizes.length > 0) {
    sizesHTML = `
      <h4 style="margin-top: 1.5rem;">Available Sizes</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 0.5rem; margin: 1rem 0;">
        ${sizes.map(s => `
          <div style="padding: 0.75rem; border: 2px solid var(--border-color); border-radius: var(--radius); text-align: center; cursor: pointer; transition: all 0.2s;"
               onclick="selectSize('${product.id}', '${s.size}')"
               class="size-option">
            <strong>${s.size}</strong>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0.25rem 0;">Stock: ${s.stock}</p>
          </div>
        `).join("")}
      </div>
    `;
  }

  // Display price with offer support
  let priceDisplay;
  if (product.isOfferProduct && product.offerPrice) {
    priceDisplay = `
      <div class="price-wrapper">
        <div class="price-original">${formatCurrency(product.price)}</div>
        <div class="price-offer">${formatCurrency(product.offerPrice)}</div>
        <span class="price-offer-badge">🎁 Special Offer</span>
      </div>
    `;
  } else {
    priceDisplay = `<h3 class="product-card-price">${formatCurrency(product.price)}</h3>`;
  }

  content.innerHTML = `
    <div class="modal-header">
      <h2>${product.name}</h2>
      <button class="close-btn" onclick="closeProductModal()">✕</button>
    </div>
    <div class="modal-body">
      <img src="${getImageUrl(product.imageURL)}"
           alt="${product.name}"
           style="width: 100%; max-height: 400px; object-fit: cover; border-radius: var(--radius); margin-bottom: 1rem;"
           onerror="this.src='https://via.placeholder.com/400?text=No+Image'">

      <div class="flex-between mb-2">
        <div>
          <p class="text-secondary">${product.category}</p>
          ${priceDisplay}
        </div>
        ${product.stock > 0
          ? `<span class="badge badge-success">In Stock</span>`
          : `<span class="badge badge-danger">Out of Stock</span>`}
      </div>

      <h4 style="margin-top: 1.5rem;">Description</h4>
      <p>${product.description || "No description available"}</p>

      ${sizesHTML}

      ${product.stock > 0
        ? `<div style="background: var(--bg-light); padding: 1rem; border-radius: var(--radius); margin: 1.5rem 0; font-size: 0.875rem;">
          <strong>Stock Available:</strong> ${product.stock} units
        </div>`
        : ""}

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

function selectSize(productId, size) {
  // Handle size selection - can be expanded to add to cart or make inquiry with size
  console.log(`Selected size ${size} for product ${productId}`);
  showNotification(`Size ${size} selected`, "info");
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
function sendInquiryViaWhatsApp(productName) {
  const message = `Hello, I am interested in ${productName}`;
  const link = getWhatsAppLink(SHOP_CONFIG.whatsAppNumber, message);
  window.open(link, "_blank");
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
      viewed: false,
      type: "product_inquiry"
    });
    showNotification("Thank you! Your inquiry has been submitted.", "success");
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    showNotification("Error submitting inquiry. Please try again.", "error");
  } finally {
    hideLoader();
  }
}
