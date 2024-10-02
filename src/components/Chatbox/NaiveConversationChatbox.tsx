import { forwardRef, useImperativeHandle, useState, useRef } from 'react';

import { storageManager, Message } from '../../storage';
import { ConversationChatboxMethods, ConversationChatboxProps } from './ConversationChatbox';

import { ChatBubble } from './ChatBubble';

const NaiveConversationChatbox = forwardRef<ConversationChatboxMethods, ConversationChatboxProps>((props: ConversationChatboxProps, ref) => {
    const [messageListUpdate, setMessageListUpdate] = useState(0); // used only to trigger updates
    const messageListRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        appendMessage: (_message: Message) => {
            setMessageListUpdate((v) => v + 1)
            if (messageListRef.current) {
                messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
            }
        },
        deleteMessage: (_messageKey: string) => {
            setMessageListUpdate((v) => v + 1)
        },
        updateMessages: (_callback: (message: Message) => Message) => {
            setMessageListUpdate((v) => v + 1)
            if (messageListRef.current) {
                messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
            }
        },
    }));

    return <>
        <div
            ref={messageListRef}
            style={{ maxHeight: "100%", minHeight: "100%", overflowY: "scroll" }}
        >
            <div key={messageListUpdate}></div>
            {storageManager.messagesCurrent.map((m: Message, _index: number) => {
                if (m === undefined) {
                    return <></>;
                }
                return <ChatBubble data={m} />
            })}
        </div>
    </>
});


export default NaiveConversationChatbox;