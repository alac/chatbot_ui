import React, { forwardRef } from 'react';
import VirtuosoConversationChatbox from './VirtuosoConversationChatbox';
import { ConversationChatboxMethods, ConversationChatboxProps, ConversationChatboxRef } from './ConversationChatbox';


const implementations = {
    virtuoso: VirtuosoConversationChatbox,
    dummy: VirtuosoConversationChatbox,
};

type ImplementationKey = keyof typeof implementations;

interface SwitchableComponentProps extends ConversationChatboxProps {
    implementation?: ImplementationKey;
}

const SwitchableComponent = forwardRef<ConversationChatboxMethods, SwitchableComponentProps>(
    ({ implementation = 'virtuoso', ...props }, ref) => {
        const SelectedImplementation = implementations[implementation] || VirtuosoConversationChatbox;

        return <SelectedImplementation ref={ref} {...props} />;
    }
);

export default SwitchableComponent;