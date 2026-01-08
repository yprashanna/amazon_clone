import React from 'react';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onViewDetails 
}) => {
  return (
    <div className="product-card">
      <div
        className="product-image"
        onClick={onViewDetails}
      >
        <img src={product.image_url} alt={product.name} />
      </div>
      <div className="product-info">
        <h3 onClick={onViewDetails}>{product.name}</h3>
        <p className="category">{product.category}</p>
        <div className="product-footer">
          <span className="price">₹{product.price.toLocaleString()}</span>
          <span className={`stock ${product.stock > 0 ? 'in-stock' : 'out'}`}>
            {product.stock > 0 ? '✅ In Stock' : '❌ Out'}
          </span>
        </div>
        <div className="button-group">
          <button
            className="add-to-cart-btn"
            onClick={onAddToCart}
            disabled={product.stock === 0}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
