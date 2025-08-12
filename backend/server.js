// backend/server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = 'mongodb://127.0.0.1:27017/Think41ecommerce';
const DATABASE_NAME = 'Think41ecommerce';
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// Initialize MongoDB connection
connectToMongoDB();

// 1. Search users by multiple criteria
app.get('/api/users/search', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      first_name,
      last_name,
      email,
      age,
      sortBy = 'first_name',
      sortOrder = 'asc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build search filter - only these 5 fields
    let filter = {};
    
    // Handle name search - if first_name contains a full name, split it
    if (first_name && first_name.trim()) {
      const nameParts = first_name.trim().split(' ').filter(Boolean);
      
      if (nameParts.length === 1) {
        // Single word - search in first_name or last_name
        filter.$or = [
          { first_name: { $regex: nameParts[0], $options: 'i' } },
          { last_name: { $regex: nameParts[0], $options: 'i' } }
        ];
      } else if (nameParts.length >= 2) {
        // Multiple words - first word in first_name, rest in last_name
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        filter.$or = [
          // Exact match for first + last name
          {
            first_name: { $regex: `^${firstName}$`, $options: 'i' },
            last_name: { $regex: `^${lastName}$`, $options: 'i' }
          },
          // Partial match in first_name
          { first_name: { $regex: firstName, $options: 'i' } },
          // Partial match in last_name
          { last_name: { $regex: lastName, $options: 'i' } }
        ];
      }
    }
    
    if (last_name && last_name.trim()) {
      filter.last_name = { $regex: last_name.trim(), $options: 'i' };
    }
    
    if (email && email.trim()) {
      filter.email = { $regex: email.trim(), $options: 'i' };
    }
    
    if (age && age.trim()) {
      const ageNum = parseInt(age);
      if (!isNaN(ageNum)) {
        filter.age = ageNum;
      }
    }
    
    // Build sort object
    let sortObj = {};
    const validSortFields = ['first_name', 'last_name', 'email', 'age'];
    if (sortBy && validSortFields.includes(sortBy)) {
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj.first_name = 1; // Default sort by first_name ascending
    }
    
    console.log('Search filter:', JSON.stringify(filter, null, 2)); // Debug log
    
    // Query users collection
    const users = await db.collection('users')
      .find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection('users').countDocuments(filter);
    
    console.log(`Found ${users.length} users out of ${total} total`); // Debug log
    
    // Prepare search stats
    const stats = {
      totalResults: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      resultsPerPage: parseInt(limit),
      appliedFilters: Object.keys(filter).length > 0 ? filter : 'No filters applied'
    };
    
    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      searchStats: stats
    });
    
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// 2. Get all orders for a specific user by name
app.get('/api/users/:userName/orders', async (req, res) => {
  try {
    const userName = decodeURIComponent(req.params.userName).trim();
    console.log('Looking for user:', userName); // Debug log
    
    // Split the userName into parts (for full name matching)
    const nameParts = userName.split(' ').filter(Boolean);
    
    let user = null;
    
    if (nameParts.length === 1) {
      // Search either first_name or last_name case-insensitive partial match
      user = await db.collection('users').findOne({
        $or: [
          { first_name: { $regex: nameParts[0], $options: 'i' } },
          { last_name: { $regex: nameParts[0], $options: 'i' } }
        ]
      });
    } else if (nameParts.length >= 2) {
      // Search full name match (first_name + last_name)
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      user = await db.collection('users').findOne({
        first_name: { $regex: `^${firstName}$`, $options: 'i' },
        last_name: { $regex: `^${lastName}$`, $options: 'i' }
      });
      
      if (!user) {
        // fallback: partial match on first or last name
        user = await db.collection('users').findOne({
          $or: [
            { first_name: { $regex: firstName, $options: 'i' } },
            { last_name: { $regex: lastName, $options: 'i' } }
          ]
        });
      }
    }
    
    if (!user) {
      const sampleUsers = await db.collection('users').find({}).limit(5).toArray();
      return res.status(404).json({
        success: false,
        error: `User '${userName}' not found. Sample users: ${sampleUsers.map(u => `${u.first_name || 'Unknown'} ${u.last_name || ''}`).join(', ')}`
      });
    }
    
    console.log('Found user:', user);
    
    // Get all orders for this user using user_id
    const userOrders = await db.collection('orders')
      .find({ user_id: user.id })
      .sort({ created_at: -1 })
      .toArray();
    
    console.log('Found orders:', userOrders.length);
    
    // Calculate order statistics based on available fields
    const totalOrders = userOrders.length;
    const totalItems = userOrders.reduce((sum, order) => sum + (order.num_of_item || 0), 0);
    const cancelledOrders = userOrders.filter(order => order.status === 'Cancelled').length;
    const activeOrders = totalOrders - cancelledOrders;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      },
      orders: userOrders,
      statistics: {
        totalOrders: totalOrders,
        totalItems: totalItems,
        activeOrders: activeOrders,
        cancelledOrders: cancelledOrders
      }
    });
    
  } catch (err) {
    console.error('User orders error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 3. Get all items in a specific order
app.get('/api/orders/:orderId/items', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Get order details
    const order = await db.collection('orders').findOne({ order_id: orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Get user details using user_id from the order
    const user = await db.collection('users').findOne({ id: order.user_id });
    
    // Get all items in this order using both order_id and user_id for accuracy
    const orderItems = await db.collection('order_items')
      .find({ 
        order_id: orderId,
        user_id: order.user_id 
      })
      .toArray();
    
    console.log(`Found ${orderItems.length} items for order ${orderId} and user ${order.user_id}`);
    
    // Get product details for each item
    const itemsWithProducts = await Promise.all(
      orderItems.map(async (item) => {
        const product = await db.collection('products').findOne({ id: item.product_id });
        return {
          ...item,
          product: product || { name: 'Product not found', category: 'Unknown' }
        };
      })
    );
    
    res.json({
      success: true,
      order: {
        id: order.order_id,
        user_id: order.user_id,
        status: order.status,
        num_of_item: order.num_of_item,
        created_at: order.created_at,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at,
        returned_at: order.returned_at
      },
      user: user ? {
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email
      } : null,
      items: itemsWithProducts,
      totalItems: itemsWithProducts.length
    });
    
  } catch (err) {
    console.error('Order items error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Root endpoint showing available endpoints
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ecommerce Order Viewer Backend is running',
    endpoints: [
      'GET /api/users - Get all users (for debugging)',
      'GET /api/users/search - Search users by: first_name, last_name, email, age',
      'GET /api/users/:userName/orders - Get all orders for a specific user by name',
      'GET /api/orders/:orderId/items - Get all items in a specific order',
      'GET /api/debug/users - Debug: See sample users in database'
    ]
  });
});

// Debug endpoint to see what's in the database
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await db.collection('users').find({}).limit(10).toArray();
    const orders = await db.collection('orders').find({}).limit(5).toArray();
    const products = await db.collection('products').find({}).limit(5).toArray();
    
    // Get field names from first user document
    const userFields = users.length > 0 ? Object.keys(users[0]) : [];
    
    res.json({
      success: true,
      debug: {
        totalUsers: await db.collection('users').countDocuments(),
        totalOrders: await db.collection('orders').countDocuments(),
        totalProducts: await db.collection('products').countDocuments(),
        userFields: userFields, // Show what fields actually exist
        sampleUsers: users.map(u => {
          // Show all fields for debugging
          const userData = { id: u.id };
          if (u.name) userData.name = u.name;
          if (u.first_name) userData.first_name = u.first_name;
          if (u.last_name) userData.last_name = u.last_name;
          if (u.email) userData.email = u.email;
          return userData;
        }),
        sampleOrders: orders.map(o => ({ id: o.id, user_id: o.user_id, total: o.total })),
        sampleProducts: products.map(p => ({ id: p.id, name: p.name, category: p.category }))
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Simple endpoint to get all users (for debugging)
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.collection('users').find({}).limit(50).toArray();
    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email,
        city: u.city,
        state: u.state
      }))
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Test endpoint to check for specific names
app.get('/api/test/search/:searchTerm', async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    console.log(`Testing search for: "${searchTerm}"`);
    
    // Test different search approaches
    const results = {
      searchTerm,
      exactName: await db.collection('users').findOne({ name: searchTerm }),
      exactFirstName: await db.collection('users').findOne({ first_name: searchTerm }),
      exactLastName: await db.collection('users').findOne({ last_name: searchTerm }),
      regexName: await db.collection('users').findOne({ name: { $regex: searchTerm, $options: 'i' } }),
      regexFirstName: await db.collection('users').findOne({ first_name: { $regex: searchTerm, $options: 'i' } }),
      regexLastName: await db.collection('users').findOne({ last_name: { $regex: searchTerm, $options: 'i' } }),
      allUsers: await db.collection('users').find({}).limit(5).toArray()
    };
    
    res.json({
      success: true,
      testResults: results
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.listen(5000, () => console.log("🚀 Backend running on port 5000"));
