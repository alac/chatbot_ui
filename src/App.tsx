import React, { useState, useRef, useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from "./ui/button"
import { Tooltip, TooltipTrigger } from "./ui/tooltip"

import './App.css';
import { generate, buildPrompt, generateSettingsManager } from './generate';
import { storageManager, compressString, Message } from './storage';

import LorebookPanel from './components/LorebookPanel';
import ConversationsPanel from './components/ConversationsPanel';
import ConnectionPanel from './components/ConnectionPanel';
import ContextPanel from './components/ContextPanel';

import SwitchableChatbox from './components/Chatbox/SwitchableChatbox';
import { ConversationChatboxMethods } from './components/Chatbox/ConversationChatbox';


function App() {
  const chatboxRef = useRef<ConversationChatboxMethods>(null);

  const [conversationId, setConversationId] = useState("");
  useEffect(() => {
    storageManager.conversationLoadedCallback = () => {
      if (storageManager.storageState.currentConversationId) {
        setConversationId(storageManager.storageState.currentConversationId)
      }
    }
    storageManager.rerenderConversationCallback = () => {
      chatboxRef.current?.updateMessages((message: Message) => {
        const updatedMessage = storageManager.getMessage(message.key)
        if (updatedMessage != null) {
          return updatedMessage;
        }
        return message; // unreachable 
      });
    }
    storageManager.deletedMessageCallback = (deleteKey: string) => {
      chatboxRef.current?.deleteMessage(deleteKey);
    }
    return () => {
      storageManager.conversationLoadedCallback = null;
      storageManager.rerenderConversationCallback = null;
      storageManager.deletedMessageCallback = null;
    }
  }, [conversationId]);

  return (
    <div className="app-container">
      <PanelGroup direction="vertical">
        <Panel>
          <PanelGroup direction="horizontal">
            <Panel className="messages-container">
              {/* <SwitchableChatbox ref={chatboxRef} implementation="virtuoso" key={conversationId} /> */}
              <SwitchableChatbox ref={chatboxRef} implementation="naive" key={conversationId} />
            </Panel>
            <PanelResizeHandle />
            <Panel defaultSize={20} minSize={1} className="sidebar-container" style={{ overflow: 'auto' }}>
              <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
                <div className="flex items-center">
                  <span className="text-md font-medium">UI</span>
                </div>
              </div>
              <ConversationsPanel />
              <ConnectionPanel />
              <ContextPanel />
              <LorebookPanel />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={10} minSize={1} className="bottom-container">
          <BottomContainer chatboxRef={chatboxRef} />
        </Panel>
      </PanelGroup>
    </div>
  );
}





interface BottomContainerProps {
  chatboxRef: React.RefObject<ConversationChatboxMethods>;
}


const BottomContainer = ({ chatboxRef }: BottomContainerProps) => {
  const [inputValue, setInputValue] = useState('');
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

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
      storageManager.createAddEditEvent(userMessage)

      chatboxRef.current?.appendMessage(userMessage)
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
      chatboxRef.current?.appendMessage(botMessage)

      const prompt = await buildPrompt(
        storageManager.messagesCurrent,
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
          storageManager.createAddEditEvent(newMessage)
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
    <div className="bottom-container">
      <div className="input-area">
        <textarea
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
};


export default App;