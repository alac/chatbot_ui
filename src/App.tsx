import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { VirtuosoMessageListProps, VirtuosoMessageListMethods, VirtuosoMessageList, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list';
import './App.css';

function App() {
  const virtuoso = React.useRef<VirtuosoMessageListMethods<Message>>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const bottomContainerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(window.innerHeight);
  const updateMaxHeight = () => {
    if (bottomContainerRef.current) {
      setMaxHeight(window.innerHeight - bottomContainerRef.current.offsetHeight);
      console.log("bottomContainerRef size")
      console.log(bottomContainerRef.current.offsetHeight)
    }
  };

  useEffect(() => {
    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    return () => window.removeEventListener('resize', updateMaxHeight);
  }, []);


  return (
    <div className="app-container">
      <div className="top-container">
        <div className="messages-container">
          {/* Messages content */}
          <VirtuosoMessageListLicense licenseKey="">
            <VirtuosoMessageList<Message, null>
              ref={virtuoso}
              style={{ height: maxHeight }}
              computeItemKey={(data: Message) => data.key}
              initialLocation={{ index: 'LAST', align: 'end' }}
              shortSizeAlign="bottom-smooth"
              ItemContent={ItemContent}
            />
          </VirtuosoMessageListLicense>
        </div>
        <div className="sidebar-container" style={{ width: sidebarCollapsed ? 'auto' : '200px' }}>
          {/* Sidebar content */}
          <button onClick={toggleSidebar}>{sidebarCollapsed ? '<<' : '>>'}</button>
        </div>
      </div>
      <BottomContainer ref={bottomContainerRef} virtuoso={virtuoso} />
    </div>
  );
}


interface BottomContainerProps {
  virtuoso: React.RefObject<VirtuosoMessageListMethods<Message, any>>;
}


const BottomContainer = React.forwardRef<HTMLDivElement, BottomContainerProps>(({ virtuoso }, ref) => {
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
          <button
            onClick={() => {
              const myMessage = randomMessage('me')
              virtuoso.current?.data.append([myMessage], ({ scrollInProgress, atBottom }: { scrollInProgress: boolean; atBottom: boolean }) => {
                return {
                  index: 'LAST',
                  align: 'end',
                  behavior: atBottom || scrollInProgress ? 'smooth' : 'auto',
                }
              })

              setTimeout(() => {
                const botMessage = randomMessage('other')
                virtuoso.current?.data.append([botMessage])

                let counter = 0
                const interval = setInterval(() => {
                  if (counter++ > 20) {
                    clearInterval(interval)
                  }
                  virtuoso.current?.data.map((message: Message) => {
                    return message.key === botMessage.key ? { ...message, text: message.text + ' ' + "asdfasdf" } : message
                  },
                    'smooth'
                  )
                }, 150)
              }, 1000)
            }}
          >
            Send
          </button>

          {/* <button>Send Choice</button>
          <button>Send Question</button>
          <button>Continue</button>
          <button>Continue Input</button>
          <button>Show Context</button> */}
        </div>
      </div>
    </div>
  );
});


const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = (data: Message) => {
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
        }}
      >
        {data.text}
      </div>
    </div>
  )
}


interface Message {
  key: string
  text: string
  user: 'me' | 'other'
}

let idCounter = 0

function randomMessage(user: Message['user']): Message {
  return { user, key: `${idCounter++}`, text: "ahfad ksfhasklhf aslkdfha lskdjhfal" }
}

export default App;