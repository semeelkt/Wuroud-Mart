/**
 * Review & Rating System
 * Handle product reviews and ratings
 */

let productReviews = {};

/**
 * Load reviews for a product from Firestore
 */
async function loadProductReviews(productId) {
  try {
    const snapshot = await db.collection(COLLECTIONS.reviews || "reviews")
      .where("productId", "==", productId)
      .orderBy("createdAt", "desc")
      .get();

    const reviews = [];
    let totalRating = 0;
    let ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    snapshot.forEach(doc => {
      const review = doc.data();
      reviews.push({
        id: doc.id,
        ...review
      });
      totalRating += review.rating;
      ratingCounts[review.rating]++;
    });

    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    productReviews[productId] = {
      reviews,
      averageRating: parseFloat(averageRating),
      reviewCount: reviews.length,
      ratingCounts,
      totalRating
    };

    return productReviews[productId];
  } catch (error) {
    console.error("Error loading reviews:", error);
    return {
      reviews: [],
      averageRating: 0,
      reviewCount: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      totalRating: 0
    };
  }
}

/**
 * Get product rating stats
 */
function getProductRatingStats(productId) {
  return productReviews[productId] || {
    reviews: [],
    averageRating: 0,
    reviewCount: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
}

/**
 * Display rating stars HTML
 */
function getRatingStarsHTML(rating, size = 'normal') {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - Math.ceil(rating);

  let html = '<div class="rating-stars">';
  for (let i = 0; i < fullStars; i++) {
    html += '<span class="rating-star">★</span>';
  }
  if (hasHalfStar) {
    html += '<span class="rating-star" style="opacity: 0.5;">★</span>';
  }
  for (let i = 0; i < emptyStars; i++) {
    html += '<span class="rating-star" style="opacity: 0.3;">★</span>';
  }
  html += '</div>';
  return html;
}

/**
 * Open review submission modal
 */
function openReviewModal(productId, productName) {
  const modal = document.getElementById("reviewModal") || createReviewModal();
  document.getElementById("reviewProductId").value = productId;
  document.getElementById("reviewProductName").textContent = productName;
  document.getElementById("reviewForm").reset();
  document.getElementById("ratingStars").innerHTML = '★★★★★';
  modal.classList.add("active");
}

/**
 * Create review modal
 */
function createReviewModal() {
  const modal = document.createElement("div");
  modal.id = "reviewModal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>⭐ Leave a Review</h2>
        <button class="close-btn" onclick="document.getElementById('reviewModal').classList.remove('active')">✕</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="reviewProductId">
        <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">
          Product: <strong id="reviewProductName"></strong>
        </p>

        <form id="reviewForm" onsubmit="submitReview(event)">
          <div class="form-group">
            <label>Your Rating</label>
            <div id="ratingStars" style="font-size: 2rem; cursor: pointer; display: flex; gap: 0.5rem;">
              ★★★★★
            </div>
            <input type="hidden" id="reviewRating" value="5" required>
          </div>

          <div class="form-group">
            <label for="reviewerName">Your Name *</label>
            <input type="text" id="reviewerName" required>
          </div>

          <div class="form-group">
            <label for="reviewerPhone">Phone Number *</label>
            <input type="tel" id="reviewerPhone" required>
          </div>

          <div class="form-group">
            <label for="reviewText">Your Review *</label>
            <textarea id="reviewText" required placeholder="Share your experience with this product..." style="min-height: 100px;"></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Submit Review</button>
        </form>
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove("active");
  };

  document.body.appendChild(modal);

  // Rating stars interaction
  const starsDiv = document.getElementById("ratingStars");
  const ratingInput = document.getElementById("reviewRating");

  starsDiv.addEventListener("click", (e) => {
    if (e.target.textContent === "★") {
      const stars = starsDiv.querySelectorAll("span");
      const index = Array.from(stars).indexOf(e.target);
      const rating = index + 1;
      ratingInput.value = rating;

      let newStars = "";
      for (let i = 0; i < 5; i++) {
        newStars += i < rating ? "★" : "☆";
      }
      starsDiv.textContent = newStars;
    }
  });

  starsDiv.addEventListener("mouseover", (e) => {
    if (e.target.textContent === "★" || e.target.textContent === "☆") {
      const stars = starsDiv.querySelectorAll("span");
      const index = Array.from(stars).indexOf(e.target);

      let preview = "";
      for (let i = 0; i < 5; i++) {
        preview += i <= index ? "★" : "☆";
      }
      starsDiv.textContent = preview;
    }
  });

  starsDiv.addEventListener("mouseleave", () => {
    const rating = parseInt(ratingInput.value) || 5;
    let starsText = "";
    for (let i = 0; i < 5; i++) {
      starsText += i < rating ? "★" : "☆";
    }
    starsDiv.textContent = starsText;
  });

  return modal;
}

