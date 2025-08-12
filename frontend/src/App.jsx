import React from 'react'
import UserSearch from './components/UserSearch'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Ecommerce Order Viewer</h1>
        <p>Search users, view orders, and explore order items</p>
      </header>
      
      <main className="app-main">
        <UserSearch />
      </main>

      <footer className="app-footer">
        <p>Built with React + Vite + MongoDB</p>
      </footer>
    </div>
  )
}

export default App
