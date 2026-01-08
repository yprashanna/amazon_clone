import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import CartItem from './CartItem';
import Header from './Header';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  // Fetch products from backend
  useEffect(() => {
    fetch('http://localhost:8000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setFilteredProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, []);

  // Search and filter logic
  useEffect(() => {
    let results = products;

    // Filter by category
    if (selectedCategory !== 'All') {
      results = results.filter(p => p.category === selectedCategory);
    }

    // Search by name
    if (searchTerm.trim()) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(results);
  }, [searchTerm, selectedCategory, products]);

  // Get unique categories
  const categories = ['All', ...new Set(products.map(p => p.category))];

  // Get carousel images from product (image_url, image_url2, image_url3)
  const getProductImages = (product) => {
    const images = [];
    if (product.image_url) images.push(product.image_url);
    if (product.image_url2) images.push(product.image_url2);
    if (product.image_url3) images.push(product.image_url3);
    return images;
  };

  // Add to cart with ALERT
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: Math.random(),
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      }]);
    }
    alert(`✅ ${product.name} added to cart!`);
  };

  // Buy now - NO ALERT, DIRECT TO CHECKOUT
  const buyNow = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: Math.random(),
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      }]);
    }
    // DIRECTLY GO TO CHECKOUT - NO ALERT
    setShowCart(false);
    setShowCheckout(true);
    setShowOrders(false);
    setSelectedProduct(null);
  };

  // Remove from cart
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Update quantity
  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  // Calculate total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Checkout - FIXED BACKEND CALL
  const handleCheckout = async () => {
    if (!address.trim()) {
      alert('Please enter shipping address');
      return;
    }

    try {
      // FIXED: Send cart total and items to backend
      const checkoutData = {
        shipping_address: address,
        cart_total: cartTotal,  // Send calculated total from frontend
        items: cart.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      console.log('📤 Sending checkout data:', checkoutData);

      const response = await fetch('http://localhost:8000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      });

      if (response.ok) {
        const order = await response.json();
        console.log('✅ Order created:', order);
        
        setOrders([...orders, order]);
        
        // SHOW ORDER CONFIRMATION PAGE
        setOrderConfirmation(order);
        setCart([]);
        setAddress('');
        setShowCheckout(false);
        setShowCart(false);
      } else {
        const error = await response.json();
        console.error('❌ Checkout failed:', error);
        alert(`Checkout failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Checkout error:', err);
      alert('Error during checkout. Make sure backend is running on http://localhost:8000');
    }
  };

  // Next image in carousel
  const nextImage = () => {
    if (selectedProduct) {
      const images = getProductImages(selectedProduct);
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  // Previous image in carousel
  const prevImage = () => {
    if (selectedProduct) {
      const images = getProductImages(selectedProduct);
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Header handlers
  const handleHomeClick = () => {
    setShowOrders(false);
    setShowCart(false);
    setShowCheckout(false);
    setSelectedProduct(null);
    setOrderConfirmation(null);
  };

  const handleOrdersClick = () => {
    setShowOrders(!showOrders);
    setShowCart(false);
    setShowCheckout(false);
    setSelectedProduct(null);
    setOrderConfirmation(null);
  };

  const handleCartClick = () => {
    setShowCart(!showCart);
    setShowCheckout(false);
    setShowOrders(false);
    setSelectedProduct(null);
    setOrderConfirmation(null);
  };

  if (loading) {
    return <div className="loading">🔄 Loading products...</div>;
  }

  return (
    <div className="app">
      {/* Header Component */}
      <Header
        cartCount={cart.length}
        ordersCount={orders.length}
        onHomeClick={handleHomeClick}
        onOrdersClick={handleOrdersClick}
        onCartClick={handleCartClick}
      />

      {/* Main Content */}
      <main className="main-content">
        {/* Order Confirmation Page */}
        {orderConfirmation ? (
          <div className="confirmation-section">
            <div className="confirmation-card">
              <div className="confirmation-icon">✅</div>
              <h2>Order Placed Successfully!</h2>
              <div className="confirmation-details">
                <div className="detail-row">
                  <span className="label">Order ID:</span>
                  <span className="value">#{orderConfirmation.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Amount:</span>
                  <span className="value">₹{orderConfirmation.total_amount.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Shipping Address:</span>
                  <span className="value">{orderConfirmation.shipping_address}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="status-badge">{orderConfirmation.status}</span>
                </div>
              </div>
              <p className="confirmation-message">
                🎉 Thank you for your purchase! Your order will be delivered soon.
              </p>
              <button
                className="back-to-home-btn"
                onClick={() => {
                  setOrderConfirmation(null);
                  setShowCart(false);
                  setShowCheckout(false);
                  setShowOrders(false);
                  setSelectedProduct(null);
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : showOrders ? (
          /* Orders History */
          <div className="orders-section">
            <h2>📦 Order History</h2>
            {orders.length === 0 ? (
              <p className="empty-message">No orders yet. Start shopping! 🛒</p>
            ) : (
              <div className="orders-list">
                {orders.map((order, idx) => (
                  <div key={idx} className="order-card">
                    <div className="order-header">
                      <h3>Order #{order.id}</h3>
                      <span className="order-status">{order.status}</span>
                    </div>
                    <p><strong>Total:</strong> ₹{order.total_amount.toLocaleString()}</p>
                    <p><strong>Address:</strong> {order.shipping_address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : selectedProduct ? (
          /* Product Detail Page with Image Carousel from Database */
          <div className="product-detail">
            <button className="back-btn" onClick={() => setSelectedProduct(null)}>← Back</button>
            <div className="detail-container">
              {/* Image Carousel - Images from Database */}
              <div className="detail-image-container">
                <div className="carousel">
                  <img 
                    src={getProductImages(selectedProduct)[currentImageIndex] || selectedProduct.image_url} 
                    alt={selectedProduct.name}
                    className="carousel-image"
                  />
                  {getProductImages(selectedProduct).length > 1 && (
                    <>
                      <button className="carousel-btn prev-btn" onClick={prevImage}>❮</button>
                      <button className="carousel-btn next-btn" onClick={nextImage}>❯</button>
                      <div className="carousel-indicators">
                        {getProductImages(selectedProduct).map((_, idx) => (
                          <button
                            key={idx}
                            className={`indicator ${idx === currentImageIndex ? 'active' : ''}`}
                            onClick={() => setCurrentImageIndex(idx)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="detail-info">
                <h1>{selectedProduct.name}</h1>
                <p className="category-badge">{selectedProduct.category}</p>
                <p className="description">{selectedProduct.description}</p>

                <div className="detail-meta">
                  <div className="meta-item">
                    <span className="label">Price:</span>
                    <span className="price">₹{selectedProduct.price.toLocaleString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Stock:</span>
                    <span className={selectedProduct.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} Available` : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    className="add-to-cart-btn-large"
                    onClick={() => addToCart(selectedProduct)}
                    disabled={selectedProduct.stock === 0}
                  >
                    🛒 Add to Cart
                  </button>
                  <button
                    className="buy-now-btn"
                    onClick={() => buyNow(selectedProduct)}
                    disabled={selectedProduct.stock === 0}
                  >
                    ⚡ Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : showCart ? (
          /* Cart View */
          <div className="cart-section">
            <h2>🛒 Shopping Cart</h2>
            {cart.length === 0 ? (
              <p className="empty-message">Your cart is empty. Start shopping! 🛍️</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>

                <div className="cart-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-row">
                    <span>Subtotal ({cart.length} items):</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span className="free">FREE</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <button
                    className="checkout-btn"
                    onClick={() => {
                      setShowCheckout(true);
                      setShowCart(false);
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        ) : showCheckout ? (
          /* Checkout Page */
          <div className="checkout-section">
            <h2>✅ Checkout</h2>
            <div className="checkout-form">
              <div className="form-group">
                <label>📍 Shipping Address:</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address including street, city, state, and postal code..."
                  rows="5"
                />
              </div>

              <div className="order-review">
                <h3>Order Review</h3>
                {cart.map(item => (
                  <div key={item.id} className="review-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="review-total">
                  <strong>Total: ₹{cartTotal.toLocaleString()}</strong>
                </div>
              </div>

              <button
                className="place-order-btn"
                onClick={handleCheckout}
              >
                ✅ Place Order
              </button>
              <button
                className="back-btn-checkout"
                onClick={() => setShowCheckout(false)}
              >
                ← Back
              </button>
            </div>
          </div>
        ) : (
          /* Products Grid - Using ProductCard Component */
          <div>
            {/* Search and Filter Bar */}
            <div className="search-filter-bar">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="category-filter">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="results-info">
              <p>Showing {filteredProducts.length} products</p>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="no-results">
                <p>😞 No products found. Try a different search or category!</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => addToCart(product)}
                    onViewDetails={() => {
                      setSelectedProduct(product);
                      setCurrentImageIndex(0);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 Amazon Clone | Scaler SDE Internship Assignment</p>
        <p>Built with React + FastAPI + MySQL</p>
      </footer>
    </div>
  );
}

export default App;
