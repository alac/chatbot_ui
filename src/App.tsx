import React, { useState, useRef, useEffect } from 'react';
import { VirtuosoMessageListProps, VirtuosoMessageListMethods, VirtuosoMessageList, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list';
import './App.css';

import { generate, settingsManager } from './generate';


function App() {
  const virtuosoChatbox = React.useRef<VirtuosoMessageListMethods<Message>>(null)


  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };


  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const bottomContainerRef = useRef<HTMLDivElement>(null);
  const [chatLogHeight, setChatLogHeight] = useState(window.innerHeight);
  useEffect(() => {
    const updateChatLogHeight = () => {
      if (bottomContainerRef.current) {
        setChatLogHeight(windowHeight - bottomContainerRef.current.offsetHeight);
      }
    };
    const resizeObserver = new ResizeObserver(updateChatLogHeight);
    if (bottomContainerRef.current) {
      resizeObserver.observe(bottomContainerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [windowHeight]);


  return (
    <div className="app-container">
      <div className="top-container">
        <div className="messages-container"  >
          <VirtuosoMessageListLicense licenseKey="">
            <VirtuosoMessageList<Message, null>
              ref={virtuosoChatbox}
              style={{ maxHeight: chatLogHeight, minHeight: chatLogHeight }}
              computeItemKey={(data: Message) => data.key}
              initialLocation={{ index: 'LAST', align: 'end' }}
              shortSizeAlign="bottom-smooth"
              ItemContent={ItemContent}
            />
          </VirtuosoMessageListLicense>
        </div>
        <div className="sidebar-container" style={{ width: sidebarCollapsed ? 'auto' : '200px', height: chatLogHeight }}>
          <button onClick={toggleSidebar}>{sidebarCollapsed ? '<<' : '>>'}</button>
        </div>
      </div>
      <BottomContainer ref={bottomContainerRef} virtuosoChatbox={virtuosoChatbox} />
    </div>
  );
}


interface Message {
  key: string
  text: string
  user: 'me' | 'other'
}


const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = ({ data }: { data: Message }) => {
  const ownMessage = data.user === 'me'

  return (
    <div style={{ paddingBottom: '2rem', display: 'flex' }}>
      <div
        style={{
          maxWidth: '80%',
          marginLeft: data.user === 'me' ? 'auto' : undefined,

          background: ownMessage ? '#0253B3' : '#F0F0F3',
          color: ownMessage ? 'white' : 'black',
          borderRadius: '1rem',
          padding: '1rem',
          whiteSpace: 'pre',
          textWrap: 'wrap',
        }}
      >
        {data.text}
      </div>
    </div>
  )
}


interface BottomContainerProps {
  virtuosoChatbox: React.RefObject<VirtuosoMessageListMethods<Message, any>>;
}


const BottomContainer = React.forwardRef<HTMLDivElement, BottomContainerProps>(({ virtuosoChatbox }, ref) => {
  const [inputValue, setInputValue] = useState('');
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };


  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Allow textarea to resize naturally based on content
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputValue]);


  const [messageId, setMessageId] = useState(0);
  const sendChatMessage = () => {
    setMessageId(messageId + 2)

    const myMessage = { user: 'me' as 'me', key: `${messageId}`, text: inputValue }
    virtuosoChatbox.current?.data.append([myMessage], ({ scrollInProgress, atBottom }: { scrollInProgress: boolean; atBottom: boolean }) => {
      return {
        index: 'LAST',
        align: 'end',
        behavior: atBottom || scrollInProgress ? 'smooth' : 'auto',
      }
    })
    setInputValue("")

    setTimeout(() => {
      const botMessage = { user: 'other' as 'other', key: `${messageId + 1}`, text: "" }
      virtuosoChatbox.current?.data.append([botMessage])

      const responseWriter = (token: string, done: boolean) => {
        virtuosoChatbox.current?.data.map((message: Message) => {
          if (message.key != botMessage.key) {
            return message;
          }
          return { ...message, "text": message.text + token }
        },
          'smooth'
        )
      }
      generate(inputValue, settingsManager.getDefaultSettings(), responseWriter)
    }, 1000)
  }

  return (
    <div className="bottom-container" ref={ref}>
      <div className="input-area">
        <textarea
          ref={textareaRef}
          className="text-field"
          placeholder="Enter text here..."
          value={inputValue}
          onChange={handleInputChange}
        />
        <div className="command-container">
          <button onClick={sendChatMessage}>
            Send
          </button>

          <button>Send#1</button>
          <button>Send#2</button>
        </div>
      </div>
    </div>
  );
});


export default App;