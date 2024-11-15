import { forwardRef, useEffect, useImperativeHandle, useState, useRef, Fragment } from 'react';

import { storageManager, Message } from '../../storage';
import { ConversationChatboxMethods, ConversationChatboxProps } from './ConversationChatbox';

import { ChatBubble } from './ChatBubble';

const AUTOSCROLL_THRESHOLD = 30;

const NaiveConversationChatbox = forwardRef<ConversationChatboxMethods, ConversationChatboxProps>((props: ConversationChatboxProps, ref) => {
    const [messageListUpdate, setMessageListUpdate] = useState(0); // used only to trigger updates
    const messageListRef = useRef<HTMLDivElement>(null);
    const [wasAtBottom, setWasAtBottom] = useState(false);

    const isScrolledToBottom = () => {
        if (messageListRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
            return scrollTop + clientHeight >= scrollHeight - AUTOSCROLL_THRESHOLD;
        }
        return false;
    };

    useEffect(() => {
        if (wasAtBottom && messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
            setWasAtBottom(false)
        }
    }, [wasAtBottom])

    useImperativeHandle(ref, () => ({
        appendMessage: (_message: Message) => {
            setWasAtBottom(isScrolledToBottom())
            setMessageListUpdate((v) => v + 1)
        },
        deleteMessage: (_messageKey: string) => {
            setMessageListUpdate((v) => v + 1)
        },
        updateMessages: (_callback: (message: Message) => Message) => {
            setMessageListUpdate((v) => v + 1)
            if (isScrolledToBottom() && messageListRef.current) {
                messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
            }
        },
    }));

    return <>
        <div
            ref={messageListRef}
            style={{
                maxHeight: "100%", minHeight: "100%", overflowY: "scroll",
                padding: "5px"
            }}
        >
            <div key={messageListUpdate}></div>
            {storageManager.messagesCurrent.map((m: Message, _index: number) => {
                if (m === undefined) {
                    return <Fragment key={_index} />;
                }
                return <ChatBubble data={m} key={m.key} />
            })}
        </div>
    </>
});


export default NaiveConversationChatbox;