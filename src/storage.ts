import localforage from "localforage";
import { v4 as uuidv4 } from 'uuid';

interface Conversation {
    displayName: string;
    username: string;
    botName: string;
    messages: Message[];
    nextMessageId: number;
    memory: string;
    authorNote: string;
    authorNotePosition: number;
    promptFormat: string;
    lorebookIds: string[];
    // connectionId: string;
    // generateSettingsId: string;
    // enabledPromptIds: string[]
}

function NewConversation(): Conversation {
    return {
        displayName: "New Conversation",
        username: "User",
        botName: "Bot",
        messages: [],
        nextMessageId: 0,
        memory: "",
        authorNote: "",
        authorNotePosition: 0,
        promptFormat: "[MEMORY]\n[MESSAGES]",
        lorebookIds: [],
    }
}

export function isConversation(obj: any): obj is Conversation {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'displayName' in obj &&
        typeof obj.displayName === 'string' &&
        'username' in obj &&
        typeof obj.username === 'string' &&
        'botName' in obj &&
        typeof obj.botName === 'string' &&
        'messages' in obj &&
        Array.isArray(obj.messages) &&
        obj.messages.every((message: any) => isMessage(message)) &&
        'nextMessageId' in obj &&
        typeof obj.nextMessageId === 'number' &&
        'memory' in obj &&
        typeof obj.memory === 'string' &&
        'authorNote' in obj &&
        typeof obj.authorNote === 'string' &&
        'authorNotePosition' in obj &&
        typeof obj.authorNotePosition === 'number' &&
        'promptFormat' in obj &&
        typeof obj.promptFormat === 'string' &&
        'lorebookIds' in obj &&
        Array.isArray(obj.lorebookIds) &&
        obj.lorebookIds.every((id: any) => typeof id === 'string')
    );
}

interface Message {
    userId: 'user' | 'bot';
    username: string;
    key: string;
    text: string;
    tokenCount: number | null;
    compressedPrompt: string;
    isDisabled: boolean;
}

const isMessage = (obj: any): obj is Message => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        ['user', 'bot'].includes(obj.userId) &&
        typeof obj.username === 'string' &&
        typeof obj.key === 'string' &&
        typeof obj.text === 'string' &&
        (obj.tokenCount === null || typeof obj.tokenCount === 'number') &&
        typeof obj.text === 'string' &&
        typeof obj.compressedPrompt === 'string' &&
        typeof obj.isDisabled === 'boolean'
    );
};

interface Lorebook {
    lorebookId: string;
    lorebookEntry: LorebookEntry[];
    lorebookMaxInsertionCount: number;
    lorebookScanRange: number;
}

export function isLorebook(obj: any): obj is Lorebook {
    return (
        typeof obj === "object" &&
        typeof obj.lorebookId === "string" &&
        Array.isArray(obj.lorebookEntry) &&
        typeof obj.lorebookMaxInsertionCount === "number" &&
        typeof obj.lorebookScanRange === "number"
    );
}

interface LorebookEntry {
    entryId: string;
    entryTrigger: string[];
    entryBody: string;
    // promptInsertionTag: string;
}

export function isLorebookEntry(obj: any): obj is LorebookEntry {
    return (
        typeof obj === "object" &&
        typeof obj.entryId === "string" &&
        Array.isArray(obj.entryTrigger) &&
        typeof obj.entryBody === "string"
    );
}


interface StorageManager {
    startup(): void;

    setConversation(conversationId: string): void;
    save(): void;
    newConversation(): void;
    cloneConversation(oldConversationId: string, newConversationId: string): void;

    currentConversation: Conversation;
    conversations: Map<string, Conversation>;

    consumeMessageId(): number;
    updateMessage(message: Message): void;
    getMessage(messageId: string): Message | null;
    deleteMessage(messageId: string): void;

    lorebooks: Map<string, Lorebook>;
    createLorebook(lorebookId: string): void;
    cloneLorebook(oldConversationId: string, newConversationId: string): void;
}


interface StorageState {
    currentConversationId: string | null;

    conversationIds: string[];
    lorebookIds: string[];
    // conversationNameToId: map<string, string>
    // lorebookNameToId: map<string, string>
}

const isStorageState = (obj: unknown): obj is StorageState => {
    return (
        typeof obj === "object" &&
        obj !== null &&
        ("currentConversationId" in obj &&
            (obj.currentConversationId === null || typeof obj.currentConversationId === "string")) &&
        ("conversationIds" in obj &&
            Array.isArray(obj.conversationIds) &&
            obj.conversationIds.every((id) => typeof id === "string")) &&
        ("lorebookIds" in obj &&
            Array.isArray(obj.lorebookIds) &&
            obj.lorebookIds.every((id) => typeof id === "string"))
    );
};


const STORAGE_STATE_KEY = "STORAGE_STATE"


class DefaultStorageManager implements StorageManager {
    storageState: StorageState;
    currentConversation: Conversation;
    conversationLoadedCallback: (() => void) | null;
    rerenderConversationCallback: (() => void) | null;
    deletedMessageCallback: ((deleteKey: string) => void) | null;
    conversations: Map<string, Conversation>;
    lorebooks: Map<string, Lorebook>;

