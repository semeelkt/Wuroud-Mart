/**
 * Wishlist Management
 * Handle wishlist operations with Firestore
 */

let wishlist = [];
let currentPhone = null;

/**
 * Initialize wishlist from localStorage
 */
function initializeWishlist() {
  const stored = localStorage.getItem('wishlist');
  wishlist = stored ? JSON.parse(stored) : [];
}

/**
 * Save wishlist to localStorage
 */
function saveWishlist() {
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistBadge();
}

/**
 * Add to wishlist
 */
function addToWishlist(product) {
  if (!wishlist.find(item => item.id === product.id)) {
    wishlist.push({
      id: product.id,
      name: product.name,
      price: product.price,
      offerPrice: product.offerPrice,
      image: product.imageURL,
      category: product.category,
      addedAt: new Date().toISOString()
    });
    saveWishlist();
    showNotification(`${product.name} added to wishlist! ❤️`, "success");
    updateWishlistButtons();
  }
}

/**
 * Remove from wishlist
 */
function removeFromWishlist(productId) {
  wishlist = wishlist.filter(item => item.id !== productId);
  saveWishlist();
  showNotification("Removed from wishlist", "success");
  updateWishlistButtons();
}

/**
 * Toggle wishlist
 */
function toggleWishlist(product) {
  if (isInWishlist(product.id)) {
    removeFromWishlist(product.id);
  } else {
    addToWishlist(product);
  }
}

/**
 * Check if product is in wishlist
 */
function isInWishlist(productId) {
  return wishlist.some(item => item.id === productId);
}

/**
 * Get wishlist count
 */
function getWishlistCount() {
  return wishlist.length;
}

/**
 * Update wishlist badge in navbar
 */
function updateWishlistBadge() {
  const badge = document.getElementById('wishlistBadge');
  const count = getWishlistCount();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Update wishlist button states on page
 */
function updateWishlistButtons() {
  document.querySelectorAll('.btn-wishlist').forEach(btn => {
    const productId = btn.dataset.productId;
    if (isInWishlist(productId)) {
      btn.classList.add('active');
      btn.innerHTML = '❤️';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '🤍';
    }
  });

  updateWishlistBadge();
}

/**
 * View wishlist page
 */
function viewWishlist() {
  showWishlistModal();
}

/**
 * Show wishlished products modal
 */
function showWishlistModal() {
  const modal = document.getElementById("wishlistModal") || createWishlistModal();
  modal.classList.add("active");
  updateWishlistDisplay();
}

/**
 * Create wishlist modal
 */
function createWishlistModal() {
  const modal = document.createElement("div");
  modal.id = "wishlistModal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h2>❤️ My Wishlist</h2>
        <button class="close-btn" onclick="document.getElementById('wishlistModal').classList.remove('active')">✕</button>
      </div>
      <div class="modal-body">
        <div id="wishlistContent"></div>
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove("active");
  };

  document.body.appendChild(modal);
  return modal;
}

/**
 * Update wishlist display
 */
function updateWishlistDisplay() {
  const content = document.getElementById("wishlistContent");

  if (wishlist.length === 0) {
    content.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <p style="font-size: 3rem; margin-bottom: 1rem;">😢</p>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem;">Your wishlist is empty</p>
        <button class="btn btn-primary" onclick="document.getElementById('wishlistModal').classList.remove('active'); window.location.href='products.html'">
          Browse Products
        </button>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="grid grid-4">
      ${wishlist.map(item => `
        <div class="product-card">
          <div class="product-image-wrapper">
            <img src="${getImageUrl(item.image)}" alt="${item.name}" class="product-card-image"
              onerror="this.src='https://via.placeholder.com/250?text=No+Image'">
          </div>
          <div class="product-card-content">
            <p class="product-card-category">${item.category}</p>
            <h3 class="product-card-name">${item.name}</h3>
            <div class="product-price-wrapper">
              ${item.offerPrice ? `<div class="product-price-original">৳${item.price}</div>` : ''}
              <div class="product-price">৳${item.offerPrice || item.price}</div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: auto;">
              <button class="btn btn-success btn-small btn-block" onclick="addToCart({id: '${item.id}', name: '${item.name}', price: ${item.price}, offerPrice: ${item.offerPrice}, imageURL: '${item.image}'}); ">
                Add to Cart
              </button>
              <button class="btn btn-danger btn-small" onclick="removeFromWishlist('${item.id}'); updateWishlistDisplay();" style="width: 44px;">
                ✕
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initializeWishlist();
  updateWishlistBadge();
});
