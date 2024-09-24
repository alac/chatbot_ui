import React, { forwardRef, useImperativeHandle } from 'react';
import { VirtuosoMessageListProps, VirtuosoMessageListMethods, VirtuosoMessageList, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list';

import { storageManager, Message } from '../../storage';
import { ConversationChatboxMethods, ConversationChatboxProps } from './ConversationChatbox';

import { ChatBubble } from './ChatBubble';

const NaiveConversationChatbox = forwardRef<ConversationChatboxMethods, ConversationChatboxProps>((props: ConversationChatboxProps, ref) => {
    const virtuosoChatbox = React.useRef<VirtuosoMessageListMethods<Message>>(null)

    useImperativeHandle(ref, () => ({
        appendMessage: (message: Message) => {
            virtuosoChatbox.current?.data.append([message], ({ scrollInProgress, atBottom }: { scrollInProgress: boolean; atBottom: boolean }) => {
                return {
                    index: 'LAST',
                    align: 'end',
                    behavior: atBottom || scrollInProgress ? 'smooth' : 'auto',
                }
            })
        },
        deleteMessage: (messageKey: string) => {
            virtuosoChatbox.current?.data.findAndDelete((message: Message, index: number): boolean => {
                return message.key === messageKey;
            })
        },
        updateMessages: (callback: (message: Message) => Message) => {
            virtuosoChatbox.current?.data.map(callback, 'smooth')
        },
    }));

    return <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, null>
            ref={virtuosoChatbox}
            style={{ maxHeight: "100%", minHeight: "100%" }}
            computeItemKey={(data: Message) => data.key}
            initialLocation={{ index: 'LAST', align: 'end' }}
            shortSizeAlign="bottom-smooth"
            ItemContent={ItemContent}
            key={props.conversationId}
            initialData={storageManager.currentConversation.messages}
        />
    </VirtuosoMessageListLicense>;
});

const ItemContent: VirtuosoMessageListProps<Message, null>['ItemContent'] = ChatBubble;


export default NaiveConversationChatbox;