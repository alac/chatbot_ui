import { forwardRef } from 'react';
import VirtuosoConversationChatbox from './VirtuosoConversationChatbox';
import { ConversationChatboxMethods, ConversationChatboxProps } from './ConversationChatbox';


const implementations = {
    virtuoso: VirtuosoConversationChatbox,
    dummy: VirtuosoConversationChatbox,
};

type ImplementationKey = keyof typeof implementations;

interface SwitchableChatboxProps extends ConversationChatboxProps {
    implementation?: ImplementationKey;
}

const SwitchableChatbox = forwardRef<ConversationChatboxMethods, SwitchableChatboxProps>(
    ({ implementation = 'virtuoso', ...props }, ref) => {
        const SelectedImplementation = implementations[implementation] || VirtuosoConversationChatbox;

        return <SelectedImplementation ref={ref} {...props} />;
    }
);

export default SwitchableChatbox;