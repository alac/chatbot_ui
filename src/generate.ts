interface NamedSettings {
    name: string
    values: object
}

interface SettingsManager {
    currentSetting: NamedSettings;
    allSettings: Map<String, NamedSettings>;
    setCurrentSettings(config: NamedSettings): void;
    updateSetting(config: NamedSettings): void;
    getSetting(name: string): NamedSettings;
    getDefaultSettings(): NamedSettings;
}

class DefaultSettingsManager implements SettingsManager {
    currentSetting: NamedSettings;
    allSettings: Map<string, NamedSettings>;

    constructor() {
        this.currentSetting = this.getDefaultSettings();
        this.allSettings = new Map<string, NamedSettings>;
    }

    setCurrentSettings(config: NamedSettings): void {
        this.currentSetting = config;
    }

    updateSetting(config: NamedSettings): void {
        this.allSettings.set(config.name, config)
    }

    getSetting(name: string): NamedSettings {
        const result = this.allSettings.get(name);
        if (result != undefined) {
            return result;
        }
        return this.getDefaultSettings();
    }

    getDefaultSettings(): NamedSettings {
        return {
            "name": "default",
            "values": {
                "max_new_tokens": 708,
                "max_tokens": 708,
                "n_predict": 708,
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

// how do i configure BUILDING a prompt
// how do i manage the message history?
// 

// permanent settings + "overrides"
// connection settings
// do I need a lock around interruptFlag?
// how the hell do i stream the response? callback?

// how do i _persist_ settings?
async function generate(prompt: string, settings: NamedSettings, writeStream: ResponseWriter) {
    const url = "http://127.0.0.1:5000/v1/completions"

    const response = await fetch(url, {
        method: "POST",
        cache: "no-cache",
        keepalive: true,
        headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        body: JSON.stringify(settings.values),
    });

    const reader = response?.body?.getReader();
    while (reader) {
        const { value, done } = await reader.read();
        if (done || interruptFlag) break;

        console.log('get.message', new TextDecoder().decode(value));
    }
    writeStream("", true)
}


const settingsManager = new DefaultSettingsManager();
