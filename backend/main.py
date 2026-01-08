from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

# ========== DATABASE SETUP ==========
DATABASE_URL = "mysql+pymysql://root:root@localhost/amazon_clone"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== DATABASE MODELS ==========
class ProductModel(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(String(2000), nullable=True)
    image_url = Column(String(500), nullable=True)
    image_url2 = Column(String(500), nullable=True)
    image_url3 = Column(String(500), nullable=True)
    stock = Column(Integer, default=10)

class OrderModel(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(Float, nullable=False)
    shipping_address = Column(String(300), nullable=False)
    status = Column(String(20), default="confirmed")
    created_at = Column(DateTime, default=datetime.utcnow)

class OrderItemModel(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

# ========== PYDANTIC SCHEMAS ==========
class ProductSchema(BaseModel):
    id: int
    name: str
    price: float
    category: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_url2: Optional[str] = None
    image_url3: Optional[str] = None
    stock: int
    
    class Config:
        from_attributes = True

class CartItemSchema(BaseModel):
    """Cart item sent from React frontend"""
    product_id: int
    name: str
    price: float
    quantity: int

class CheckoutSchema(BaseModel):
    """Checkout request from frontend - FIXED to accept cart total"""
    shipping_address: str
    cart_total: float
    items: List[CartItemSchema] = []

class OrderSchema(BaseModel):
    """Order response to frontend"""
    id: int
    total_amount: float
    shipping_address: str
    status: str
    created_at: datetime = None
    
    class Config:
        from_attributes = True

# ========== FASTAPI APP ==========
app = FastAPI(title="Amazon Clone API - Backend")

# CORS Middleware - Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== HEALTH CHECK ==========
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "Backend is running!", "api_version": "1.0"}

@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Amazon Clone API ✅", "endpoints": [
        "GET /api/products - Get all products",
        "POST /api/checkout - Place order"
    ]}

