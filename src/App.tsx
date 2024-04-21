import React, { useState } from 'react';
import './App.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="app-container">
      <div className="top-container">
        <div className="messages-container">
          {/* Messages content */}
        </div>
        <div className="sidebar-container" style={{ width: sidebarCollapsed ? 'auto' : '200px' }}>
          {/* Sidebar content */}
          <button onClick={toggleSidebar}>{sidebarCollapsed ? '<<' : '>>'}</button>
        </div>
      </div>
      <div className="bottom-container">
        {/* Bottom container content */}
      </div>
    </div>
  );
}

export default App;