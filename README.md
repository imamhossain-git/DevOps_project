# E-Commerce Microservices

A complete e-commerce microservice application with two services: Product Service and Order Service, both using MongoDB Atlas cloud database, plus a web-based frontend for CRUD operations.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Product Service │    │ Order Service   │    │   Frontend       │
│   Port: 3001    │    │   Port: 3002    │    │   Port: 80       │
│                 │    │                 │    │                 │
│ • Product CRUD  │    │ • Order CRUD    │    │ • Product Mgmt   │
│ • Inventory     │    │ • Customer      │    │ • Order Mgmt    │
│ • Catalog       │    │ • Status        │    │ • Web Interface │
│                 │    │                 │    │                 │
│ MongoDB Atlas   │    │ MongoDB Atlas   │    │ Nginx Web Server │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Services

### Product Service (Port 3001)
Manages product catalog and inventory with MongoDB Atlas cloud database.

**API Endpoints:**
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /health` - Health check

**Sample Product Data:**
```json
{
  "id": "uuid",
  "name": "Laptop",
  "description": "High-performance laptop for professionals",
  "price": 999.99,
  "category": "Electronics",
  "stock": 50,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Order Service (Port 3002)
Manages customer orders with MongoDB Atlas cloud database.

**API Endpoints:**
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `GET /api/orders/customer/:customerId` - Get orders by customer ID
- `PATCH /api/orders/:id/status` - Update order status
- `GET /health` - Health check

**Sample Order Data:**
```json
{
  "id": "order-uuid",
  "customerId": "customer-123",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Dhaka",
    "country": "Bangladesh"
  },
  "status": "pending",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Frontend (Port 80)
Web-based management dashboard with CRUD operations for both products and orders.

**Features:**
- Product management (Create, Read, Update, Delete)
- Order management (Create, Read, Update, Delete)
- Responsive design
- Real-time data updates
- Form validation
- Status indicators

## Setup and Running

### Prerequisites
- Docker and Docker Compose installed
- MongoDB Atlas account (free tier available)

### MongoDB Atlas Setup
1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier is sufficient)
3. Create two databases:
   - `product_db` for Product Service
   - `order_db` for Order Service
4. Create database users for both databases
5. Get the connection strings for both databases
6. Update the `.env` file with your connection strings

### Environment Configuration
Copy and update the `.env` file with your MongoDB Atlas connection strings:
```bash
# .env file
MONGODB_URI_PRODUCT=mongodb+srv://username:password@cluster.mongodb.net/product_db?retryWrites=true&w=majority&appName=e-commerce
MONGODB_URI_ORDER=mongodb+srv://username:password@cluster.mongodb.net/order_db?retryWrites=true&w=majority&appName=e-commerce
```

### Running with Docker Compose (Recommended)
```bash
cd e-commerce
docker compose up --build
```

Access the application at: http://localhost

### Running Individual Services
```bash
# Product Service
cd product-service
npm install
npm start

# Order Service
cd order-service
npm install
npm start

# Frontend (requires separate web server)
cd frontend
# Use any static web server like python -m http.server 8000
```

## Testing the Services

### Web Interface Testing
1. Open http://localhost in your browser
2. Navigate between Products and Orders tabs
3. Test CRUD operations using the web interface

### API Testing (Manual)
```bash
# Test Product Service
curl http://localhost:3001/health
curl http://localhost:3001/api/products

# Test Order Service
curl http://localhost:3002/health
curl http://localhost:3002/api/orders
```

### Frontend Features
- **Products Tab**: Add, edit, delete products with full form validation
- **Orders Tab**: Create orders with JSON item format, view order status
- **Real-time Updates**: Data refreshes automatically after operations
- **Error Handling**: User-friendly error messages for API failures

## Development

### Adding New Endpoints
1. Modify the respective service's `server.js` file
2. Add appropriate route handlers with MongoDB operations
3. Update the frontend `index.html` if UI changes are needed
4. Test with curl or API testing tools
5. Update documentation

### Environment Variables
- `PORT`: Service port (default: 3001 for product, 3002 for order)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI_PRODUCT`: MongoDB Atlas connection string for Product Service
- `MONGODB_URI_ORDER`: MongoDB Atlas connection string for Order Service

### Frontend Customization
- Modify `frontend/index.html` to change the UI
- CSS is embedded for easy customization
- JavaScript handles all API calls and DOM manipulation

## Notes

- Both services use MongoDB Atlas for cloud-based persistent storage
- Services include fallback in-memory storage when database is unavailable
- Services are independent and can be scaled separately
- CORS is enabled for cross-origin requests
- No local database setup required for basic functionality
- Sample data is automatically initialized on first run
- Frontend uses vanilla JavaScript for maximum compatibility
- Nginx serves the frontend statically for production deployment

## Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 80, 3001, 3002 are available
2. **MongoDB Atlas connection**: Verify connection strings in `.env` file and network access
3. **Frontend not loading**: Verify Docker volume mounting for frontend files
4. **API calls failing**: Check service health endpoints first

### Health Checks
```bash
# Product Service
curl http://localhost:3001/health

# Order Service
curl http://localhost:3002/health

# Frontend
curl http://localhost/  # Should return HTML content
```# DevOps_project
