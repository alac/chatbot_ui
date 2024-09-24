import { forwardRef } from 'react';
import NaiveConversationChatbox from './NaiveConversationChatbox';
import VirtuosoConversationChatbox from './VirtuosoConversationChatbox';
import { ConversationChatboxMethods, ConversationChatboxProps } from './ConversationChatbox';


const implementations = {
    virtuoso: VirtuosoConversationChatbox,
    naive: NaiveConversationChatbox,
};

type ImplementationKey = keyof typeof implementations;

interface SwitchableChatboxProps extends ConversationChatboxProps {
    implementation?: ImplementationKey;
}

const SwitchableChatbox = forwardRef<ConversationChatboxMethods, SwitchableChatboxProps>(
    ({ implementation = 'virtuoso', ...props }, ref) => {
        const SelectedImplementation = implementations[implementation] || NaiveConversationChatbox;

        return <SelectedImplementation ref={ref} {...props} />;
    }
);

export default SwitchableChatbox;