# ========== PRODUCT ENDPOINTS ==========
@app.get("/api/products", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
    """
    Get all products from database
    Returns: List of all products with 3 images each
    """
    try:
        products = db.query(ProductModel).all()
        print(f"✅ Fetched {len(products)} products")
        return products
    except Exception as e:
        print(f"❌ Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching products: {str(e)}")

@app.get("/api/products/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Get single product by ID
    Includes all 3 images for carousel
    """
    try:
        product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        return product
    except Exception as e:
        print(f"❌ Error fetching product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========== ORDER ENDPOINTS ==========
@app.post("/api/checkout", response_model=OrderSchema)
def checkout(request: CheckoutSchema, db: Session = Depends(get_db)):
    """
    Place order from checkout
    
    FIXED ISSUES:
    ✅ Accepts cart_total from frontend (not calculated from server cart)
    ✅ Validates shipping address
    ✅ Creates order with correct total
    ✅ Returns order with ID for confirmation page
    
    Request format:
    {
        "shipping_address": "123 Main St, City, State 12345",
        "cart_total": 85000,
        "items": [optional cart items for logging]
    }
    """
    try:
        # Validate shipping address
        if not request.shipping_address or len(request.shipping_address.strip()) < 5:
            raise HTTPException(status_code=400, detail="Shipping address is required (min 5 chars)")
        
        # Validate total
        if request.cart_total <= 0:
            raise HTTPException(status_code=400, detail="Cart total must be greater than 0")
        
        # Create order with frontend-calculated total
        order = OrderModel(
            total_amount=request.cart_total,
            shipping_address=request.shipping_address.strip(),
            status="confirmed"
        )
        
        db.add(order)
        db.flush()  # Get order ID without committing
        
        # Log order items if provided (for audit trail)
        if request.items:
            for item in request.items:
                order_item = OrderItemModel(
                    order_id=order.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    price=item.price
                )
                db.add(order_item)
        
        db.commit()
        db.refresh(order)
        
        print(f"✅ Order placed: ID={order.id}, Amount=₹{order.total_amount}, Address={order.shipping_address}")
        
        return {
            "id": order.id,
            "total_amount": order.total_amount,
            "shipping_address": order.shipping_address,
            "status": order.status,
            "created_at": order.created_at
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error placing order: {e}")
        raise HTTPException(status_code=500, detail=f"Error placing order: {str(e)}")

@app.get("/api/orders", response_model=List[OrderSchema])
def get_orders(db: Session = Depends(get_db)):
    """
    Get all orders (for order history page)
    """
    try:
        orders = db.query(OrderModel).order_by(OrderModel.created_at.desc()).all()
        print(f"✅ Fetched {len(orders)} orders")
        return orders
    except Exception as e:
        print(f"❌ Error fetching orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders/{order_id}", response_model=OrderSchema)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """
    Get single order by ID (for order details page)
    """
    try:
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
        return order
    except Exception as e:
        print(f"❌ Error fetching order {order_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========== STARTUP EVENT (WITH AUTO-SEED) ==========
@app.on_event("startup")
def startup_event():
    """Initialize database tables + AUTO-SEED 12 products"""
    try:
        Base.metadata.create_all(bind=engine)
        
        # AUTO-SEED: Add 12 products if database empty
        db = SessionLocal()
        product_count = db.query(ProductModel).count()
        
        if product_count == 0:
            print("🌱 Database empty - Seeding 12 sample products...")
            
            sample_products = [
                {
                    "name": "iPhone 15 Pro",
                    "price": 99999,
                    "category": "Electronics",
                    "description": "Latest iPhone with A17 Pro chip",
                    "image_url": "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pro_Max_Black_Titanium_PDP_Image_Position-1__en-IN_ad326452-186a-484a-99a4-82dc80c280fb.jpg?v=1759734024&width=823",
                    "image_url2": "https://goldenshield.in/cdn/shop/files/15prothincase_2.jpg?v=1712596027&width=2048",
                    "image_url3": "https://i.guim.co.uk/img/media/7cc121c51c48aaf07d8368e98c5f89edaa9b8803/637_662_4222_2533/master/4222.jpg?width=1200&height=1200",
                    "stock": 10
                },
                {
                    "name": "Sony WH-1000XM5 Headphones",
                    "price": 29999,
                    "category": "Electronics",
                    "description": "Industry-leading noise cancellation",
                    "image_url": "https://m.media-amazon.com/images/I/51aXvjzcukL.jpg",
                    "image_url2": "https://rukminim2.flixcart.com/image/480/640/xif0q/headphone/d/5/v/-original-imahgr29e7fzcfgn.jpeg?q=20",
                    "image_url3": "https://shopatsc.com/cdn/shop/products/2500x2500_Black_3.jpg?v=1694415813",
                    "stock": 15
                },
                {
                    "name": "The Midnight Library",
                    "price": 399,
                    "category": "Books",
                    "description": "A novel about infinite possibilities",
                    "image_url": "https://m.media-amazon.com/images/I/71qsovx-x6L.jpg",
                    "stock": 50
                },
                {
                    "name": "Atomic Habits",
                    "price": 499,
                    "category": "Books", 
                    "description": "Build good habits, break bad ones",
                    "image_url": "https://cultivatewhatmatters.com/cdn/shop/articles/atomic-habits.jpg?v=1624827508",
                    "stock": 75
                },
                {
                    "name": "Samsung 55\" 4K TV",
                    "price": 49999,
                    "category": "Electronics",
                    "image_url": "https://kannankandy.com/wp-content/uploads/2025/06/tv.jpg",
                    "stock": 8
                },
                {
                    "name": "Philips Air Fryer",
                    "price": 7999,
                    "category": "Home & Kitchen",
                    "image_url": "https://m.media-amazon.com/images/I/41exFmRRtqL._AC_UF894,1000_QL80_.jpg",
                    "stock": 20
                },
                {
                    "name": "Bodum French Press",
                    "price": 2499,
                    "category": "Home & Kitchen",
                    "image_url": "https://m.media-amazon.com/images/I/61tCsY690sL.jpg",
                    "stock": 30
                },
                {
                    "name": "Prestige Cookware Set",
                    "price": 3999,
                    "category": "Home & Kitchen",
                    "image_url": "https://5.imimg.com/data5/GG/YH/MY-23158756/non-stick-cookware.jpg",
                    "stock": 12
                },
                {
                    "name": "Cotton T-Shirt",
                    "price": 799,
                    "category": "Clothing",
                    "image_url": "https://m.media-amazon.com/images/I/51fE-zT6hrL._AC_UY1100_.jpg",
                    "stock": 100
                },
                {
                    "name": "Running Shoes",
                    "price": 2999,
                    "category": "Sports",
                    "image_url": "https://m.media-amazon.com/images/I/71f3BmjCwtL.jpg",
                    "stock": 25
                },
                {
                    "name": "Yoga Mat",
                    "price": 1299,
                    "category": "Sports",
                    "image_url": "https://sppartos.com/cdn/shop/files/31VX-aIlgWL_300x300.jpg?v=1702469142",
                    "stock": 40
                }
            ]
            
            for product_data in sample_products:
                product = ProductModel(**product_data)
                db.add(product)
            
            db.commit()
            print(f"✅ Seeded {len(sample_products)} products with images!")
        else:
            print(f"✅ Found {product_count} existing products - Skipping seed")
        
        db.close()
        
        print("\n" + "="*60)
        print("✅ DATABASE READY WITH PRODUCTS!")
        print("✅ FASTAPI SERVER STARTING")
        print("="*60)
        print("🌐 API Running on: http://localhost:8000")
        print("📚 Docs available at: http://localhost:8000/docs")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"❌ Startup error: {e}")

# ========== EXCEPTION HANDLER ==========
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global error handler"""
    print(f"❌ Unhandled error: {exc}")
    return {
        "error": True,
        "message": str(exc),
        "status_code": 500
    }

# ========== RUN SERVER ==========
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
