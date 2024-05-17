import React, { useState, useRef, useEffect } from 'react';
import { VirtuosoMessageListProps, VirtuosoMessageListMethods, VirtuosoMessageList, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list';
import './App.css';

import { generate, buildPrompt, generateSettingsManager } from './generate';
import { storageManager, Message } from './storage';


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


  const [conversationId, setConversationId] = useState("");
  useEffect(() => {
    storageManager.conversationLoadedCallback = () => {
      if (storageManager.storageState.currentConversationId) {
        setConversationId(storageManager.storageState.currentConversationId)
      }
    }
    storageManager.rerenderConversationCallback = () => {
      virtuosoChatbox.current?.data.map((message: Message) => {
        const updatedMessage = storageManager.getMessage(message.key)
        if (updatedMessage != null) {
          return updatedMessage;
        }
        return message; // unreachable 
      },
        'smooth'
      )
    }
    return () => {
      storageManager.conversationLoadedCallback = null;
      storageManager.rerenderConversationCallback = null;
    }
  }, [conversationId]);

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
              key={conversationId}
              initialData={storageManager.currentConversation.messages}
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


const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = ({ data }: { data: Message }) => {
  const updateMessageText = (updatedText: string) => {
    storageManager.updateMessage({ ...data, text: updatedText })
    storageManager.save()
  }
  const toggleDisabled = () => {
    storageManager.updateMessage({ ...data, isDisabled: !data.isDisabled })
    storageManager.save()
  }

  const ownMessage = data.userId === 'user'
  return (
    <div style={{ paddingBottom: '2rem', display: 'flex' }}>
      <div
        style={{
          maxWidth: '80%',
          marginLeft: data.userId === 'user' ? 'auto' : undefined,

          background: ownMessage ? '#0253B3' : '#F0F0F3',
          color: ownMessage ? 'white' : 'black',
          borderRadius: '1rem',
          padding: '1rem',
          whiteSpace: 'pre',
          textWrap: 'wrap',
          opacity: `${data.isDisabled ? .5 : 1}`,
        }}
      >
        {data.username} <span title="Hide From History" onClick={toggleDisabled}>👻</span>
        <EditableText initialText={data.text} onTextChange={updateMessageText} key={data.text} />
      </div>
    </div >
  )
}


const EditableText = ({ initialText, onTextChange }: { initialText: string, onTextChange: (updatedText: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTextChange(text);
  };

  const handleTextEdit = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const [widthHeight, setWidthHeight] = useState([0, 0])
  const setInitialTextareaSize = () => {
    if (spanRef.current) {
      setWidthHeight([spanRef.current.offsetWidth, spanRef.current.offsetHeight])
    }
    if (textareaRef.current) {
      const [width, height] = widthHeight;
      textareaRef.current.style.minWidth = `${width}px`
      textareaRef.current.style.minHeight = `${height}px`
    }
  }
  useEffect(setInitialTextareaSize, [isEditing])

  const expandTextareaDuringEditing = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }
  useEffect(expandTextareaDuringEditing, [text]);

  return (
    <div
      onClick={handleFocus}
      onBlur={handleBlur}
      style={{ border: '1px solid #ccc', padding: '10px', cursor: 'pointer' }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextEdit}
          autoFocus
          className='message-body'
        />
      ) : (
        <span
          ref={spanRef}
          className='message-body'
        >{text}</span>
      )}
    </div>
  );
};


interface BottomContainerProps {
  virtuosoChatbox: React.RefObject<VirtuosoMessageListMethods<Message, any>>;
}


const BottomContainer = React.forwardRef<HTMLDivElement, BottomContainerProps>(({ virtuosoChatbox }, ref) => {
  const [inputValue, setInputValue] = useState('');
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };


  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expandTextareaDuringEdit = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }
  useEffect(expandTextareaDuringEdit, [inputValue]);


  const sendChatMessage = () => {
    const userMessageId = `${storageManager.consumeMessageId()}`
    const userMessage: Message = {
      userId: 'user',
      username: storageManager.currentConversation.username,
      key: `${userMessageId}`,
      text: inputValue,
      tokenCount: null,
      compressedPrompt: '',
      isDisabled: false,
    }
    storageManager.updateMessage(userMessage)

    virtuosoChatbox.current?.data.append([userMessage], ({ scrollInProgress, atBottom }: { scrollInProgress: boolean; atBottom: boolean }) => {
      return {
        index: 'LAST',
        align: 'end',
        behavior: atBottom || scrollInProgress ? 'smooth' : 'auto',
      }
    })
    setInputValue("")

    setTimeout(async () => {
      const botMessageId = `${storageManager.consumeMessageId()}`
      const botMessage: Message = {
        userId: 'bot',
        username: storageManager.currentConversation.botName,
        key: `${botMessageId}`,
        text: '',
        tokenCount: null,
        compressedPrompt: '',
        isDisabled: false,
      }
      storageManager.updateMessage(botMessage)
      virtuosoChatbox.current?.data.append([botMessage])

      const responseWriter = (token: string, done: boolean) => {
        const oldMessage = storageManager.getMessage(botMessageId)
        if (oldMessage == null) {
          return
        }
        const newMessage = { ...oldMessage, text: oldMessage?.text + token }
        storageManager.updateMessage(newMessage)
        if (done) {
          storageManager.save()
        }
      }
      const prompt = await buildPrompt(
        storageManager.currentConversation,
        generateSettingsManager.currentGenerateSettings,
        generateSettingsManager.getDefaultConnectionSettings()
      )
      generate(
        prompt,
        [`\n${storageManager.currentConversation.username}:`],
        generateSettingsManager.getDefaultConnectionSettings(),
        generateSettingsManager.currentGenerateSettings,
        responseWriter
      )
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

          <button onClick={() => { storageManager.save(); }}>
            Save
          </button>
          <button onClick={() => { storageManager.newConversation(); }}>
            New Conversation
          </button>
        </div>
      </div>
    </div>
  );
});


export default App;