# 🛒 Ecommerce Order Viewer

A full-stack web application for searching users, viewing their orders, and examining order details. Built with Node.js, Express, MongoDB, and React.

## ✨ Features

- **🔍 User Search**: Search users by first name, last name, email, and age
- **📦 Order Management**: View all orders for a specific user
- **🛍️ Order Details**: Examine individual items within orders
- **📊 Statistics**: View order summaries and user statistics
- **🎨 Modern UI**: Clean, responsive interface built with React

## 🏗️ Architecture

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Vite
- **Database**: MongoDB with collections for users, orders, order_items, and products

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or accessible)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ecommerce-order-viewer
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up MongoDB**
   - Ensure MongoDB is running
   - Create database: `Think41ecommerce`
   - Update connection string in `backend/server.js` if needed

5. **Upload your datasets**
   ```bash
   cd ../backend
   node uploadDatasets.js
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   Backend will run on: http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on: http://localhost:5173

## 📁 Project Structure

```
ecommerce-order-viewer/
├── backend/
│   ├── server.js              # Express server with API endpoints
│   ├── uploadDatasets.js      # Script to upload CSV data to MongoDB
│   ├── package.json           # Backend dependencies
│   └── Dataset/               # Your CSV files (not in git)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── UserSearch.jsx # Main search and order management component
│   │   ├── App.jsx            # Main application component
│   │   └── main.jsx           # Application entry point
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite configuration
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🔌 API Endpoints

### Backend API

- `GET /` - API information and available endpoints
- `GET /api/users` - Get all users (for debugging)
- `GET /api/users/search` - Search users by criteria
- `GET /api/users/:userName/orders` - Get orders for a specific user
- `GET /api/orders/:orderId/items` - Get items in a specific order
- `GET /api/debug/users` - Debug endpoint to view database contents

### Search Parameters

- `first_name` - First name or full name
- `last_name` - Last name
- `email` - Email address
- `age` - Age (number)
- `page` - Page number for pagination
- `limit` - Results per page
- `sortBy` - Sort field (first_name, last_name, email, age)
- `sortOrder` - Sort direction (asc, desc)

## 🗄️ Database Schema

### Collections

1. **users**
   - `id`, `first_name`, `last_name`, `email`, `age`

2. **orders**
   - `order_id`, `user_id`, `status`, `num_of_item`, `created_at`

3. **order_items**
   - `id`, `order_id`, `user_id`, `product_id`, `status`, `sale_price`

4. **products**
   - `id`, `name`, `category`

## 🎯 Usage Examples

### Search for a User
1. Enter search criteria (e.g., "Aaron Smith" in first name field)
2. Click "Search Users"
3. View search results with user cards

### View User Orders
1. Click "View Orders" on any user card
2. See all orders for that user
3. View order statistics and details

### View Order Items
1. Click "View Items" on any order card
2. See all items in that order
3. View product details and pricing

## 🛠️ Development

### Backend Development
```bash
cd backend
npm start          # Start server
node uploadDatasets.js  # Upload data
```

