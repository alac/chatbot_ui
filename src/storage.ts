import localforage from "localforage";
import { v4 as uuidv4 } from 'uuid';
import { deflate, inflate } from 'pako';

interface Conversation {
    conversationId: string;
    displayName: string;
    username: string;
    botName: string;
    editEvents: EditEvent[];
    editEventsRedoQueue: EditEvent[];
    nextMessageId: number;
    memory: string;
    authorNote: string;
    authorNotePosition: number;
    promptFormat: string;
    lorebookIds: string[];
}

function NewConversation(displayName: string, id: string): Conversation {
    return {
        conversationId: id,
        displayName: displayName,
        username: "User",
        botName: "Bot",
        editEvents: [],
        editEventsRedoQueue: [],
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
        typeof obj === 'object' && obj !== null &&
        'conversationId' in obj && typeof obj.conversationId === 'string' &&
        'displayName' in obj && typeof obj.displayName === 'string' &&
        'username' in obj && typeof obj.username === 'string' &&
        'botName' in obj && typeof obj.botName === 'string' &&
        ('editEvents' in obj && Array.isArray(obj.editEvents) &&
            obj.editEvents.every((editEvent: any) => isEditEvent(editEvent))) &&
        ('editEventsRedoQueue' in obj && Array.isArray(obj.editEventsRedoQueue) &&
            obj.editEventsRedoQueue.every((editEvent: any) => isEditEvent(editEvent))) &&
        'nextMessageId' in obj && typeof obj.nextMessageId === 'number' &&
        'memory' in obj && typeof obj.memory === 'string' &&
        'authorNote' in obj && typeof obj.authorNote === 'string' &&
        'authorNotePosition' in obj && typeof obj.authorNotePosition === 'number' &&
        'promptFormat' in obj && typeof obj.promptFormat === 'string' &&
        ('lorebookIds' in obj && Array.isArray(obj.lorebookIds) &&
            obj.lorebookIds.every((id: any) => typeof id === 'string'))
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
        typeof obj === 'object' && obj !== null &&
        'userId' in obj && ['user', 'bot'].includes(obj.userId) &&
        'username' in obj && typeof obj.username === 'string' &&
        'key' in obj && typeof obj.key === 'string' &&
        'text' in obj && typeof obj.text === 'string' &&
        'tokenCount' in obj && (obj.tokenCount === null || typeof obj.tokenCount === 'number') &&
        'compressedPrompt' in obj && typeof obj.compressedPrompt === 'string' &&
        'isDisabled' in obj && typeof obj.isDisabled === 'boolean'
    );
};


interface EditEvent {
    editId: number;
    type: EventType;
}

enum EventType {
    Add = 'add',
    Update = 'update',
    Delete = 'delete',
}

interface EditEventAdd extends EditEvent {
    editId: number;
    type: EventType.Add;
    addMessage: Message;
}

const isEditEventAdd = (obj: any): obj is EditEventAdd => {
    return (
        typeof obj === 'object' && obj !== null &&
        'editId' in obj && typeof obj.editId === 'number' &&
        'type' in obj && [EventType.Add].includes(obj.type)
        && 'addMessage' in obj && typeof obj.addMessage === 'object' && isMessage(obj.addMessage)
    );
};

interface EditEventUpdate extends EditEvent {
    editId: number;
    type: EventType.Update;
    updateMessage: Partial<Message> & { key: string };
}

const isEditEventUpdate = (obj: any): obj is EditEventUpdate => {
    return (
        typeof obj === 'object' && obj !== null &&
        'editId' in obj && typeof obj.editId === 'number' &&
        'type' in obj && [EventType.Update].includes(obj.type) &&
        'updateMessage' in obj && typeof obj.updateMessage === 'object' &&
        'key' in obj.updateMessage && typeof obj.updateMessage.key === 'string'
    );
};

interface EditEventDelete extends EditEvent {
    editId: number;
    type: EventType.Delete;
    deleteKey?: string;
}

const isEditEventDelete = (obj: any): obj is EditEventDelete => {
    return (
        typeof obj === 'object' && obj !== null &&
        'editId' in obj && typeof obj.editId === 'number' &&
        'type' in obj && [EventType.Delete].includes(obj.type) &&
        'deleteKey' in obj && typeof obj.deleteKey === 'string'
    );
};

