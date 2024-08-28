import React, { useState, useRef, useEffect } from 'react';
import { VirtuosoMessageListProps, VirtuosoMessageListMethods, VirtuosoMessageList, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list';
import { DialogContent, DialogHeader, DialogOverlay, DialogTitle, DialogTrigger, } from "./ui/dialog"
import { Button } from "./ui/button"
import { Tooltip, TooltipTrigger } from "./ui/tooltip"
import Delete from '@spectrum-icons/workflow/Delete';
import Deselect from '@spectrum-icons/workflow/Deselect';
import Compare from '@spectrum-icons/workflow/Compare';

import './App.css';
import { generate, buildPrompt, generateSettingsManager } from './generate';
import { storageManager, compressString, Message, decompressString } from './storage';

import LorebookPanel from './components/LorebookPanel';
import ConversationsPanel from './components/ConversationsPanel';
import ConnectionPanel from './components/ConnectionPanel';
import ContextPanel from './components/ContextPanel';

import RailRightOpen from '@spectrum-icons/workflow/RailRightOpen';
import RailRightClose from '@spectrum-icons/workflow/RailRightClose';


function App() {
  const virtuosoChatbox = React.useRef<VirtuosoMessageListMethods<Message>>(null)


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
    storageManager.deletedMessageCallback = (deleteKey: string) => {
      virtuosoChatbox.current?.data.findAndDelete((message: Message, index: number): boolean => {
        return message.key === deleteKey;
      })
    }
    return () => {
      storageManager.conversationLoadedCallback = null;
      storageManager.rerenderConversationCallback = null;
      storageManager.deletedMessageCallback = null;
    }
  }, [conversationId]);

  const [panelWidth, setPanelWidth] = useState(200);

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
        <div className="sidebar-container" style={{ width: `${panelWidth}px`, height: chatLogHeight }}>

          <div className="flex items-center">
            <div className="ml-auto">
              <span className='corner-button'><Button size="icon" aria-label='Expand Sidebar' onPressEnd={() => { setPanelWidth(panelWidth + 50) }}><RailRightOpen /></Button></span>
              <span className='corner-button'><Button size="icon" aria-label='Contract Sidebar' onPressEnd={() => { setPanelWidth(Math.max(panelWidth - 50, 200)) }}><RailRightClose /></Button></span>
            </div>
          </div>

          <ConversationsPanel />
          <ConnectionPanel />
          <ContextPanel />
          <LorebookPanel />
        </div>
      </div>
      <BottomContainer ref={bottomContainerRef} virtuosoChatbox={virtuosoChatbox} />
    </div>
  );
}


const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = ({ data }: { data: Message }) => {
  const updateMessageText = (updatedText: string) => {
    storageManager.updateMessage({ ...data, text: updatedText, tokenCount: null })
    storageManager.save()
  }
  const toggleDisabled = () => {
    storageManager.updateMessage({ ...data, isDisabled: !data.isDisabled })
    storageManager.save()
  }
  const deleteMessage = () => {
    storageManager.deleteMessage(data.key)
    storageManager.save()
  }
  const [isEditing, setIsEditing] = useState(false);

  const promptButton = (< DialogTrigger >
    <span className='corner-button'><Button variant="outline" size="icon" aria-label='Show Prompt'><Compare /></Button></span>
    <DialogOverlay>
      <DialogContent className="max-w-[80%] max-h-[90%] overflow-y-scroll" closeButton={false}>
        <DialogHeader>
          <DialogTitle>Prompt</DialogTitle>
        </DialogHeader>
        <div style={{ whiteSpaceCollapse: 'preserve' }}>
          {decompressString(data.compressedPrompt)}
        </div>
      </DialogContent>
    </DialogOverlay>
  </DialogTrigger >
  )

  const ownMessage = data.userId === 'user'
  return (
    <div style={{ paddingBottom: '1rem', display: 'flex' }}>
      <div
        style={{
          minWidth: '200px',
          maxWidth: '80%',
          width: isEditing ? '80%' : 'auto',
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
        <div className="flex items-center">
          <span className="text-lg font-medium">{data.username}</span>
          <div className="ml-auto">
            <span className='corner-button'><Button variant="outline" size="icon" onPress={toggleDisabled} aria-label='Hide Message'><Deselect /></Button></span>
            <span className='corner-button'><Button variant="outline" size="icon" onPress={deleteMessage} aria-label='Delete Message'><Delete /></Button></span>
            {data.compressedPrompt !== "" ? promptButton : null}
          </div>
        </div>
        <EditableText initialText={data.text} onTextChange={updateMessageText} isEditing={isEditing} setIsEditing={setIsEditing} key={data.text} />
      </div>
    </div >
  )
}


const EditableText = ({ initialText, onTextChange, isEditing, setIsEditing }: { initialText: string, onTextChange: (updatedText: string) => void, isEditing: boolean, setIsEditing: (isEditing: boolean) => void }) => {
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
  const measureSpanHeight = () => {
    if (spanRef.current) {
      setWidthHeight([spanRef.current.offsetWidth, spanRef.current.offsetHeight])
    }
  }
  useEffect(measureSpanHeight, [isEditing])
  const setInitialTextareaSize = () => {
    if (textareaRef.current) {
      const [width, height] = widthHeight;
      textareaRef.current.style.minWidth = `${width}px`
      textareaRef.current.style.minHeight = `${height}px`
    }
  }
  useEffect(setInitialTextareaSize, [isEditing, widthHeight])

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
          className='message-body text-gray-700'
          style={{ width: '100%' }}
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


  const sendChatMessage = (isContinue: boolean) => {
    if (storageManager.storageState.currentConversationId === "") {
      storageManager.newConversation("Default Conversation")
    }

    if (!isContinue) {
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
    }
    setInputValue("")

    setTimeout(async () => {
      const botMessageId = `${storageManager.consumeMessageId()}`
      const botMessage: Message = {
        userId: 'bot',
        username: storageManager.currentConversation.botName,
        key: `${botMessageId}`,
        text: '',
        tokenCount: null,
        compressedPrompt: "",
        isDisabled: false,
      }
      storageManager.updateMessage(botMessage)
      virtuosoChatbox.current?.data.append([botMessage])

      const prompt = await buildPrompt(
        storageManager.currentConversation,
        generateSettingsManager.currentGenerateSettings,
        storageManager.getCurrentConnectionSettings(),
      )
      const compressedPrompt = compressString(prompt)
      botMessage.compressedPrompt = compressedPrompt
      storageManager.updateMessage(botMessage)

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

      generate(
        prompt,
        [`\n${storageManager.currentConversation.username}:`],
        storageManager.getCurrentConnectionSettings(),
        generateSettingsManager.currentGenerateSettings,
        responseWriter
      )
    }, 1000)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.shiftKey && event.key === 'Enter') {
      sendChatMessage(false)
    }
  };

  return (
    <div className="bottom-container" ref={ref}>
      <div className="input-area">
        <textarea
          ref={textareaRef}
          className="text-field"
          placeholder="Enter text here..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <div className="command-container">
          <TooltipTrigger>
            <Button onPress={() => sendChatMessage(false)}>Send</Button>
            <Tooltip>Send the message to chat (Shift+Enter)</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger>
            <Button onPress={() => sendChatMessage(true)}>Continue</Button>
            <Tooltip>Generate another response without sending a message.</Tooltip>
          </TooltipTrigger>
        </div>
      </div>
    </div>
  );
});


export default App;