### Frontend Development
```bash
cd frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Database Operations
- **View data**: Visit `/api/debug/users` endpoint
- **Upload data**: Run `node uploadDatasets.js`
- **Check collections**: Use MongoDB Compass or mongo shell

## 🔧 Configuration

### MongoDB Connection
Update the connection string in `backend/server.js`:
```javascript
const MONGODB_URI = 'mongodb://127.0.0.1:Think41ecommerce';
const DATABASE_NAME = 'Think41ecommerce';
```

### Port Configuration
- Backend: Port 5000 (configurable in `server.js`)
- Frontend: Port 5173 (configurable in `vite.config.js`)

## 📊 Data Upload

The `uploadDatasets.js` script processes CSV files from the `Dataset/` folder:
- `users.csv` → users collection
- `orders.csv` → orders collection
- `order_items.csv` → order_items collection
- `products.csv` → products collection

## 🐛 Troubleshooting

### Common Issues

1. **"User not found" error**
   - Check if data was uploaded to MongoDB
   - Verify database connection
   - Use `/api/debug/users` to check database contents

2. **Orders not displaying**
   - Ensure `user_id` matches between users and orders collections
   - Check MongoDB connection

3. **Frontend not connecting to backend**
   - Verify backend is running on port 5000
   - Check CORS configuration
   - Ensure no firewall blocking localhost

### Debug Endpoints
- `/api/debug/users` - View database contents
- `/api/users` - List all users
- `/api/test/search/:term` - Test search functionality

## 🚨 Error Handling Techniques

### Backend Error Handling

#### 1. **Try-Catch Blocks**
```javascript
app.get('/api/users/search', async (req, res) => {
  try {
    // Your API logic here
    const users = await db.collection('users').find(filter).toArray();
    res.json({ success: true, users });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

#### 2. **Input Validation**
```javascript
// Validate required parameters
if (!req.query.first_name && !req.query.last_name && !req.query.email) {
  return res.status(400).json({
    success: false,
    error: 'At least one search parameter is required',
    required: ['first_name', 'last_name', 'email']
  });
}

// Validate data types
const age = parseInt(req.query.age);
if (req.query.age && isNaN(age)) {
  return res.status(400).json({
    success: false,
    error: 'Age must be a valid number',
    received: req.query.age
  });
}
```

#### 3. **Database Connection Error Handling**
```javascript
// In server.js
MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
  .then(client => {
    console.log('✅ Connected to MongoDB');
    db = client.db(DATABASE_NAME);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if can't connect to database
  });
```

#### 4. **Graceful Degradation**
```javascript
// Handle missing data gracefully
const user = await db.collection('users').findOne(filter);
if (!user) {
  return res.status(404).json({
    success: false,
    error: 'User not found',
    suggestions: await getSimilarUsers(searchTerm),
    totalUsers: await db.collection('users').countDocuments()
  });
}
```

### Frontend Error Handling

#### 1. **API Error Handling**
```javascript
const searchUsers = async () => {
  try {
    setLoading(true);
    setError('');
    
    const response = await fetch(`/api/users/search?${searchParams}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    setUsers(data.users);
    setTotalPages(data.pagination.pages);
    
  } catch (err) {
    console.error('Search failed:', err);
    setError(err.message || 'Failed to search users');
    setUsers([]);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **Form Validation**
```javascript
const validateForm = () => {
  const errors = [];
  
  if (!searchParams.first_name && !searchParams.last_name && !searchParams.email) {
    errors.push('At least one search field is required');
  }
  
  if (searchParams.age && (isNaN(searchParams.age) || searchParams.age < 0)) {
    errors.push('Age must be a positive number');
  }
  
  if (searchParams.email && !searchParams.email.includes('@')) {
    errors.push('Please enter a valid email address');
  }
  
  return errors;
};

const handleSearch = (e) => {
  e.preventDefault();
  const errors = validateForm();
  
  if (errors.length > 0) {
    setError(errors.join(', '));
    return;
  }
  
  searchUsers();
};
```

#### 3. **Loading States & User Feedback**
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

// In your JSX
{loading && <div className="loading-spinner">🔍 Searching...</div>}
{error && <div className="error-message">❌ {error}</div>}
{users.length === 0 && !loading && !error && (
  <div className="no-results">📭 No users found matching your criteria</div>
)}
```

#### 4. **Network Error Handling**
```javascript
const handleNetworkError = (err) => {
  if (err.name === 'TypeError' && err.message.includes('fetch')) {
    return 'Network error: Please check your internet connection';
  }
  if (err.message.includes('Failed to fetch')) {
    return 'Server unavailable: Please try again later';
  }
  return err.message || 'An unexpected error occurred';
};

// Use in your error handling
} catch (err) {
  const userFriendlyError = handleNetworkError(err);
  setError(userFriendlyError);
}
```

### Global Error Handling

#### 1. **Unhandled Promise Rejections**
```javascript
// In your main server file
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1); // Exit for uncaught exceptions
});
```

#### 2. **Request Timeout Handling**
```javascript
// Add timeout to your fetch requests
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds

try {
  const response = await fetch(url, {
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  // Process response
} catch (err) {
  if (err.name === 'AbortError') {
    setError('Request timed out. Please try again.');
  } else {
    setError('Request failed: ' + err.message);
  }
}
```

### Error Logging & Monitoring

#### 1. **Structured Error Logging**
```javascript
const logError = (context, error, additionalData = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: error.message,
    stack: error.stack,
    ...additionalData
  };
  
  console.error('🚨 Error Log:', JSON.stringify(errorLog, null, 2));
  
  // In production, send to logging service
  // await logToService(errorLog);
};
```

#### 2. **User-Friendly Error Messages**
```javascript
const getErrorMessage = (error, context) => {
  const errorMessages = {
    'User not found': 'No user found with those details. Please try different search criteria.',
    'Network Error': 'Unable to connect to the server. Please check your internet connection.',
    'Validation Error': 'Please check your input and try again.',
    'Server Error': 'Something went wrong on our end. Please try again later.'
  };
  
  return errorMessages[error] || 'An unexpected error occurred. Please try again.';
};
```

### Best Practices

1. **Always use try-catch** around async operations
2. **Validate input** before processing
3. **Provide meaningful error messages** to users
4. **Log errors** with context for debugging
5. **Handle edge cases** (empty results, network issues)
6. **Use appropriate HTTP status codes**
7. **Implement retry logic** for transient failures
8. **Test error scenarios** during development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the API endpoints
3. Check MongoDB connection and data
4. Open an issue with detailed error information

## 🔄 Updates

- **v1.0.0**: Initial release with user search, order viewing, and item details
- **v1.1.0**: Added pagination, sorting, and improved search logic
- **v1.2.0**: Enhanced order statistics and item display

---

**Happy coding! 🚀**
