import { storageManager, Message, Conversation, Lorebook, LorebookEntry, isLorebook, AnyConnectionSettings, isOpenAIConnectionSettings, isDummyConnectionSettings } from './storage';

interface GenerateParameters {
    name: string
    values: object
}

interface GenerateSettingsManager {
    currentGenerateSettings: GenerateParameters;
    allSettings: Map<String, GenerateParameters>;
    setCurrentGenerateParameterss(config: GenerateParameters): void;
    updateGenerateParameters(config: GenerateParameters): void;
    getGenerateParameters(name: string): GenerateParameters;
    getDefaultGenerateParameters(): GenerateParameters;
}

class DefaultGenerateSettingsManager implements GenerateSettingsManager {
    currentGenerateSettings: GenerateParameters;
    allSettings: Map<string, GenerateParameters>;

    constructor() {
        this.currentGenerateSettings = this.getDefaultGenerateParameters();
        this.allSettings = new Map<string, GenerateParameters>();
    }

    setCurrentGenerateParameterss(config: GenerateParameters): void {
        this.currentGenerateSettings = config;
    }

    updateGenerateParameters(config: GenerateParameters): void {
        this.allSettings.set(config.name, config)
    }

    getGenerateParameters(name: string): GenerateParameters {
        const result = this.allSettings.get(name);
        if (result !== undefined) {
            return result;
        }
        return this.getDefaultGenerateParameters();
    }

    getDefaultGenerateParameters(): GenerateParameters {
        return {
            "name": "default",
            "values": {
                "max_tokens": 400,
                "truncation_length": 8192,
                "temperature": 2.5,
                "min_p": 0.058,

                "smoothing_factor": 2,
                "smoothing_curve": 3.01,

                "sampler_seed": -1,
                "top_p": 1,
                "typical_p": 1,
                "repetition_penalty": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0,
                "top_k": 0,
                "min_length": 0,
                "min_tokens": 0,
                "top_a": 0,
                "tfs": 1,
                "epsilon_cutoff": 0,
                "eta_cutoff": 0,
                "rep_pen": 1,
                "rep_pen_range": 0,
                "repetition_penalty_range": 0,
                "encoder_repetition_penalty": 1,
                "no_repeat_ngram_size": 0,
                "temperature_last": true,
                "early_stopping": false,
                "add_bos_token": false,
                "ban_eos_token": false,
                "skip_special_tokens": false,
                "stream": true
            }
        }
    }
}

type ResponseWriter = (token: string, done: boolean) => void;
var interruptFlag = false;

type TextCompletionChunk = {
    id: string;
    object: "text_completion.chunk";
    created: number;
    model: string;
    choices: TextCompletionChoice[];
};

type TextCompletionChoice = {
    index: number;
    finish_reason: string | null;
    text: string;
    logprobs: {
        top_logprobs: any[]; // Assuming the structure of top_logprobs is unknown
    };
};

async function generate(prompt: string, terminationStrings: string[], connectionSettings: AnyConnectionSettings, generateParameters: GenerateParameters, writeStream: ResponseWriter) {
    // console.log("Prompt: ", prompt)
    if (connectionSettings.type === 'OPENAI' && isOpenAIConnectionSettings(connectionSettings)) {
        const url = connectionSettings.url + "/v1/completions"
        const response = await fetch(url, {
            method: "POST",
            cache: "no-cache",
            keepalive: true,
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            },
            body: JSON.stringify({ ...generateParameters.values, prompt, 'stop': terminationStrings }),
        });

        const reader = response?.body?.getReader();
        while (reader) {
            const { value, done } = await reader.read();
            if (done || interruptFlag) break;
            const responseStr = new TextDecoder().decode(value);
            const responseChunk: TextCompletionChunk = JSON.parse(responseStr.substring(6))
            if (responseChunk.choices && responseChunk.choices.length !== 0) {
                writeStream(responseChunk.choices[0].text, false)
            }
        }
        writeStream("", true)
    } else if (connectionSettings.type === 'DUMMY' && isDummyConnectionSettings(connectionSettings)) {
        let i = 0;
        const inputString = connectionSettings.response;
        const dummyResponse = breakStringIntoSubstrings(inputString);
        const intervalId = setInterval(() => {
            writeStream(dummyResponse[i], false)
            i++;
            if (i === dummyResponse.length) {
                writeStream("", true)
                clearInterval(intervalId);
            }
        }, 50);
    } else {
        console.log("Invalid connection type: ", connectionSettings.type)
    }
}

