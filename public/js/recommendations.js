/**
 * Product Recommendations Engine
 * Suggests similar products, best sellers, and personalized recommendations
 */

/**
 * Get similar products (same category, not current product)
 */
function getSimilarProducts(productId, category, limit = 4) {
  return allProducts
    .filter(p => p.category === category && p.id !== productId && p.stock > 0)
    .sort((a, b) => {
      const statsA = getProductRatingStats(a.id);
      const statsB = getProductRatingStats(b.id);
      return (statsB.averageRating || 0) - (statsA.averageRating || 0);
    })
    .slice(0, limit);
}

/**
 * Get best sellers (highest rated, most reviewed)
 */
function getBestSellers(limit = 8) {
  return allProducts
    .filter(p => p.stock > 0)
    .sort((a, b) => {
      const statsA = getProductRatingStats(a.id);
      const statsB = getProductRatingStats(b.id);

      // Sort by: review count (more reviews = more popular), then by rating
      if (statsA.reviewCount !== statsB.reviewCount) {
        return statsB.reviewCount - statsA.reviewCount;
      }
      return (statsB.averageRating || 0) - (statsA.averageRating || 0);
    })
    .slice(0, limit);
}

/**
 * Get top rated products
 */
function getTopRated(limit = 8) {
  return allProducts
    .filter(p => p.stock > 0)
    .filter(p => {
      const stats = getProductRatingStats(p.id);
      return stats.reviewCount >= 2; // Only products with at least 2 reviews
    })
    .sort((a, b) => {
      const statsA = getProductRatingStats(a.id);
      const statsB = getProductRatingStats(b.id);
      return (statsB.averageRating || 0) - (statsA.averageRating || 0);
    })
    .slice(0, limit);
}

/**
 * Get products you might like (based on wishlist)
 */
function getRecommendedForYou(limit = 8) {
  if (wishlist.length === 0) {
    return getBestSellers(limit);
  }

  // Get categories from wishlist
  const wishlistCategories = [...new Set(wishlist.map(item => {
    const product = allProducts.find(p => p.id === item.id);
    return product?.category;
  }))].filter(Boolean);

  // Get products from same categories, excluding wishlist items
  const recommended = allProducts
    .filter(p =>
      wishlistCategories.includes(p.category) &&
      !wishlist.find(w => w.id === p.id) &&
      p.stock > 0
    )
    .sort((a, b) => {
      const statsA = getProductRatingStats(a.id);
      const statsB = getProductRatingStats(b.id);
      return (statsB.averageRating || 0) - (statsA.averageRating || 0);
    })
    .slice(0, limit);

  // If not enough recommendations, fill with best sellers
  if (recommended.length < limit) {
    const bestSellers = getBestSellers(limit * 2);
    for (let product of bestSellers) {
      if (recommended.length >= limit) break;
      if (!recommended.find(p => p.id === product.id) &&
        !wishlist.find(w => w.id === product.id)) {
        recommended.push(product);
      }
    }
  }

  return recommended.slice(0, limit);
}

/**
 * Get trending/new products (based on created date)
 */
function getTrendingProducts(limit = 8) {
  return allProducts
    .filter(p => p.stock > 0)
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    })
    .slice(0, limit);
}

/**
 * Display product recommendations section
 */
function displayRecommendationsSection(sectionId, products, title) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  if (products.length === 0) {
    section.innerHTML = '';
    return;
  }

  let html = `
    <section style="padding: 2rem 0;">
      <div class="container">
        <h2 style="margin-bottom: 1.5rem;">
          <i class="fas fa-sparkles"></i> ${title}
        </h2>
        <div class="grid grid-4" id="${sectionId}-grid">
  `;

  products.forEach(product => {
    const card = createProductCard(product);
    html += card.outerHTML;
  });

  html += `
        </div>
      </div>
    </section>
  `;

  section.innerHTML = html;
  updateWishlistButtons();
}
