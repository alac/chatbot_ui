import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { VirtuosoMessageListProps, VirtuosoMessageListMethods, VirtuosoMessageList, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list';
import Delete from '@spectrum-icons/workflow/Delete';
import Deselect from '@spectrum-icons/workflow/Deselect';
import Compare from '@spectrum-icons/workflow/Compare';

import { DialogContent, DialogHeader, DialogOverlay, DialogTitle, DialogTrigger, } from "../../ui/dialog"
import { Button } from "../../ui/button"

import { storageManager, compressString, Message, decompressString } from '../../storage';
import { type } from 'os';


interface ConversationChatboxMethods {
    // adding new message on SEND
    // adding the new response on SEND
    appendMessage(message: Message): void;

    // deleting messages
    // *messageKey is message.key
    deleteMessage(messageKey: string): void;

    // updates messages in the chatbox using the callback
    // *for updating messages as tokens come in, AND when the user edits messages 
    updateMessages(callback: (message: Message) => Message): void;
}

interface ConversationChatboxProps {
    conversationId: string;
}

type ConversationChatboxRef = React.RefObject<ConversationChatboxMethods>;


const BaseWrapper = forwardRef<ConversationChatboxMethods, ConversationChatboxProps>((props: ConversationChatboxProps, ref) => {
    useImperativeHandle(ref, () => ({
        appendMessage: (message: Message) => {
            throw new Error('appendMessage not implemented');
        },
        deleteMessage: (messageKey: string) => {
            throw new Error('deleteMessage not implemented');
        },
        updateMessages: (callback: (message: Message) => Message) => {
            throw new Error('updateMessages not implemented');
        },
    }));

    return <div>Base Wrapper (Should be overridden)</div>;
});

export { BaseWrapper };
export type { ConversationChatboxMethods, ConversationChatboxProps, ConversationChatboxRef }