/**
 * Submit review to Firestore
 */
async function submitReview(e) {
  e.preventDefault();

  const reviewData = {
    productId: document.getElementById("reviewProductId").value,
    customerName: document.getElementById("reviewerName").value,
    customerPhone: document.getElementById("reviewerPhone").value,
    rating: parseInt(document.getElementById("reviewRating").value),
    reviewText: document.getElementById("reviewText").value,
    createdAt: new Date(),
    helpful_count: 0
  };

  try {
    showLoader();
    await db.collection(COLLECTIONS.reviews || "reviews").add(reviewData);

    showNotification("Thank you for your review! ⭐", "success");
    document.getElementById("reviewModal").classList.remove("active");

    // Reload reviews if on product detail page
    const productId = reviewData.productId;
    await loadProductReviews(productId);
    if (window.displayProductReviews) {
      window.displayProductReviews(productId);
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    showNotification("Error submitting review. Please try again.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Display reviews on product detail page
 */
function displayProductReviews(productId) {
  const stats = getProductRatingStats(productId);
  const container = document.getElementById("productReviewsContainer");

  if (!container) return;

  if (stats.reviewCount === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">No reviews yet. Be the first to review!</p>
        <button class="btn btn-primary" onclick="openReviewModal('${productId}', '')">Write a Review</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <div style="display: flex; align-items: flex-start; gap: 2rem; margin-bottom: 2rem;">
        <div style="text-align: center;">
          <div style="font-size: 3rem; font-weight: bold; color: var(--primary-blue);">${stats.averageRating}</div>
          <div class="rating-stars" style="font-size: 1.5rem; justify-content: center;">
            ${getRatingStarsHTML(stats.averageRating)}
          </div>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">Based on ${stats.reviewCount} reviews</p>
        </div>

        <div style="flex: 1;">
          ${[5, 4, 3, 2, 1].map(rating => {
            const count = stats.ratingCounts[rating];
            const percentage = stats.reviewCount > 0 ? (count / stats.reviewCount * 100) : 0;
            return `
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 0.9rem; width: 30px;">${rating}★</span>
                <div style="flex: 1; height: 8px; background: var(--border-color); border-radius: 4px;overflow: hidden;">
                  <div style="width: ${percentage}%; height: 100%; background: var(--warning-yellow);"></div>
                </div>
                <span style="font-size: 0.85rem; color: var(--text-secondary); width: 40px;">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <button class="btn btn-primary" onclick="openReviewModal('${productId}', '')">Write a Review</button>
    </div>

    <div style="border-top: 1px solid var(--border-color); padding-top: 2rem;">
      <h3 style="margin-bottom: 1.5rem;">Customer Reviews</h3>
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        ${stats.reviews.slice(0, 5).map(review => `
          <div style="background: var(--bg-light); padding: 1.5rem; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <div>
                <p style="margin: 0; font-weight: 700; color: var(--text-primary);">${review.customerName}</p>
                <div class="rating-stars" style="font-size: 0.9rem;">
                  ${getRatingStarsHTML(review.rating)}
                </div>
              </div>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
                ${new Date(review.createdAt?.toDate?.() || review.createdAt).toLocaleDateString()}
              </p>
            </div>
            <p style="margin: 0.75rem 0 0 0; color: var(--text-primary);">
              ${review.reviewText}
            </p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
