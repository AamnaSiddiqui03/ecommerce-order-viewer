import React, { useState, useEffect } from 'react';
import './UserSearch.css';

const UserSearch = () => {
  const [searchParams, setSearchParams] = useState({
    first_name: '',
    last_name: '',
    email: '',
    age: ''
  });
  
  const [sortBy, setSortBy] = useState('first_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchStats, setSearchStats] = useState(null);
  const [pagination, setPagination] = useState({});
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const searchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...Object.fromEntries(
          Object.entries(searchParams).filter(([_, value]) => value.trim() !== '')
        )
      });

      const response = await fetch(`http://localhost:5000/api/users/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setSearchStats(data.searchStats);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getUserOrders = async (userId) => {
    try {
      console.log('Getting orders for user ID:', userId); // Debug log
      setLoadingOrders(true);
      
      // Clear previous user data and order items when switching users
      setUserOrders([]);
      setSelectedUser(null);
      setOrderItems([]);
      setSelectedOrder(null);
      setError(''); // Clear any previous errors
      
      // Get orders directly by user ID using the new endpoint
      const url = `http://localhost:5000/api/users/id/${userId}/orders`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setUserOrders(data.orders);
        setSelectedUser(data.user);
        console.log(`Loaded ${data.orders.length} orders for user ${data.user.first_name} ${data.user.last_name} (ID: ${userId})`);
      } else {
        setError(data.error || 'Failed to fetch user orders');
        console.error('API Error:', data.error);
      }
    } catch (err) {
      setError('Failed to fetch user orders: ' + err.message);
      console.error('Network Error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getOrderItems = async (orderId) => {
    try {
      // Clear previous order items and selected order first
      setOrderItems([]);
      setSelectedOrder(null);
      setError(''); // Clear any previous errors
      
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/items`);
      const data = await response.json();

      if (data.success) {
        setOrderItems(data.items);
        setSelectedOrder(data.order);
        console.log(`Loaded ${data.items.length} items for order ${orderId}`);
      } else {
        setError(data.error || 'Failed to fetch order items');
        setOrderItems([]);
        setSelectedOrder(null);
      }
    } catch (err) {
      setError('Failed to fetch order items: ' + err.message);
      setOrderItems([]);
      setSelectedOrder(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    // Clear previous search results and user data
    setUsers([]);
    setSelectedUser(null);
    setUserOrders([]);
    setSelectedOrder(null);
    setOrderItems([]);
    setError('');
    searchUsers();
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    searchUsers();
  };

  const clearSearch = () => {
    setSearchParams({
      first_name: '',
      last_name: '',
      email: '',
      age: ''
    });
    setPage(1);
    setSortBy('first_name');
    setSortOrder('asc');
    // Clear all search results and user data
    setUsers([]);
    setSelectedUser(null);
    setUserOrders([]);
    setSelectedOrder(null);
    setOrderItems([]);
    setError('');
  };

  useEffect(() => {
    searchUsers();
  }, [page, limit, sortBy, sortOrder]);

  return (
    <div className="user-search-container">
      <div className="search-header">
        <h1>🔍 User Search & Order Management</h1>
        <p>Search users by multiple criteria and view their order details</p>
      </div>

      {/* Search Form */}
      <div className="search-form-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name / Full Name</label>
              <input
                type="text"
                value={searchParams.first_name}
                onChange={(e) => setSearchParams({...searchParams, first_name: e.target.value})}
                placeholder="Enter first name or full name..."
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={searchParams.last_name}
                onChange={(e) => setSearchParams({...searchParams, last_name: e.target.value})}
                placeholder="Enter last name..."
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={searchParams.email}
                onChange={(e) => setSearchParams({...searchParams, email: e.target.value})}
                placeholder="Enter email..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={searchParams.age}
                onChange={(e) => setSearchParams({...searchParams, age: e.target.value})}
                placeholder="Enter age..."
                min="0"
                max="120"
              />
            </div>
            <div className="form-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="first_name">First Name</option>
                <option value="last_name">Last Name</option>
                <option value="email">Email</option>
                <option value="age">Age</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sort Order</label>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className="form-group">
              <label>Results Per Page</label>
              <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="form-group">
              <label>&nbsp;</label>
              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '🔍 Searching...' : '🔍 Search Users'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={clearSearch}>
                  🗑️ Clear
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Search Statistics */}
      {searchStats && (
        <div className="search-stats">
          <div className="stat-card">
            <h3>📊 Search Results</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Results:</span>
                <span className="stat-value">{searchStats.totalResults}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Current Page:</span>
                <span className="stat-value">{searchStats.currentPage} of {searchStats.totalPages}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Results Per Page:</span>
                <span className="stat-value">{searchStats.resultsPerPage}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Users Results */}
      {users.length > 0 && (
        <div className="results-container">
          <h2>👥 Search Results</h2>
          
          <div className="users-grid">
            {users.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <h3>{user.first_name || ''} {user.last_name || ''}</h3>
                  <span className="user-id">ID: {user.id}</span>
                </div>
                <div className="user-details">
                  <p><strong>📧 Email:</strong> {user.email}</p>
                  <p><strong>👤 Age:</strong> {user.age}</p>
                </div>
                <div className="user-actions">
                  <button 
                    className="btn btn-outline"
                    onClick={() => getUserOrders(user.id)}
                  >
                    📦 View Orders
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      console.log('User data:', user);
                      console.log('User ID:', user.id, 'Type:', typeof user.id);
                    }}
                    style={{ marginLeft: '10px', fontSize: '0.8rem', padding: '8px 12px' }}
                  >
                    🐛 Debug
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-outline"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {page} of {pagination.pages}
              </span>
              <button 
                className="btn btn-outline"
                disabled={page === pagination.pages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Orders */}
      {selectedUser && (
        <div className="orders-container">
          <h2>📦 Orders for {selectedUser.first_name || selectedUser.last_name}</h2>
          
          {loadingOrders ? (
            <div className="loading-spinner">
              <h3>🔍 Loading Orders...</h3>
              <p>Fetching orders for user ID: {selectedUser.id}</p>
            </div>
          ) : userOrders.length > 0 ? (
            <>
              <div className="user-summary">
                <div className="summary-card">
                  <h4>📊 User Summary</h4>
                  <p><strong>Total Orders:</strong> {userOrders.length}</p>
                  <p><strong>Total Items:</strong> {userOrders.reduce((sum, order) => sum + (order.num_of_item || 0), 0)}</p>
                  <p><strong>Active Orders:</strong> {userOrders.filter(order => order.status !== 'Cancelled').length}</p>
                  <p><strong>Cancelled Orders:</strong> {userOrders.filter(order => order.status === 'Cancelled').length}</p>
                </div>
              </div>
              
              <div className="orders-grid">
                {userOrders.map((order) => (
                  <div key={order.order_id} className="order-card">
                    <div className="order-header">
                      <h4>Order #{order.order_id}</h4>
                      <span className={`order-status status-${order.status?.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-details">
                      <p><strong>Items:</strong> {order.num_of_item}</p>
                      <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                      {order.shipped_at && <p><strong>Shipped:</strong> {new Date(order.shipped_at).toLocaleDateString()}</p>}
                      {order.delivered_at && <p><strong>Delivered:</strong> {new Date(order.delivered_at).toLocaleDateString()}</p>}
                    </div>
                    <button 
                      className="btn btn-outline"
                      onClick={() => getOrderItems(order.order_id)}
                    >
                      🛍️ View Items
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <h3>📭 No Orders Found</h3>
              <p>This user doesn't have any orders yet.</p>
              <p><strong>User ID:</strong> {selectedUser.id}</p>
              <p><strong>Debug Info:</strong> Check backend console for detailed logs</p>
              <p><strong>Try:</strong> Visit <code>/api/debug/datatypes</code> to check data types</p>
            </div>
          )}
        </div>
      )}

      {/* Order Items Modal */}
      {selectedOrder && orderItems.length > 0 && (
        <div className="order-items-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🛍️ Items in Order #{selectedOrder.id}</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setSelectedOrder(null);
                  setOrderItems([]);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="order-summary">
              <div className="summary-card">
                <h4>📋 Order Summary</h4>
                <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                <p><strong>Status:</strong> {selectedOrder.status}</p>
                <p><strong>Total Items:</strong> {orderItems.length}</p>
                <p><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                {selectedOrder.shipped_at && <p><strong>Shipped:</strong> {new Date(selectedOrder.shipped_at).toLocaleDateString()}</p>}
                {selectedOrder.delivered_at && <p><strong>Delivered:</strong> {new Date(selectedOrder.delivered_at).toLocaleDateString()}</p>}
              </div>
            </div>
            
            <div className="items-grid">
              {orderItems.map((item, index) => (
                <div key={`${item.id || item.product_id || index}-${selectedOrder.id}`} className="item-card">
                  <div className="item-header">
                    <h4>{item.product?.name || 'Unknown Product'}</h4>
                    <span className="item-id">Item ID: {item.id || index}</span>
                  </div>
                  <div className="item-details">
                    <p><strong>Product ID:</strong> {item.product_id}</p>
                    <p><strong>Category:</strong> {item.product?.category || 'Unknown'}</p>
                    <p><strong>Sale Price:</strong> ${item.sale_price?.toFixed(2) || '0.00'}</p>
                    <p><strong>Status:</strong> {item.status}</p>
                    <p><strong>Created:</strong> {new Date(item.created_at).toLocaleDateString()}</p>
                    {item.shipped_at && <p><strong>Shipped:</strong> {new Date(item.shipped_at).toLocaleDateString()}</p>}
                    {item.delivered_at && <p><strong>Delivered:</strong> {new Date(item.delivered_at).toLocaleDateString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && users.length === 0 && searchStats && (
        <div className="no-results">
          <h3>😔 No users found</h3>
          <p>Try adjusting your search criteria or clearing some filters.</p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
