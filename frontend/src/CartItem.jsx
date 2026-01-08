import React from 'react';

const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}) => {
  return (
    <div className="cart-item">
      <img src={item.image_url} alt={item.name} />
      <div className="item-details">
        <h4>{item.name}</h4>
        <p>₹{item.price.toLocaleString()}</p>
      </div>
      <div className="quantity-control">
        <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
          −
        </button>
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
        />
        <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
          +
        </button>
      </div>
      <p className="item-total">₹{(item.price * item.quantity).toLocaleString()}</p>
      <button className="remove-btn" onClick={() => onRemove(item.id)}>
        🗑️
      </button>
    </div>
  );
};

export default CartItem;
