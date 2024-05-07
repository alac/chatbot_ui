import { write } from "fs";

interface GenerateParameters {
    name: string
    values: object
}

interface SettingsManager {
    currentSetting: GenerateParameters;
    allSettings: Map<String, GenerateParameters>;
    setCurrentSettings(config: GenerateParameters): void;
    updateSetting(config: GenerateParameters): void;
    getSetting(name: string): GenerateParameters;
    getDefaultSettings(): GenerateParameters;
}

class DefaultSettingsManager implements SettingsManager {
    currentSetting: GenerateParameters;
    allSettings: Map<string, GenerateParameters>;

    constructor() {
        this.currentSetting = this.getDefaultSettings();
        this.allSettings = new Map<string, GenerateParameters>;
    }

    setCurrentSettings(config: GenerateParameters): void {
        this.currentSetting = config;
    }

    updateSetting(config: GenerateParameters): void {
        this.allSettings.set(config.name, config)
    }

    getSetting(name: string): GenerateParameters {
        const result = this.allSettings.get(name);
        if (result != undefined) {
            return result;
        }
        return this.getDefaultSettings();
    }

    getDefaultSettings(): GenerateParameters {
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

async function generate(prompt: string, settings: GenerateParameters, writeStream: ResponseWriter) {
    const url = "http://127.0.0.1:5000/v1/completions"

    const response = await fetch(url, {
        method: "POST",
        cache: "no-cache",
        keepalive: true,
        headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        body: JSON.stringify({ ...settings.values, prompt }),
    });

    const reader = response?.body?.getReader();
    while (reader) {
        const { value, done } = await reader.read();
        if (done || interruptFlag) break;
        const responseStr = new TextDecoder().decode(value);
        const responseChunk: TextCompletionChunk = JSON.parse(responseStr.substring(6))
        if (responseChunk.choices && responseChunk.choices.length != 0) {
            writeStream(responseChunk.choices[0].text, false)
        }
    }
    writeStream("", true)
}


const settingsManager = new DefaultSettingsManager();

export { generate, settingsManager }