const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/order_db';

// Middleware
app.use(cors());
app.use(express.json());

// Fallback in-memory storage for when MongoDB is not available
let orders = [];
let dbConnected = false;

// MongoDB connection with retry logic
const connectWithRetry = () => {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    bufferMaxEntries: 0
  })
  .then(() => {
    console.log('Order Service connected to MongoDB');
    dbConnected = true;
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Using fallback in-memory storage. Retrying connection in 5 seconds...');
    dbConnected = false;
    // Initialize fallback data
    if (orders.length === 0) {
      orders = [
        {
          id: uuidv4(),
          customerId: 'customer-123',
          items: [
            { productId: uuidv4(), quantity: 2 }
          ],
          shippingAddress: {
            street: '123 Main St',
            city: 'Dhaka',
            country: 'Bangladesh'
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

// Order Schema
const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  shippingAddress: {
    street: String,
    city: String,
    country: String,
    postalCode: String
  },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Routes
app.get('/api/orders', async (req, res) => {
  try {
    if (dbConnected) {
      const orders = await Order.find();
      res.json(orders);
    } else {
      res.json(orders);
    }
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.json(orders); // Fallback to in-memory storage
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerId, items, shippingAddress } = req.body;
    
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer ID and items array are required' });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: 'Each item must have productId and positive quantity' });
      }
    }

    const newOrder = new Order({
      id: uuidv4(),
      customerId,
      items,
      shippingAddress: shippingAddress || {},
      status: 'pending'
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: 'Error creating order' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status, shippingAddress } = req.body;
    const order = await Order.findOne({ id: req.params.id });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status || order.status;
    order.shippingAddress = shippingAddress !== undefined ? shippingAddress : order.shippingAddress;
    order.updatedAt = new Date();

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error updating order' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await Order.deleteOne({ id: req.params.id });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting order' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Order Service', timestamp: new Date().toISOString() });
});

// Get orders by customer ID
app.get('/api/orders/customer/:customerId', async (req, res) => {
  try {
    const customerOrders = await Order.find({ customerId: req.params.customerId });
    res.json(customerOrders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching customer orders' });
  }
});

// Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ id: req.params.id });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    order.status = status;
    order.updatedAt = new Date();
    
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error updating order status' });
  }
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});