/**
 * User Authentication Module
 * Handles user signup, login, logout, and account management
 */

let currentUserData = null;

/**
 * Initialize auth listeners
 */
function initAuthListeners() {
  if (!auth) return;

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0]
      };
      updateUIForLoggedInUser();
    } else {
      currentUserData = null;
      updateUIForLoggedOutUser();
    }
  });
}

/**
 * Sign up new user
 */
async function signupUser(email, password, displayName = '') {
  try {
    showLoader();

    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Create user account
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Update profile with display name
    if (displayName) {
      await user.updateProfile({ displayName });
    }

    // Store user data in Firestore
    await db.collection('users').doc(user.uid).set({
      email: email,
      displayName: displayName || email.split('@')[0],
      createdAt: new Date(),
      phone: '',
      address: ''
    });

    showNotification('Account created successfully!', 'success');
    hideLoader();

    return user;
  } catch (error) {
    hideLoader();
    showNotification(error.message || 'Signup failed', 'error');
    throw error;
  }
}

/**
 * Login user
 */
async function loginUser(email, password) {
  try {
    showLoader();

    const userCredential = await auth.signInWithEmailAndPassword(email, password);

    showNotification('Login successful!', 'success');
    hideLoader();

    return userCredential.user;
  } catch (error) {
    hideLoader();
    showNotification(error.message || 'Login failed', 'error');
    throw error;
  }
}

/**
 * Logout user
 */
async function logoutUser() {
  try {
    await auth.signOut();
    currentUserData = null;
    showNotification('Logged out successfully', 'success');
    window.location.href = 'index.html';
  } catch (error) {
    showNotification(error.message || 'Logout failed', 'error');
  }
}

/**
 * Check if user is logged in
 */
function isUserLoggedIn() {
  return currentUserData !== null && auth.currentUser !== null;
}

/**
 * Check if current user is admin
 */
async function isUserAdmin() {
  if (!auth.currentUser) return false;

  try {
    const adminDoc = await db.collection('admins').doc(auth.currentUser.uid).get();
    return adminDoc.exists;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get current user
 */
function getCurrentUser() {
  return currentUserData;
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

/**
 * Update user profile
 */
async function updateUserProfile(userData) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    showLoader();

    // Update profile
    if (userData.displayName) {
      await user.updateProfile({ displayName: userData.displayName });
    }

    // Update Firestore
    await db.collection('users').doc(user.uid).update({
      displayName: userData.displayName || user.displayName,
      phone: userData.phone || '',
      address: userData.address || '',
      updatedAt: new Date()
    });

    // Update local data
    currentUserData = {
      ...currentUserData,
      displayName: userData.displayName || user.displayName,
      phone: userData.phone,
      address: userData.address
    };

    showNotification('Profile updated successfully', 'success');
    hideLoader();
  } catch (error) {
    hideLoader();
    showNotification(error.message || 'Profile update failed', 'error');
    throw error;
  }
}

/**
 * Update UI for logged in user
 */
function updateUIForLoggedInUser() {
  const myAccountBtn = document.getElementById('myAccountBtn');
  const myOrdersBtn = document.getElementById('myOrdersBtn');

  if (myAccountBtn) {
    myAccountBtn.style.display = 'flex';
    myAccountBtn.innerHTML = `<i class="fas fa-user-circle"></i> <span>${currentUserData.displayName}</span>`;
  }

  if (myOrdersBtn) {
    myOrdersBtn.style.display = 'flex';
  }

  // Hide auth link if present
  const authLink = document.getElementById('authLink');
  if (authLink) {
    authLink.style.display = 'none';
  }
}

/**
 * Update UI for logged out user
 */
function updateUIForLoggedOutUser() {
  const myAccountBtn = document.getElementById('myAccountBtn');
  const myOrdersBtn = document.getElementById('myOrdersBtn');

  if (myAccountBtn) {
    myAccountBtn.style.display = 'none';
  }

  if (myOrdersBtn) {
    myOrdersBtn.style.display = 'none';
  }

  // Show auth link
  const authLink = document.getElementById('authLink');
  if (authLink) {
    authLink.style.display = 'flex';
  }
}

/**
 * Get user orders
 */
async function getUserOrders() {
  try {
    if (!isUserLoggedIn()) {
      return [];
    }

    const userId = getCurrentUserId();
    const ordersRef = db.collection('orders').where('userId', '==', userId);
    const snapshot = await ordersRef.get();

    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    return orders.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt : new Date(0);
      const dateB = b.createdAt ? b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt : new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

/**
 * Initialize auth on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initializeFirebase === 'function') {
    initializeFirebase().then(() => {
      initAuthListeners();
    });
  }
});
