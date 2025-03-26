// API Configuration and State
const API_URL = 'http://localhost:3000';
let coffees = [], reviews = [], categories = [], cart = [];
let isAdminMode = false;
const ADMIN_PASSWORD = 'admin123'; // Password for admin access

// Load data and setup on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load data and initialize UI
    [coffees, reviews, categories] = await Promise.all([
      fetch(`${API_URL}/coffees`).then(r => r.json()),
      fetch(`${API_URL}/reviews`).then(r => r.json()),
      fetch(`${API_URL}/categories`).then(r => r.json())
    ]);
    
    updateCategoryOptions();
    renderCoffeeMenu();
    setupEventListeners();
    initTheme();
  } catch (error) {
    showNotification(`Failed to load data: ${error.message}`, 'error');
  }
});

// Initialize theme based on user preference
function initTheme() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
}

// Toggle dark/light mode
function toggleTheme() {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

// Setup all event listeners
function setupEventListeners() {
  // Search and filter
  document.getElementById('search')?.addEventListener('input', filterCoffees);
  document.getElementById('category-filter')?.addEventListener('change', filterCoffees);
  
  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  // Coffee menu delegation
  document.getElementById('coffee-menu')?.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const coffeeId = btn.dataset.id;
    if (btn.classList.contains('add-to-cart')) addToCart(coffeeId);
    else if (btn.classList.contains('view-reviews')) showReviews(coffeeId);
    else if (btn.classList.contains('add-review')) openModal('review-form-modal', () => {
      document.getElementById('review-coffee-id').value = coffeeId;
      document.getElementById('review-form').reset();
      document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    });
    else if (btn.classList.contains('edit-coffee') && isAdminMode) editCoffee(coffeeId);
    else if (btn.classList.contains('delete-coffee') && isAdminMode) deleteCoffee(coffeeId);
  });
  
  // Reviews modal delegation for delete buttons
  document.getElementById('reviews-list')?.addEventListener('click', e => {
    const btn = e.target.closest('.delete-review');
    if (btn && isAdminMode) deleteReview(btn.dataset.id);
  });
  
  // Modal close buttons
  document.querySelectorAll('.close').forEach(btn => 
    btn.addEventListener('click', () => 
      document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))
    )
  );

  // Form submissions
  document.getElementById('review-form')?.addEventListener('submit', submitReview);
  document.getElementById('add-coffee-form')?.addEventListener('submit', handleAddCoffee);
  document.getElementById('edit-coffee-form')?.addEventListener('submit', handleEditCoffee);
  document.getElementById('admin-check-form')?.addEventListener('submit', handleAdminCheck);
  document.getElementById('checkout-form')?.addEventListener('submit', handleCheckout);
  
  // Cart functionality
  document.getElementById('cart-btn')?.addEventListener('click', openCartModal);
  document.getElementById('clear-cart-btn')?.addEventListener('click', clearCart);
  
  // Cart item quantity buttons delegation
  document.getElementById('cart-items')?.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const itemId = btn.dataset.id;
    if (btn.classList.contains('increase-quantity')) updateCartItemQuantity(itemId, 1);
    else if (btn.classList.contains('decrease-quantity')) updateCartItemQuantity(itemId, -1);
    else if (btn.classList.contains('remove-item')) removeCartItem(itemId);
  });
  
  // Admin and add coffee buttons
  document.getElementById('admin-btn')?.addEventListener('click', () => 
    isAdminMode ? exitAdminMode() : openModal('admin-check-modal', () => {
      document.getElementById('admin-password').value = '';
      document.getElementById('admin-password').focus();
    })
  );
  
  document.getElementById('add-coffee-nav-btn')?.addEventListener('click', () => 
    openModal('add-coffee-modal')
  );
  
  // Rating stars
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.rating);
      document.getElementById('review-rating').value = rating;
      document.querySelectorAll('.star').forEach((s, i) => 
        s.classList.toggle('active', i < rating)
      );
    });
  });
}

// Modal helper
function openModal(modalId, callback) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    if (callback) callback();
  }
}

