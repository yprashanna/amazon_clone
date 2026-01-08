import React from 'react';

const Header = ({ 
  cartCount, 
  ordersCount, 
  onHomeClick, 
  onOrdersClick, 
  onCartClick 
}) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">🛍️ amazon</h1>
        <div className="header-actions">
          <button className="header-btn" onClick={onHomeClick}>
            🏠 Home
          </button>
          <button className="header-btn" onClick={onOrdersClick}>
            📦 Orders ({ordersCount})
          </button>
          <button className="cart-button" onClick={onCartClick}>
            🛒 Cart ({cartCount})
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