    constructor() {
        this.storageState = {
            currentConversationId: this.newConversationDBKey(),
            conversationIds: [],
            lorebookIds: []
        }
        this.currentConversation = NewConversation();
        this.conversations = new Map<string, Conversation>();
        this.lorebooks = new Map<string, Lorebook>();
        this.conversationLoadedCallback = null;
        this.rerenderConversationCallback = null;
        this.deletedMessageCallback = null;
    }

    startup(): void {
        localforage.setDriver([
            localforage.INDEXEDDB,
            localforage.WEBSQL,
            localforage.LOCALSTORAGE
        ]).then(() => {
            localforage.getItem(STORAGE_STATE_KEY, (err, readValue) => {
                if (isStorageState(readValue)) {
                    this.storageState = readValue;
                } else {
                    console.log("storage state typeguard failed")
                }
                if (err !== null) {
                    console.log("Error in StorageManager reading STORAGE_STATE_KEY: ", err)
                }
            }).then(() => {
                this.storageState.conversationIds.map((conversationId: string) => {
                    localforage.getItem(conversationId, (err, readValue) => {
                        if (isConversation(readValue)) {
                            if (this.storageState.currentConversationId !== null && this.storageState.currentConversationId === conversationId) {
                                this.currentConversation = readValue;
                                if (this.conversationLoadedCallback) {
                                    this.conversationLoadedCallback();
                                }
                            }
                            this.conversations.set(conversationId, readValue);
                        } else {
                            console.log("currentConversation typeguard failed")
                        }
                        if (err !== null) {
                            console.log("Error in StorageManager reading conversations: ", err)
                        }
                    });
                    return null;
                });
                this.storageState.lorebookIds.map((lorebookId: string) => {
                    localforage.getItem(lorebookId, (err, readValue) => {
                        if (isLorebook(readValue)) {
                            this.lorebooks.set(lorebookId, readValue);
                        } else {
                            console.log("lorebook typeguard failed: ", readValue)
                        }
                        if (err !== null) {
                            console.log("Error in StorageManager reading lorebooks: ", err)
                        }
                    });
                    return null;
                });
            });
        });
    }

    saveStorageState(): void {
        localforage.setItem(STORAGE_STATE_KEY, this.storageState)
    }

    setConversation(conversationId: string): void {
        if (this.conversations.has(conversationId)) {
            const newConversation = this.conversations.get(conversationId)
            if (newConversation !== undefined) {
                this.currentConversation = newConversation;
                this.storageState.currentConversationId = conversationId;
                if (this.conversationLoadedCallback) {
                    this.conversationLoadedCallback();
                }
                this.saveStorageState()
            }
        }
    }

    save(): void {
        if (this.storageState.currentConversationId !== null) {
            const conversationId = this.storageState.currentConversationId;
            localforage.setItem(conversationId, this.currentConversation);
            if (this.storageState.conversationIds.indexOf(conversationId) === -1) {
                this.storageState.conversationIds.push(conversationId)
            }
        }
        this.saveStorageState()
    }

    newConversationDBKey() {
        return "CONV_" + uuidv4();
    }

    newConversation(): void {
        const newConversationId = this.newConversationDBKey()
        this.storageState.currentConversationId = newConversationId
        this.currentConversation = NewConversation()
        this.save()
        if (this.conversationLoadedCallback) {
            this.conversationLoadedCallback();
        }
    }

    cloneConversation(oldConversationId: string, newConversationId: string): void {
        // this should probably use userfacing names
        throw new Error("Not implemented");
    }

    consumeMessageId(): number {
        return this.currentConversation.nextMessageId++;
    }

    updateMessage(message: Message): void {
        const messageId = message.key;
        const allMessageIds = this.currentConversation.messages.map((someMessage: Message) => someMessage.key)
        const index = allMessageIds.indexOf(messageId)
        if (index === -1) {
            this.currentConversation.messages.push(message)
            return
        }
        this.currentConversation.messages[index] = message
        if (this.rerenderConversationCallback) {
            this.rerenderConversationCallback()
        }
    }

    getMessage(messageId: string): Message | null {
        const allMessageIds = this.currentConversation.messages.map((someMessage: Message) => someMessage.key)
        const index = allMessageIds.indexOf(messageId)
        if (index === -1) {
            return null
        }
        return this.currentConversation.messages[index]
    }

    deleteMessage(messageId: string): void {
        const newMessageList = this.currentConversation.messages.filter((someMessage: Message) => someMessage.key !== messageId)
        this.currentConversation.messages = newMessageList
        if (this.deletedMessageCallback) {
            this.deletedMessageCallback(messageId)
        }
    }

    createLorebook(lorebookId: string): void {
        throw new Error("Not implemented");
    }

    cloneLorebook(oldLorebookId: string, newLorebookId: string): void {
        // this should probably use userfacing names
        throw new Error("Not implemented");
    }
}



const storageManager = new DefaultStorageManager();

export { storageManager }
export type { Message, Conversation, Lorebook, LorebookEntry }