// Admin functionality
function handleAdminCheck(e) {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;
  
  if (password === ADMIN_PASSWORD) {
    enterAdminMode();
    document.getElementById('admin-check-modal').classList.add('hidden');
  } else {
    showNotification('Invalid admin password', 'error');
  }
}

function enterAdminMode() {
  isAdminMode = true;
  
  const adminBtn = document.getElementById('admin-btn');
  if (adminBtn) {
    adminBtn.textContent = 'Exit Admin';
    adminBtn.classList.add('active');
  }
  
  const addCoffeeNavBtn = document.getElementById('add-coffee-nav-btn');
  if (addCoffeeNavBtn) addCoffeeNavBtn.style.display = 'block';
  
  renderCoffeeMenu();
  showNotification('Admin mode activated', 'success');
}

function exitAdminMode() {
  isAdminMode = false;
  
  const adminBtn = document.getElementById('admin-btn');
  if (adminBtn) {
    adminBtn.textContent = 'Admin';
    adminBtn.classList.remove('active');
  }
  
  const addCoffeeNavBtn = document.getElementById('add-coffee-nav-btn');
  if (addCoffeeNavBtn) addCoffeeNavBtn.style.display = 'none';
  
  renderCoffeeMenu();
  showNotification('Admin mode deactivated', 'info');
}

// Category management
function updateCategoryOptions() {
  const selects = ['category-filter', 'coffee-category', 'edit-coffee-category']
    .map(id => document.getElementById(id))
    .filter(el => el);
  
  const uniqueCategories = [...new Set(coffees.map(c => c.category))];
  
  selects.forEach(select => {
    const keepFirst = select.options[0]?.value === 'all';
    const startIdx = keepFirst ? 1 : 0;
    
    while (select.options.length > startIdx) select.remove(startIdx);
    
    uniqueCategories.forEach(category => {
      if (!category) return;
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      select.appendChild(option);
    });
  });
}

// Render functions
function renderCoffeeMenu(filteredCoffees) {
  const menu = document.getElementById('coffee-menu');
  if (!menu) return;
  
  const toRender = filteredCoffees || coffees;
  
  menu.innerHTML = toRender.map(coffee => `
    <div class="coffee-card">
      <img src="${coffee.image || 'placeholder.jpg'}" alt="${coffee.name}" class="coffee-image">
      <div class="coffee-info">
        <h3>${coffee.name}</h3>
        <p class="coffee-description">${coffee.description}</p>
        <p class="coffee-price">${coffee.currency || 'KES'} ${coffee.price.toFixed(2)}</p>
        <div class="coffee-actions">
          <button class="primary-button add-to-cart" data-id="${coffee.id}">Add to Cart</button>
          <button class="secondary-button view-reviews" data-id="${coffee.id}">Reviews</button>
          <button class="secondary-button add-review" data-id="${coffee.id}">Add Review</button>
          ${isAdminMode ? `
            <button class="edit-coffee" data-id="${coffee.id}">Edit</button>
            <button class="delete-coffee" data-id="${coffee.id}">Delete</button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// Filter and search
function filterCoffees() {
  const search = document.getElementById('search')?.value.toLowerCase() || '';
  const category = document.getElementById('category-filter')?.value || 'all';
  
  const filtered = coffees.filter(coffee => {
    const matchesSearch = coffee.name.toLowerCase().includes(search) || 
                         coffee.description.toLowerCase().includes(search);
    const matchesCategory = category === 'all' || coffee.category === category;
    return matchesSearch && matchesCategory;
  });
  
  renderCoffeeMenu(filtered);
}

// Cart functionality
function addToCart(coffeeId) {
  const coffee = coffees.find(c => c.id == coffeeId);
  if (!coffee) return;
  
  const existingItem = cart.find(item => item.id == coffeeId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ 
      id: coffee.id, 
      name: coffee.name, 
      price: coffee.price, 
      quantity: 1 
    });
  }
  
  updateCartCount();
  showNotification(`${coffee.name} added to cart`, 'success');
}

