import localforage from "localforage";
import { v4 as uuidv4 } from 'uuid';
import { deflate, inflate } from 'pako';

interface Conversation {
    conversationId: string;
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

function NewConversation(displayName: string, id: string): Conversation {
    return {
        conversationId: id,
        displayName: displayName,
        username: "User",
        botName: "Bot",
        messages: [],
        nextMessageId: 0,
        memory: "",
        authorNote: "[Note: this is a conversation]\n",
        authorNotePosition: 2,
        promptFormat: "[MEMORY]\n[MESSAGES]",
        lorebookIds: [],
    }
}

export function isConversation(obj: any): obj is Conversation {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'conversationId' in obj &&
        typeof obj.conversationId === 'string' &&
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
    lorebookName: string;
    lorebookEntry: LorebookEntry[];
}

export function isLorebook(obj: any): obj is Lorebook {
    return (
        typeof obj === "object" &&
        typeof obj.lorebookId === "string" &&
        typeof obj.lorebookName === "string" &&
        Array.isArray(obj.lorebookEntry)
    );
}

interface LorebookEntry {
    entryId: string;
    entryName: string;
    entryTrigger: string;
    entryBody: string;
    isEnabled: boolean;
    // promptInsertionTag: string;
}

export function isLorebookEntry(obj: any): obj is LorebookEntry {
    return (
        typeof obj === "object" &&
        typeof obj.entryId === "string" &&
        typeof obj.entryName === "string" &&
        typeof obj.entryTrigger === "string" &&
        typeof obj.entryBody === "string" &&
        typeof obj.isEnabled === "boolean"
    );
}


interface StorageState {
    currentConversationId: string | null;

    conversationIds: string[];

    lorebookMaxInsertionCount: number;
    lorebookMaxTokens: number;

    lorebookIds: string[];

    currentConnectionSettingsId: "DUMMY" | "OPENAI";
    connectionSettingsById: Map<string, AnyConnectionSettings>;
}

const isStorageState = (obj: unknown): obj is StorageState => {
    if ((
        typeof obj === "object" &&
        obj !== null &&
        ("currentConversationId" in obj &&
            (obj.currentConversationId === null || typeof obj.currentConversationId === "string")) &&
        ("conversationIds" in obj &&
            Array.isArray(obj.conversationIds) &&
            obj.conversationIds.every((id) => typeof id === "string")) &&
        ("lorebookMaxInsertionCount" in obj &&
            (typeof obj.lorebookMaxInsertionCount === "number")) &&
        ("lorebookMaxTokens" in obj &&
            (typeof obj.lorebookMaxTokens === "number")) &&
        ("lorebookIds" in obj &&
            Array.isArray(obj.lorebookIds) &&
            obj.lorebookIds.every((id) => typeof id === "string")) &&
        ("currentConnectionSettingsId" in obj &&
            (typeof obj.currentConnectionSettingsId === "string")) &&
        ("connectionSettingsById" in obj &&
            (obj.connectionSettingsById instanceof Map))
    ) === false) {
        console.log("type failed")
        return false;
    }

    for (const [key, value] of (obj as StorageState).connectionSettingsById) {
        if (
            typeof key !== "string" ||
            !(
                isDummyConnectionSettings(value) ||
                isOpenAIConnectionSettings(value)
            )
        ) {
            return false;
        }
    }

    return true;
};


interface DummyConnectionSettings {
    type: string;
    response: string;
}

function isDummyConnectionSettings(obj: any): obj is DummyConnectionSettings {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.type === "string" &&
        typeof obj.response === "string" &&
        Object.keys(obj).length === 2
    );
}


interface OpenAIConnectionSettings {
    type: string;
    url: string;
    apiKey: string;
    modelName: string;
}

function isOpenAIConnectionSettings(obj: any): obj is OpenAIConnectionSettings {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.type === "string" &&
        typeof obj.url === "string" &&
        typeof obj.apiKey === "string" &&
        typeof obj.modelName === "string" &&
        Object.keys(obj).length === 4
    );
}


type AnyConnectionSettings = DummyConnectionSettings | OpenAIConnectionSettings;


const STORAGE_STATE_KEY = "STORAGE_STATE"