function breakStringIntoSubstrings(str: string): string[] {
    const result: string[] = [];
    for (let i = 0; i < str.length; i += 2) {
        const substring = str.substring(i, i + 2);
        result.push(substring);
    }
    return result;
}


async function buildPrompt(conversation: Conversation, generateParameters: GenerateParameters, connectionSettings: AnyConnectionSettings): Promise<string> {
    // the latest message should _already_ be a part of the conversation
    // ... actually, maybe not. let's let the most recent message be _injected_ on the fly. for stuff like AGENT commands/chained prompts.

    // x v1 use previous messages
    // v2 prompt format string - get the cost of the prompt string (removing substitutions) + the cost of each substitution
    // x v3 lorebook - as we walk back, add each lorebook entry that we find a match for
    var maxTokens = 2048;
    var maxResponseLength = 256;
    if ('max_tokens' in generateParameters.values && typeof generateParameters.values.max_tokens === 'number') {
        maxTokens = generateParameters.values.max_tokens;
    }
    if ('truncation_length' in generateParameters.values && typeof generateParameters.values.truncation_length === 'number') {
        maxResponseLength = generateParameters.values.truncation_length;
    }
    const memoryLength = await cachedTokenCount(conversation.memory, connectionSettings);
    const newlineCost = 1;
    var remainingTokens = maxResponseLength - maxTokens - memoryLength - newlineCost;

    const activeLorebooks: Lorebook[] = conversation.lorebookIds.map(lorebookId => storageManager.lorebooks.get(lorebookId)).filter(isLorebook);
    var lorebookEntries: LorebookEntry[] = [];
    var remainingLorebookTokens = storageManager.storageState.lorebookMaxTokens;
    var addedEntries: Map<string, boolean> = new Map();

    const messageFormattingCost = 4;
    var indexFromEnd = 0;
    while ((conversation.messages.length - indexFromEnd - 1) >= 0) {
        const message = conversation.messages[conversation.messages.length - indexFromEnd - 1]
        if (!message.isDisabled) {
            if (message.tokenCount == null) {
                message.tokenCount = await cachedTokenCount(message.text, connectionSettings)
                storageManager.updateMessage(message, false);
            }
            const messageCost = await cachedTokenCount(message.username, connectionSettings) + message.tokenCount
            if ((messageFormattingCost + messageCost) < remainingTokens) {
                remainingTokens -= messageFormattingCost + messageCost;
                console.log("token count: ", remainingTokens)
            } else {
                indexFromEnd -= 1;
                break;
            }
        }
        if (indexFromEnd === conversation.authorNotePosition) {
            remainingTokens -= newlineCost * 2 + await cachedTokenCount(conversation.authorNote, connectionSettings)
        }

        const newLorebookEntries = triggeredLorebookEntries(message.text, activeLorebooks);
        for (const lbEntry of newLorebookEntries) {
            if (lbEntry.isEnabled == false) continue;
            if (addedEntries.has(lbEntry.entryId)) continue;
            if (storageManager.storageState.lorebookMaxInsertionCount !== -1 &&
                lorebookEntries.length >= storageManager.storageState.lorebookMaxInsertionCount) continue;
            const entryCost = await cachedTokenCount(lbEntry.entryBody, connectionSettings)
            if (remainingTokens > entryCost && (remainingLorebookTokens > entryCost || storageManager.storageState.lorebookMaxTokens === -1)) {
                remainingTokens -= entryCost;
                remainingLorebookTokens -= entryCost;
                addedEntries.set(lbEntry.entryId, true);
                lorebookEntries.push(lbEntry)
            }
        }
        indexFromEnd += 1
    }
    var messages = conversation.messages.slice(-indexFromEnd).map((message: Message) => {
        if (message.isDisabled) {
            return ""
        }
        return `${message.username}: ${message.text}\n\n`
    })
    if (messages.length > conversation.authorNotePosition) {
        const authorsNoteIndex = messages.length - conversation.authorNotePosition;
        messages = [...messages.slice(0, authorsNoteIndex), "\n" + conversation.authorNote + "\n", ...messages.slice(authorsNoteIndex)];
    }

    const lorebookTotalTokens = storageManager.storageState.lorebookMaxTokens - remainingLorebookTokens;
    generateStatsTracker.updateUsage(lorebookEntries, lorebookTotalTokens);

    return conversation.memory + "\n" + lorebookEntries.map((value) => value.entryBody).join("") + "\n" + messages.join("");
}