function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (!cartCount) return;
  
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = totalItems;
  cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function openCartModal() {
  const modal = document.getElementById('cart-modal');
  const items = document.getElementById('cart-items');
  if (!modal || !items) return;
  
  if (cart.length === 0) {
    items.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
    document.getElementById('cart-total').textContent = 'Total: KES 0.00';
    document.getElementById('checkout-section').style.display = 'none';
  } else {
    items.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.quantity;
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>KES ${item.price.toFixed(2)} x ${item.quantity}</p>
          </div>
          <div class="cart-item-total">KES ${itemTotal.toFixed(2)}</div>
          <div class="cart-item-actions">
            <button class="decrease-quantity" data-id="${item.id}">-</button>
            <span class="item-quantity">${item.quantity}</span>
            <button class="increase-quantity" data-id="${item.id}">+</button>
            <button class="remove-item" data-id="${item.id}">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
    
    const total = getCartTotal().toFixed(2);
    document.getElementById('cart-total').textContent = `Total: KES ${total}`;
    document.getElementById('checkout-section').style.display = 'block';
    document.getElementById('checkout-total').textContent = `Total: KES ${total}`;
  }
  
  modal.classList.remove('hidden');
}

function updateCartItemQuantity(itemId, change) {
  const item = cart.find(item => item.id == itemId);
  if (!item) return;
  
  item.quantity += change;
  
  if (item.quantity <= 0) {
    removeCartItem(itemId);
  } else {
    openCartModal();
    updateCartCount();
  }
}

function removeCartItem(itemId) {
  cart = cart.filter(item => item.id != itemId);
  openCartModal();
  updateCartCount();
  showNotification('Item removed from cart', 'info');
}

function clearCart() {
  cart = [];
  openCartModal();
  updateCartCount();
  showNotification('Cart cleared', 'info');
}

function handleCheckout(e) {
  e.preventDefault();
  
  const customerName = document.getElementById('customer-name').value;
  
  if (!customerName) {
    showNotification('Please enter your name', 'error');
    return;
  }
  
  if (cart.length === 0) {
    showNotification('Your cart is empty', 'error');
    return;
  }
  
  const total = getCartTotal().toFixed(2);
  
  // Clear cart and hide modal
  cart = [];
  updateCartCount();
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById('checkout-form').reset();
  
  showNotification(`Payment of KES ${total} successful! Thank you, ${customerName}!`, 'success');
}

// Review functionality
function showReviews(coffeeId) {
  const coffee = coffees.find(c => c.id == coffeeId);
  if (!coffee) return;
  
  const coffeeReviews = reviews.filter(r => r.coffeeId == coffeeId);
  const modal = document.getElementById('reviews-modal');
  const list = document.getElementById('reviews-list');
  
  if (!modal || !list) return;
  
  document.getElementById('reviews-title').textContent = `Reviews for ${coffee.name}`;
  document.getElementById('reviews-title').dataset.coffeeId = coffeeId;
  
  list.innerHTML = coffeeReviews.length === 0 
    ? '<p>No reviews yet for this coffee.</p>' 
    : coffeeReviews.map(review => `
        <div class="review">
          <div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
          <p>${review.comment}</p>
          <div class="review-footer">
            <small>- ${review.customerName || 'Anonymous'}</small>
            ${isAdminMode ? `<button class="delete-review" data-id="${review.id}">Delete</button>` : ''}
          </div>
        </div>
      `).join('');
  
  modal.classList.remove('hidden');
}

async function submitReview(e) {
  e.preventDefault();
  
  const coffeeId = document.getElementById('review-coffee-id').value;
  const name = document.getElementById('reviewer-name').value;
  const rating = document.getElementById('review-rating').value;
  const comment = document.getElementById('review-comment').value;
  
  if (!name || !rating || !comment) {
    showNotification('Please fill all fields', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coffeeId: parseInt(coffeeId),
        customerName: name,
        rating: parseInt(rating),
        comment,
        date: new Date().toISOString()
      })
    });
    
    if (!response.ok) throw new Error('Failed to submit review');
    
    const newReview = await response.json();
    reviews.push(newReview);
    
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    showNotification('Review submitted successfully!', 'success');
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  }
}

