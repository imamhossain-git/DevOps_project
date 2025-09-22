const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product_db';

// Middleware
app.use(cors());
app.use(express.json());

// Fallback in-memory storage for when MongoDB is not available
let products = [];
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
    console.log('Product Service connected to MongoDB');
    dbConnected = true;
    initializeProducts();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Using fallback in-memory storage. Retrying connection in 5 seconds...');
    dbConnected = false;
    // Initialize fallback data
    if (products.length === 0) {
      products = [
        {
          id: uuidv4(),
          name: 'Laptop',
          description: 'High-performance laptop for professionals',
          price: 999.99,
          category: 'Electronics',
          stock: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'Smartphone',
          description: 'Latest smartphone with advanced features',
          price: 699.99,
          category: 'Electronics',
          stock: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'Headphones',
          description: 'Wireless noise-cancelling headphones',
          price: 199.99,
          category: 'Electronics',
          stock: 75,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

// Product Schema
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Initialize with sample data if database is empty
async function initializeProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const sampleProducts = [
        {
          id: uuidv4(),
          name: 'Laptop',
          description: 'High-performance laptop for professionals',
          price: 999.99,
          category: 'Electronics',
          stock: 50
        },
        {
          id: uuidv4(),
          name: 'Smartphone',
          description: 'Latest smartphone with advanced features',
          price: 699.99,
          category: 'Electronics',
          stock: 100
        },
        {
          id: uuidv4(),
          name: 'Headphones',
          description: 'Wireless noise-cancelling headphones',
          price: 199.99,
          category: 'Electronics',
          stock: 75
        }
      ];
      await Product.insertMany(sampleProducts);
      console.log('Sample products initialized');
    }
  } catch (error) {
    console.error('Error initializing products:', error.message);
  }
}

// Routes
app.get('/api/products', async (req, res) => {
  try {
    if (dbConnected) {
      const products = await Product.find();
      res.json(products);
    } else {
      res.json(products);
    }
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.json(products); // Fallback to in-memory storage
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    if (dbConnected) {
      const product = await Product.findOne({ id: req.params.id });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } else {
      const product = products.find(p => p.id === req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    }
  } catch (error) {
    const product = products.find(p => p.id === req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const newProduct = {
      id: uuidv4(),
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (dbConnected) {
      const mongoProduct = new Product(newProduct);
      await mongoProduct.save();
      res.status(201).json(mongoProduct);
    } else {
      products.push(newProduct);
      res.status(201).json(newProduct);
    }
  } catch (error) {
    console.error('Error creating product:', error.message);
    // Fallback to in-memory storage
    const { name, description, price, category, stock } = req.body;
    const newProduct = {
      id: uuidv4(),
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const product = await Product.findOne({ id: req.params.id });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? parseFloat(price) : product.price;
    product.category = category || product.category;
    product.stock = stock !== undefined ? parseInt(stock) : product.stock;
    product.updatedAt = new Date();

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error updating product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Product.deleteOne({ id: req.params.id });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Product Service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});