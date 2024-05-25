import { Message, Conversation, Lorebook, LorebookEntry } from './storage';

interface GenerateParameters {
    name: string
    values: object
}

interface ConnectionSettings {
    name: string
    type: 'oobabooga' | 'dummy' // future use: 'oobabooga', 'openai', etc
    baseUrl: string // http://... should include port, but not '/api/v1...'
    // api_key: string
    // model: string
}

interface GenerateSettingsManager {
    currentGenerateSettings: GenerateParameters;
    allSettings: Map<String, GenerateParameters>;
    setCurrentGenerateParameterss(config: GenerateParameters): void;
    updateGenerateParameters(config: GenerateParameters): void;
    getGenerateParameters(name: string): GenerateParameters;
    getDefaultGenerateParameters(): GenerateParameters;
    getDefaultConnectionSettings(): ConnectionSettings;
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
                "max_tokens": 50,
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

    getDefaultConnectionSettings(): ConnectionSettings {
        return {
            'name': 'default',
            'type': 'dummy',
            'baseUrl': 'http://127.0.0.1:5000',
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

async function generate(prompt: string, terminationStrings: string[], connectionSettings: ConnectionSettings, generateParameters: GenerateParameters, writeStream: ResponseWriter) {
    console.log("Prompt: ", prompt)
    if (connectionSettings.type === 'oobabooga') {
        const url = connectionSettings.baseUrl + "/v1/completions"
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
    } else if (connectionSettings.type === 'dummy') {
        let i = 0;
        const inputString = `type TextCompletionChunk = {
    id: string;
    object: "text_completion.chunk";
    created: number;
    model: string;
    choices: TextCompletionChoice[];
};`
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


async function buildPrompt(conversation: Conversation, generateParameters: GenerateParameters, connectionSettings: ConnectionSettings): Promise<string> {
    // the latest message should _already_ be a part of the conversation
    // ... actually, maybe not. let's let the most recent message be _injected_ on the fly. for stuff like AGENT commands/chained prompts.

    // x v1 use previous messages
    // v2 prompt format string - get the cost of the prompt string (removing substitutions) + the cost of each substitution
    // v3 lorebook - as we walk back, add each lorebook entry that we find a match for
    var maxTokens = 2048;
    var maxResponseLength = 256;
    if ('max_tokens' in generateParameters.values && typeof generateParameters.values.max_tokens === 'number') {
        maxTokens = generateParameters.values.max_tokens;
    }
    if ('maxResponseLength' in generateParameters.values && typeof generateParameters.values.maxResponseLength === 'number') {
        maxResponseLength = generateParameters.values.maxResponseLength;
    }
    const memoryLength = await cachedTokenCount(conversation.memory, connectionSettings);
    const newlineCost = 1;
    var remainingTokens = maxTokens - maxResponseLength - memoryLength - newlineCost;

    const messageFormattingCost = 4;
    var indexFromEnd = 0;
    while ((conversation.messages.length - indexFromEnd - 1) > 0) {
        const message = conversation.messages[conversation.messages.length - indexFromEnd - 1]
        if (!message.isDisabled) {
            const messageCost = await cachedTokenCount(message.username, connectionSettings) + await cachedTokenCount(message.text, connectionSettings)
            remainingTokens -= messageFormattingCost + messageCost;
        }
        if (indexFromEnd === conversation.authorNotePosition) {
            remainingTokens -= newlineCost + await cachedTokenCount(conversation.authorNote, connectionSettings)
        }
        if (remainingTokens < 0) {
            break;
        }
        indexFromEnd -= 1
    }
    var messages = conversation.messages.slice(-indexFromEnd).map((message: Message) => {
        if (message.isDisabled) {
            return ""
        }
        return `${message.username}: ${message.text}\n\n`
    })
    if (messages.length > conversation.authorNotePosition) {
        const authorsNoteIndex = messages.length - conversation.authorNotePosition;
        messages = [...messages.slice(0, authorsNoteIndex), conversation.authorNote, ...messages.slice(authorsNoteIndex)];
    }
    return conversation.memory + "\n" + messages.join("");
}


async function countTokens(text: string, connectionSettings: ConnectionSettings): Promise<number> {
    if (connectionSettings.type === 'oobabooga') {
        const resp = await fetch(`${connectionSettings.baseUrl}/v1/internal/token-count`, {
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
    } else if (connectionSettings.type === 'dummy') {
        return text.length / 3;
    } else {
        console.log("Invalid connection type: ", connectionSettings.type)
    }
    return text.length / 3;
}


async function cachedTokenCount(text: string, connectionSettings: ConnectionSettings): Promise<number> {
    if (tokenCountCache.has(text)) {
        return tokenCountCache.get(text) as number;
    }
    const newTokenCount = await countTokens(text, connectionSettings);
    tokenCountCache.set(text, newTokenCount);
    return newTokenCount;
}


const generateSettingsManager = new DefaultGenerateSettingsManager();
const tokenCountCache = new Map<string, number>();

export { generate, buildPrompt, generateSettingsManager }