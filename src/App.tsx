import React, { useState, useRef, useEffect } from 'react';
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
      <BottomContainer></BottomContainer>
    </div>
  );
}

function BottomContainer() {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Allow textarea to resize naturally based on content
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"; // Set height based on scrollHeight
    }
  }, [inputValue]); // Update height whenever inputValue changes

  return (
    <div className="bottom-container">
      <div className="input-area">
        <textarea
          ref={textareaRef}
          className="text-field"
          placeholder="Enter text here..."
          value={inputValue}
          onChange={handleInputChange}
        />
        <div className="command-container">
          <button>Send</button>
          <button>Send Choice</button>
          <button>Send Question</button>
          <button>Continue</button>
          <button>Continue Input</button>
          <button>Show Context</button>
        </div>
      </div>
    </div>
  );
}




export default App;