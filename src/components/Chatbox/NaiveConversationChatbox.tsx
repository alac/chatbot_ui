import { forwardRef, useImperativeHandle, useState } from 'react';

import { storageManager, Message } from '../../storage';
import { ConversationChatboxMethods, ConversationChatboxProps } from './ConversationChatbox';

import { ChatBubble } from './ChatBubble';

const NaiveConversationChatbox = forwardRef<ConversationChatboxMethods, ConversationChatboxProps>((props: ConversationChatboxProps, ref) => {
    const [messageList, setMessageList] = useState<Message[]>(storageManager.currentConversation.messages)

    useImperativeHandle(ref, () => ({
        appendMessage: (message: Message) => {
            setMessageList((v) => [...v, message])
        },
        deleteMessage: (messageKey: string) => {
            setMessageList(messageList.filter((message: Message) => message.key !== messageKey))
        },
        updateMessages: (callback: (message: Message) => Message) => {
            setMessageList(messageList.map(callback))
        },
    }));

    return <>
        <div
            style={{ maxHeight: "100%", minHeight: "100%", overflowY: "scroll" }}
        >
            {/* this is a hack since, when sending a messages, the new user message gets added twice... somehow */}
            {storageManager.currentConversation.messages.map((m: Message, index: number) => {
                if (m === undefined) {
                    return <></>;
                }
                return <ChatBubble data={m} />
            })}
        </div>
    </>
});


export default NaiveConversationChatbox;