class StorageManager {
    storageState: StorageState;
    currentConversation: Conversation;
    conversationLoadedCallback: (() => void) | null; // Conversation made active.
    conversationLifecycleCallback: (() => void) | null; // Conversation loaded from datastore, created, deleted, or made active.
    rerenderConversationCallback: (() => void) | null; // Message added or updated.
    lorebookUpdatedCallback: (() => void) | null; // Lorebook (or entry) updated, OR Lorebook enabled for Conversation.
    deletedMessageCallback: ((deleteKey: string) => void) | null;
    updateConnectionsPanelCallback: (() => void) | null;
    conversations: Map<string, Conversation>;
    lorebooks: Map<string, Lorebook>;

    constructor() {
        this.storageState = {
            currentConversationId: "",
            conversationIds: [],
            lorebookIds: [],
            lorebookMaxInsertionCount: 10,
            lorebookMaxTokens: 1000,
            currentConnectionSettingsId: "DUMMY",
            connectionSettingsById: new Map<string, DummyConnectionSettings | OpenAIConnectionSettings>()
        }
        this.currentConversation = NewConversation("", this.newConversationDBKey());
        this.conversations = new Map<string, Conversation>();
        this.lorebooks = new Map<string, Lorebook>();
        this.conversationLoadedCallback = null;
        this.conversationLifecycleCallback = null;
        this.lorebookUpdatedCallback = null;
        this.rerenderConversationCallback = null;
        this.deletedMessageCallback = null;
        this.updateConnectionsPanelCallback = null;
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
                    this.updateConnectionsPanelCallback?.();
                } else {
                    console.log("isStorageState typeguard failed; value: ", readValue)
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
                                this.conversationLoadedCallback?.()
                                this.conversationLifecycleCallback?.()
                            }
                            this.conversations.set(conversationId, readValue);
                        } else {
                            console.log("isConversation typeguard failed; value: ", readValue)
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
                            console.log("loaded LB: ", lorebookId);
                            this.lorebooks.set(lorebookId, readValue);
                            this.lorebookUpdatedCallback?.()
                        } else {
                            console.log("isLorebook failed; value: ", readValue)
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
                this.conversationLoadedCallback?.();
                this.lorebookUpdatedCallback?.() // enabled lorebooks changes per conversation
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

    newConversation(displayName: string): void {
        const newConversationId = this.newConversationDBKey()
        this.storageState.currentConversationId = newConversationId
        this.currentConversation = NewConversation(displayName, newConversationId)
        this.conversations.set(newConversationId, this.currentConversation)
        this.save()
        this.conversationLoadedCallback?.()
        this.conversationLifecycleCallback?.()
    }

    deleteConversation(conversationId: string): void {
        if (this.conversations.has(conversationId)) {
            this.conversations.delete(conversationId)
        }
        this.storageState.conversationIds = this.storageState.conversationIds.filter(item => item != conversationId)
        this.saveStorageState()
        localforage.removeItem(conversationId);
        this.conversationLifecycleCallback?.()
    }

    cloneConversation(oldConversationId: string, newConversationId: string): void {
        // this should probably use userfacing names
        throw new Error("Not implemented");
    }

    consumeMessageId(): number {
        return this.currentConversation.nextMessageId++;
    }

    updateMessage(message: Message, rerender: boolean = true): void {
        const messageId = message.key;
        const allMessageIds = this.currentConversation.messages.map((someMessage: Message) => someMessage.key)
        const index = allMessageIds.indexOf(messageId)
        if (index === -1) {
            this.currentConversation.messages.push(message)
            return
        }
        this.currentConversation.messages[index] = message
        if (this.rerenderConversationCallback && rerender) {
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

    createLorebook(lorebookName: string): LorebookId {
        const lorebookId: LorebookId = "LO_" + uuidv4();
        const lorebook: Lorebook = {
            lorebookId,
            lorebookName,
            lorebookEntry: []
        }

        localforage.setItem(lorebookId, lorebook);
        this.lorebooks.set(lorebookId, lorebook);
        this.storageState.lorebookIds = [...this.storageState.lorebookIds, lorebookId]
        this.saveStorageState();
        this.lorebookUpdatedCallback?.()
        return lorebookId;
    }

    saveLorebook(lorebookId: LorebookId, lorebook: Lorebook, triggerRefresh: boolean = false): void {
        localforage.setItem(lorebookId, lorebook);
        triggerRefresh && this.lorebookUpdatedCallback?.()
    }

    deleteLorebook(lorebookId: LorebookId): void {
        this.lorebooks.delete(lorebookId);
        this.storageState.lorebookIds = this.storageState.lorebookIds.filter((s: string) => s !== lorebookId)
        this.saveStorageState()
        localforage.removeItem(lorebookId);
        this.lorebookUpdatedCallback?.()
    }

    cloneLorebook(oldLorebookId: LorebookId, newLorebookId: LorebookId): void {
        // this should probably use userfacing names
        throw new Error("Not implemented");
    }

    updateLorebookOrder(lorebookIds: string[]): void {
        const validNewIds = lorebookIds.filter((s: string) => this.storageState.lorebookIds.includes(s))
        const missingOldIds = this.storageState.lorebookIds.filter((s: string) => !lorebookIds.includes(s))
        this.storageState.lorebookIds = [...validNewIds, ...missingOldIds];
        this.saveStorageState()
        this.lorebookUpdatedCallback?.()
    }

    getLorebookMaxTokens(): number {
        return this.storageState.lorebookMaxTokens;
    }
    setLorebookMaxTokens(value: number): void {
        this.storageState.lorebookMaxTokens = value;
        this.saveStorageState();
        this.lorebookUpdatedCallback?.()
    }

    getLorebookMaxInsertionCount(): number {
        return this.storageState.lorebookMaxInsertionCount;
    }

    setLorebookMaxInsertionCount(value: number): void {
        this.storageState.lorebookMaxInsertionCount = value;
        this.saveStorageState();
        this.lorebookUpdatedCallback?.()
    }

    getCurrentConnectionSettingsId(): string {
        return this.storageState.currentConnectionSettingsId;
    }

    setCurrentConnectionSettingsId(id: "DUMMY" | "OPENAI"): void {
        this.storageState.currentConnectionSettingsId = id;
        this.saveStorageState();
    }

    getCurrentConnectionSettings(): AnyConnectionSettings {
        const settings = this.storageState.connectionSettingsById.get(this.storageState.currentConnectionSettingsId);
        if (settings) {
            return settings;
        }
        throw Error("Invalid currentConnectionSettingsId: " + this.storageState.currentConnectionSettingsId);
    }

    getDummyConnectionSettingsById(id: string): DummyConnectionSettings {
        const dictValue = this.storageState.connectionSettingsById.get(id)
        if (dictValue !== undefined && isDummyConnectionSettings(dictValue)) {
            return dictValue;
        }
        return {
            type: "DUMMY",
            response: "This is a dummy bot response."
        }
    }

    getOpenAIConnectionSettingsById(id: string): OpenAIConnectionSettings {
        const dictValue = this.storageState.connectionSettingsById.get(id)
        if (dictValue !== undefined && isOpenAIConnectionSettings(dictValue)) {
            return dictValue;
        }
        return {
            type: "OPENAI",
            url: "Enter the URL here.",
            apiKey: "",
            modelName: "",
        }
    }

    setConnectionSettings(id: string, settings: AnyConnectionSettings): void {
        this.storageState.connectionSettingsById.set(id, settings);
        this.saveStorageState();
    }

    newUUID(): string {
        return uuidv4();
    }
}


type LorebookId = string;


function compressString(str: string): string {
    const compressedData = deflate(str);
    const numbers = Array.from(compressedData);
    return btoa(String.fromCharCode.apply(String, numbers));
}

function decompressString(compressedStr: string): string {
    const compressedData = atob(compressedStr);
    const decodedData = new Uint8Array(compressedData.length);
    for (let i = 0; i < compressedData.length; i++) {
        decodedData[i] = compressedData.charCodeAt(i);
    }
    return inflate(decodedData, { to: 'string' });
}


const storageManager = new StorageManager();

export { storageManager, compressString, decompressString, isDummyConnectionSettings, isOpenAIConnectionSettings }
export type { Message, Conversation, Lorebook, LorebookEntry, AnyConnectionSettings, DummyConnectionSettings, OpenAIConnectionSettings }