async function deleteReview(reviewId) {
  if (!isAdminMode || !confirm('Are you sure you want to delete this review?')) return;
  
  try {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete review');
    
    reviews = reviews.filter(r => r.id != reviewId);
    
    const coffeeId = document.getElementById('reviews-title')?.dataset.coffeeId;
    if (coffeeId) showReviews(coffeeId);
    
    showNotification('Review deleted successfully', 'success');
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  }
}

// Coffee management (admin)
function editCoffee(coffeeId) {
  if (!isAdminMode) return;
  
  const coffee = coffees.find(c => c.id == coffeeId);
  if (!coffee) return;
  
  // Fill form with coffee data
  const form = document.getElementById('edit-coffee-form');
  form.querySelector('#edit-coffee-id').value = coffee.id;
  form.querySelector('#edit-coffee-name').value = coffee.name;
  form.querySelector('#edit-coffee-description').value = coffee.description;
  form.querySelector('#edit-coffee-price').value = coffee.price;
  form.querySelector('#edit-coffee-image').value = coffee.image;
  
  // Select category
  const categorySelect = form.querySelector('#edit-coffee-category');
  for (let i = 0; i < categorySelect.options.length; i++) {
    if (categorySelect.options[i].value === coffee.category) {
      categorySelect.selectedIndex = i;
      break;
    }
  }
  
  openModal('edit-coffee-modal');
}

async function handleEditCoffee(e) {
  e.preventDefault();
  if (!isAdminMode) return;
  
  const coffeeId = document.getElementById('edit-coffee-id').value;
  const updatedCoffee = {
    name: document.getElementById('edit-coffee-name').value,
    description: document.getElementById('edit-coffee-description').value,
    price: parseFloat(document.getElementById('edit-coffee-price').value),
    image: document.getElementById('edit-coffee-image').value,
    category: document.getElementById('edit-coffee-category').value
  };
  
  try {
    const response = await fetch(`${API_URL}/coffees/${coffeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCoffee)
    });
    
    if (!response.ok) throw new Error('Failed to update coffee');
    
    const coffee = await response.json();
    const index = coffees.findIndex(c => c.id == coffeeId);
    if (index !== -1) coffees[index] = coffee;
    
    document.getElementById('edit-coffee-modal').classList.add('hidden');
    renderCoffeeMenu();
    updateCategoryOptions();
    
    showNotification(`${coffee.name} updated successfully`, 'success');
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  }
}

async function handleAddCoffee(e) {
  e.preventDefault();
  if (!isAdminMode) return;
  
  const nextId = Math.max(0, ...coffees.map(c => parseInt(c.id) || 0)) + 1;
  const newCoffee = {
    id: nextId,
    name: document.getElementById('coffee-name').value,
    description: document.getElementById('coffee-description').value,
    price: parseFloat(document.getElementById('coffee-price').value),
    image: document.getElementById('coffee-image').value,
    category: document.getElementById('coffee-category').value,
    currency: 'KES'
  };
  
  try {
    const response = await fetch(`${API_URL}/coffees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCoffee)
    });
    
    if (!response.ok) throw new Error('Failed to add coffee');
    
    const coffee = await response.json();
    coffees.push(coffee);
    
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('add-coffee-form').reset();
    
    renderCoffeeMenu();
    updateCategoryOptions();
    showNotification(`${coffee.name} added successfully`, 'success');
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  }
}

async function deleteCoffee(coffeeId) {
  if (!isAdminMode || !confirm('Are you sure you want to delete this coffee?')) return;
  
  try {
    const response = await fetch(`${API_URL}/coffees/${coffeeId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete coffee');
    
    coffees = coffees.filter(c => c.id != coffeeId);
    renderCoffeeMenu();
    showNotification('Coffee deleted successfully', 'success');
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  }
}

// Utility function
function showNotification(message, type = 'info', duration = 3000) {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => container.removeChild(notification), 300);
  }, duration);
} 