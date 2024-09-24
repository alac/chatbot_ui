import { forwardRef, useImperativeHandle, useState } from 'react';

import { storageManager, Message } from '../../storage';
import { ConversationChatboxMethods, ConversationChatboxProps } from './ConversationChatbox';

import { ChatBubble } from './ChatBubble';

const NaiveConversationChatbox = forwardRef<ConversationChatboxMethods, ConversationChatboxProps>((props: ConversationChatboxProps, ref) => {
    const [_messageListUpdate, setMessageListUpdate] = useState(0)

    useImperativeHandle(ref, () => ({
        appendMessage: (_message: Message) => {
            setMessageListUpdate((v) => v + 1)
        },
        deleteMessage: (_messageKey: string) => {
            setMessageListUpdate((v) => v + 1)
        },
        updateMessages: (_callback: (message: Message) => Message) => {
            setMessageListUpdate((v) => v + 1)
        },
    }));

    return <>
        <div
            style={{ maxHeight: "100%", minHeight: "100%", overflowY: "scroll" }}
        >
            {storageManager.currentConversation.messages.map((m: Message, _index: number) => {
                if (m === undefined) {
                    return <></>;
                }
                return <ChatBubble data={m} />
            })}
        </div>
    </>
});


export default NaiveConversationChatbox;