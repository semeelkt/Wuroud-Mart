/**
 * Shopping Cart & Order Management
 * Handles simple cart operations and order placement
 */

let cart = [];
let STORED_PHONE = null;

/**
 * Initialize cart from localStorage
 */
function initializeCart() {
  const stored = localStorage.getItem('cart');
  cart = stored ? JSON.parse(stored) : [];
}

/**
 * Save cart to localStorage
 */
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

/**
 * Add product to cart
 */
function addToCart(product, quantity = 1) {
  quantity = parseInt(quantity) || 1;

  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
    showNotification(`Quantity increased to ${existingItem.quantity}`, "success");
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      offerPrice: product.offerPrice,
      image: product.imageURL,
      quantity: quantity,
      category: product.category
    });
    showNotification(`${product.name} added to cart!`, "success");
  }

  saveCart();
}

/**
 * Remove product from cart
 */
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  showNotification("Item removed from cart", "success");
}

/**
 * Update cart item quantity
 */
function updateCartQuantity(productId, quantity) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity = Math.max(1, parseInt(quantity) || 1);
    saveCart();
  }
}

/**
 * Get total cart price
 */
function getCartTotal() {
  return cart.reduce((total, item) => {
    const price = (item.offerPrice || item.price) || 0;
    return total + (price * item.quantity);
  }, 0);
}

/**
 * Get total items in cart
 */
function getCartCount() {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Update cart badge in navbar
 */
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  const count = getCartCount();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Open order form modal
 */
function openOrderForm() {
  if (cart.length === 0) {
    showNotification("Your cart is empty!", "error");
    return;
  }

  const modal = document.getElementById("orderFormModal") || createOrderFormModal();
  modal.classList.add("active");
  updateOrderSummary();
}

/**
 * Create order form modal
 */
function createOrderFormModal() {
  const modal = document.createElement("div");
  modal.id = "orderFormModal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>🛒 Complete Your Order</h2>
        <button class="close-btn" onclick="closeOrderForm()">✕</button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
          <!-- Order Form -->
          <div>
            <h3 style="margin-bottom: 1.5rem;">Customer Information</h3>
            <form id="orderForm" style="margin: 0;">
              <div class="form-group">
                <label for="orderName">Full Name *</label>
                <input type="text" id="orderName" required>
              </div>

              <div class="form-group">
                <label for="orderPhone">Phone Number *</label>
                <input type="tel" id="orderPhone" required placeholder="+880123456789">
              </div>

              <div class="form-group">
                <label for="orderEmail">Email (Optional)</label>
                <input type="email" id="orderEmail" placeholder="your@email.com">
              </div>

              <div class="form-group">
                <label for="orderAddress">Delivery Address *</label>
                <textarea id="orderAddress" required placeholder="Enter your full delivery address" style="min-height: 80px;"></textarea>
              </div>

              <div class="form-group">
                <label for="deliveryDate">Preferred Delivery Date *</label>
                <input type="date" id="deliveryDate" required>
              </div>

              <div class="form-group">
                <label for="orderNotes">Special Requests (Optional)</label>
                <textarea id="orderNotes" placeholder="Any special requests or instructions..." style="min-height: 60px;"></textarea>
              </div>

              <button type="submit" class="btn btn-success btn-block" style="margin-top: 1.5rem; padding: 1rem;">
                ✅ Place Order
              </button>
            </form>
          </div>

          <!-- Order Summary -->
          <div>
            <h3 style="margin-bottom: 1.5rem;">Order Summary</h3>
            <div style="background: var(--bg-light); padding: 1.5rem; border-radius: 8px; max-height: 400px; overflow-y: auto;">
              <div id="orderItems"></div>
              <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span>Subtotal:</span>
                  <span id="subtotal">৳0</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.25rem; color: var(--primary-blue);">
                  <span>Total:</span>
                  <span id="totalAmount">৳0</span>
                </div>
              </div>
            </div>
            <div style="background: var(--bg-light); padding: 1rem; margin-top: 1rem; border-radius: 8px; border-left: 4px solid var(--warning-yellow);">
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
                <strong>📦 Booking Notice:</strong> This is a pre-order. You'll receive confirmation via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) closeOrderForm();
  };

  document.body.appendChild(modal);

  document.getElementById("orderForm").addEventListener("submit", submitOrder);

  // Set minimum delivery date to tomorrow
  const deliveryInput = document.getElementById("deliveryDate");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  deliveryInput.min = tomorrow.toISOString().split('T')[0];

  return modal;
}

/**
 * Update order summary in modal
 */
function updateOrderSummary() {
  const itemsContainer = document.getElementById("orderItems");
  itemsContainer.innerHTML = cart.map(item => `
    <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <p style="margin: 0; font-weight: 600;">${item.name}</p>
        <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
          Qty: ${item.quantity}
        </p>
      </div>
      <p style="margin: 0; font-weight: 600; color: var(--primary-blue);">
        ৳${((item.offerPrice || item.price) * item.quantity).toLocaleString()}
      </p>
    </div>
  `).join("");

  const total = getCartTotal();
  document.getElementById("subtotal").textContent = `৳${total.toLocaleString()}`;
  document.getElementById("totalAmount").textContent = `৳${total.toLocaleString()}`;
}

/**
 * Submit order
 */
async function submitOrder(e) {
  e.preventDefault();

  const orderData = {
    items: cart.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      offerPrice: item.offerPrice,
      quantity: item.quantity
    })),
    customer: {
      name: document.getElementById("orderName").value,
      phone: document.getElementById("orderPhone").value,
      email: document.getElementById("orderEmail").value || null,
      address: document.getElementById("orderAddress").value,
      preferredDeliveryDate: document.getElementById("deliveryDate").value
    },
    totalAmount: getCartTotal(),
    specialRequests: document.getElementById("orderNotes").value || null,
    status: "pending",
    createdAt: new Date(),
    notes: ""
  };

  try {
    showLoader();
    STORED_PHONE = orderData.customer.phone;
    localStorage.setItem('lastPhoneForOrders', STORED_PHONE);

    // Save order to Firestore
    const orderRef = await db.collection(COLLECTIONS.orders || "orders").add(orderData);

    showNotification(
      "✅ Order placed successfully! Our team will contact you soon.",
      "success"
    );

    // Send WhatsApp confirmation
    const message = `Thank you for your order! Your Order ID is: ${orderRef.id}. We'll confirm your delivery details via WhatsApp.`;
    const whatsappLink = getWhatsAppLink(orderData.customer.phone, message);
    window.open(whatsappLink, "_blank");

    // Clear cart
    cart = [];
    saveCart();

    // Close modal
    closeOrderForm();

    // Optionally show success page or redirect
    setTimeout(() => {
      window.location.href = 'products.html';
    }, 2000);
  } catch (error) {
    console.error("Error placing order:", error);
    showNotification("Error placing order. Please try again.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Close order form modal
 */
function closeOrderForm() {
  const modal = document.getElementById("orderFormModal");
  if (modal) modal.classList.remove("active");
}

/**
 * Clear entire cart
 */
function clearCart() {
  if (confirm("Are you sure you want to clear your cart?")) {
    cart = [];
    saveCart();
    showNotification("Cart cleared", "success");
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initializeCart();
  updateCartBadge();
});