function triggeredLorebookEntries(message: string, lorebooks: Lorebook[]): LorebookEntry[] {
    // get all the lorebook entries that this message triggered, sorted so that the closest entries to the end of the message are first
    // includes duplicates, since those get handled later anyways
    const locationAndEntry: { index: number, entry: LorebookEntry }[] = [];
    for (const lorebook of lorebooks) {
        for (const entry of lorebook.lorebookEntry) {
            const keys = entry.entryTrigger.split(",");
            for (const key of keys) {
                if (key.length === 0) continue;
                const location = message.lastIndexOf(key);
                if (location !== -1) {
                    locationAndEntry.push({ index: location, entry: entry });
                }
            }
        }
    }
    locationAndEntry.sort((a, b) => b.index - a.index); // reverse sort
    return locationAndEntry.map((value) => value.entry);
}

async function countTokens(text: string, connectionSettings: AnyConnectionSettings): Promise<number> {
    if (connectionSettings.type === 'OPENAI' && isOpenAIConnectionSettings(connectionSettings)) {
        const resp = await fetch(`${connectionSettings.url}/v1/internal/token-count`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
                text: text
            })
        });
        if (!resp.ok) {
            throw new Error(`Error counting tokens {resp.status}`);
        }
        try {
            const { length } = await resp.json();
            return length;
        }
        catch (e) {
            console.log("Exception unpacking tokenCount json", e)
            return -1;
        }
    } else if (connectionSettings.type === 'DUMMY' && isDummyConnectionSettings(connectionSettings)) {
        return text.length / 3;
    } else {
        console.log("Invalid connection type: ", connectionSettings.type)
    }
    return text.length / 3;
}


async function cachedTokenCount(text: string, connectionSettings: AnyConnectionSettings): Promise<number> {
    if (tokenCountCache.has(text)) {
        return tokenCountCache.get(text) as number;
    }
    const newTokenCount = await countTokens(text, connectionSettings);
    tokenCountCache.set(text, newTokenCount);
    return newTokenCount;
}


class GenerateStatsTracker {
    lorebookUsageUpdatedCallback: (() => void) | null;
    lorebookUsageEntries: LorebookEntry[];
    lorebookUsageTokens: number;

    constructor() {
        this.lorebookUsageUpdatedCallback = null;

        this.lorebookUsageEntries = [];
        this.lorebookUsageTokens = 0;
    }

    updateUsage(entries: LorebookEntry[], totalTokensUsed: number) {
        this.lorebookUsageEntries = entries;
        this.lorebookUsageTokens = totalTokensUsed;
        this.lorebookUsageUpdatedCallback?.();
    }

    getTokenCount(entry: LorebookEntry): number {
        if (tokenCountCache.has(entry.entryBody)) {
            return tokenCountCache.get(entry.entryBody) as number;
        }
        return -1
    }
}


const generateSettingsManager = new DefaultGenerateSettingsManager();
const tokenCountCache = new Map<string, number>();
const generateStatsTracker = new GenerateStatsTracker();

export { generate, buildPrompt, generateSettingsManager, generateStatsTracker }