const isEditEvent = (obj: any): obj is EditEvent => {
    return (
        typeof obj === 'object' && obj !== null &&
        'editId' in obj && typeof obj.editId === 'number' &&
        'type' in obj && [EventType.Add, EventType.Delete, EventType.Update].includes(obj.type)
        && (isEditEventAdd(obj) || isEditEventUpdate(obj) || isEditEventDelete(obj))
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
        console.log("isStorageState typeguard failed")
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
    messagesCurrent: Message[];
    messagesPrevious: Message[];
    currentConversation: Conversation;
    conversationLoadedCallback: (() => void) | null; // Conversation made active.
    conversationLifecycleCallback: (() => void) | null; // Conversation loaded from datastore, created, deleted, or made active.
    rerenderConversationCallback: (() => void) | null; // Message added or updated.
    lorebookUpdatedCallback: (() => void) | null; // Lorebook (or entry) updated, OR Lorebook enabled for Conversation.
    contextUpdatedCallback: (() => void) | null;
    deletedMessageCallback: ((deleteKey: string) => void) | null;
    updateConnectionsPanelCallback: (() => void) | null;
    conversations: Map<string, Conversation>;
    lorebooks: Map<string, Lorebook>;

    constructor() {
        const defaultConnections = new Map<string, DummyConnectionSettings | OpenAIConnectionSettings>()
        defaultConnections.set("DUMMY", { type: "DUMMY", response: "Click the edit button on the connections panel to set-up a connection to the AI" })

        this.storageState = {
            currentConversationId: "",
            conversationIds: [],
            lorebookIds: [],
            lorebookMaxInsertionCount: 10,
            lorebookMaxTokens: 1000,
            currentConnectionSettingsId: "DUMMY",
            connectionSettingsById: defaultConnections
        }
        this.messagesCurrent = [];
        this.messagesPrevious = [];
        this.currentConversation = NewConversation("", this.newConversationDBKey());
        this.conversations = new Map<string, Conversation>();
        this.lorebooks = new Map<string, Lorebook>();
        this.conversationLoadedCallback = null;
        this.conversationLifecycleCallback = null;
        this.lorebookUpdatedCallback = null;
        this.contextUpdatedCallback = null;
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
                    this.storageState = readValue
                    this.updateConnectionsPanelCallback?.()
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
                            this.conversations.set(conversationId, readValue)
                            if (this.storageState.currentConversationId !== null && this.storageState.currentConversationId === conversationId) {
                                this.currentConversation = readValue
                                this.messagesCurrent = this.applyEditEvents([], this.currentConversation.editEvents)
                                this.messagesPrevious = [...this.messagesCurrent]
                                this.conversationLoadedCallback?.()
                                this.contextUpdatedCallback?.()
                            }
                            this.conversationLifecycleCallback?.()
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
                this.messagesCurrent = this.applyEditEvents([], this.currentConversation.editEvents)
                this.messagesPrevious = [...this.messagesCurrent]
                this.conversationLoadedCallback?.();
                this.lorebookUpdatedCallback?.() // enabled lorebooks changes per conversation
                this.contextUpdatedCallback?.()
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
        this.storageState.conversationIds = this.storageState.conversationIds.filter(item => item !== conversationId)
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
        const allMessageIds = this.messagesCurrent.map((someMessage: Message) => someMessage.key)
        const index = allMessageIds.indexOf(messageId)
        if (index === -1) {
            this.messagesCurrent.push(message)
            return
        }
        this.messagesCurrent[index] = message
        if (this.rerenderConversationCallback && rerender) {
            this.rerenderConversationCallback()
        }
    }

    getMessage(messageId: string): Message | null {
        const allMessageIds = this.messagesCurrent.map((someMessage: Message) => someMessage.key)
        const index = allMessageIds.indexOf(messageId)
        if (index === -1) {
            return null
        }
        return this.messagesCurrent[index]
    }

    deleteMessage(messageId: string): void {
        const newMessageList = this.messagesCurrent.filter((someMessage: Message) => someMessage.key !== messageId)
        this.messagesCurrent = newMessageList
        if (this.deletedMessageCallback) {
            this.deletedMessageCallback(messageId)
        }
    }

    createDeleteEditEvent(messageId: string): void {
        const prevMatches = this.messagesPrevious.filter((m: Message) => m.key === messageId)
        if (prevMatches.length === 0) {
            console.error("createUpdateEditEvent called for a message that does not have any match")
            return
        } else if (prevMatches.length > 1) {
            console.error("createUpdateEditEvent called for a message that has multiple matches")
            return
        }

        const editEvent: EditEventDelete = {
            editId: this.currentConversation.editEvents.length,
            type: EventType.Delete,
            deleteKey: messageId,
        }
        this.commitEditEvents([editEvent])
    }

    createAddEditEvent(message: Message): void {
        const prevMatches = this.messagesPrevious.filter((m: Message) => m.key === message.key)
        if (prevMatches.length !== 0) {
            console.error("createAddEditEvent called for a message that already exists")
        }

        const editEvent: EditEventAdd = {
            editId: this.currentConversation.editEvents.length,
            type: EventType.Add,
            addMessage: message
        }
        this.commitEditEvents([editEvent])
    }

    createUpdateEditEvent(message: Partial<Message> & { key: string }): void {
        const prevMatches = this.messagesPrevious.filter((m: Message) => m.key === message.key)
        if (prevMatches.length === 0) {
            console.error("createUpdateEditEvent called for a message that does not have any match")
            return
        } else if (prevMatches.length > 1) {
            console.error("createUpdateEditEvent called for a message that has multiple matches")
            return
        }

        const prevMessage = prevMatches[0];
        const diffsMessage = getDifferences(prevMessage, message);
        if (Object.keys(diffsMessage).length === 0) {
            return
        }
        const justKey = { key: message.key }

        const editEvent: EditEventUpdate = {
            editId: this.currentConversation.editEvents.length,
            type: EventType.Update,
            updateMessage: { ...diffsMessage, ...justKey }
        }
        this.commitEditEvents([editEvent])
    }

    commitEditEvents(editEvents: EditEvent[]): void {
        this.currentConversation.editEvents = [...this.currentConversation.editEvents, ...editEvents]
        this.currentConversation.editEventsRedoQueue = []
        this.save()
        this.applyEditEvents(this.messagesPrevious, editEvents)
    }

    applyEditEvents(messages: Message[], editEvents: EditEvent[]): Message[] {
        for (var i = 0; i < editEvents.length; i++) {
            const editEvent = editEvents[i]
            if (isEditEventAdd(editEvent)) {
                const addEvent: EditEventAdd = editEvent;
                messages.push(addEvent.addMessage);
            }
            if (isEditEventDelete(editEvent)) {
                const deleteEvent: EditEventDelete = editEvent;
                messages = messages.filter((m: Message) => m.key !== deleteEvent.deleteKey)
            }
            if (isEditEventUpdate(editEvent)) {
                const updateEvent: EditEventUpdate = editEvent;
                messages = messages.map((m: Message) => {
                    if (m.key === updateEvent.updateMessage.key) {
                        return { ...m, ...updateEvent.updateMessage }
                    }
                    return m;
                })
            }
        }
        return messages;
    }

    undoEditEvent(): boolean {
        const lastEvent = this.currentConversation.editEvents.pop()
        if (lastEvent === undefined) {
            return false;
        }
        this.currentConversation.editEventsRedoQueue.push(lastEvent)
        this.messagesCurrent = this.applyEditEvents([], this.currentConversation.editEvents)
        this.messagesPrevious = [... this.messagesCurrent]
        return true;
    }

    redoEditEvent(): boolean {
        const lastEvent = this.currentConversation.editEventsRedoQueue.pop()
        if (lastEvent === undefined) {
            return false;
        }
        this.currentConversation.editEvents.push(lastEvent)
        this.messagesCurrent = this.applyEditEvents([], this.currentConversation.editEvents)
        this.messagesPrevious = [... this.messagesCurrent]
        return true;
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


// Get a partial object with differences from object B compared to object A
function getDifferences<T extends Object>(objectA: T, objectB: T): Partial<T> {
    return Object.keys(objectB).reduce((diffs, key) => {
        const keyCasted = key as keyof typeof objectB; // Type assertion for key safety
        if (objectA[keyCasted] !== objectB[keyCasted]) {
            // @ts-ignore - Ignoring potential index signature errors for brevity 
            diffs[keyCasted] = objectB[keyCasted];
        }
        return diffs;
    }, {} as Partial<T>);
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