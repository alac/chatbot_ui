import { forwardRef } from 'react';
import NaiveConversationChatbox from './NaiveConversationChatbox';
import { ConversationChatboxMethods, ConversationChatboxProps } from './ConversationChatbox';


const implementations = {
    naive: NaiveConversationChatbox,
};

type ImplementationKey = keyof typeof implementations;

interface SwitchableChatboxProps extends ConversationChatboxProps {
    implementation?: ImplementationKey;
}

const SwitchableChatbox = forwardRef<ConversationChatboxMethods, SwitchableChatboxProps>(
    ({ implementation = 'naive', ...props }, ref) => {
        const SelectedImplementation = implementations[implementation] || NaiveConversationChatbox;

        return <SelectedImplementation ref={ref} {...props} />;
    }
);

export default SwitchableChatbox;