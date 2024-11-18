import {
  storageManager,
  Message,
  Conversation,
  Lorebook,
  LorebookEntry,
  isLorebook,
  AnyConnectionSettings,
  isOpenAIConnectionSettings,
  isDummyConnectionSettings,
  FormatSettings,
  ChatRole,
  SamplingSettings,
} from "./storage";

type ResponseWriter = (token: string, done: boolean) => void;
let _isInterrupted = false;

function isInterrupted() {
  return _isInterrupted;
}

function setInterruptFlag(value: boolean) {
  _isInterrupted = value;
}

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

async function generate(
  prompt: string,
  terminationStrings: string[],
  connectionSettings: AnyConnectionSettings,
  samplingSettings: SamplingSettings,
  writeStream: ResponseWriter
) {
  // console.log("Prompt: ", prompt)
  if (
    connectionSettings.type === "OPENAI" &&
    isOpenAIConnectionSettings(connectionSettings)
  ) {
    const { name: _samplingPresetName, ...samplingSettingsFinal } =
      samplingSettings;

    const url = connectionSettings.url + "/v1/completions";
    const response = await fetch(url, {
      method: "POST",
      cache: "no-cache",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        ...samplingSettingsFinal,
        prompt,
        stop: terminationStrings,
        stream: true,
      }),
    });

    const reader = response?.body?.getReader();
    while (reader) {
      const { value, done } = await reader.read();
      if (done || isInterrupted()) break;
      const responseStr = new TextDecoder().decode(value);
      try {
        // two kinds of responses
        // 1) a 'ping'
        //: ping - 2024-10-02 20:54:51.863679\n\n
        if (responseStr.startsWith(": ping - ")) {
          continue;
        }
        // 2) 'data' blob with model and our token
        //data: {"id": "conv-1727902461437720064", "object": "text_completion.chunk", "created": 1727902461,
        // "model": "turboderp_Mistral-Large-Instruct-2407-123B-exl2_4.0bpw",
        // "choices": [{"index": 0, "finish_reason": "stop", "text": "", "logprobs": {"top_logprobs": [{}]}}],
        //  "usage": {"prompt_tokens": 20, "completion_tokens": 331, "total_tokens": 351}}
        const responseChunk: TextCompletionChunk = JSON.parse(
          responseStr.substring(6)
        );
        if (responseChunk.choices && responseChunk.choices.length !== 0) {
          writeStream(responseChunk.choices[0].text, false);
        }
      } catch (error) {
        console.error(`Error parsing json ${responseStr}`, error);
        throw error;
      }
    }
    setInterruptFlag(false);
    writeStream("", true);
  } else if (
    connectionSettings.type === "DUMMY" &&
    isDummyConnectionSettings(connectionSettings)
  ) {
    let i = 0;
    var inputString = connectionSettings.response;
    if (inputString === "") {
      inputString = `Use the \`Connection\` menu to setup **AI** connection or a *dummy* response.  
  Otherwise, you'll only see this message.`;
    }
    const dummyResponse = breakStringIntoSubstrings(inputString);
    const intervalId = setInterval(() => {
      writeStream(dummyResponse[i], false);
      i++;
      if (i === dummyResponse.length || isInterrupted()) {
        setInterruptFlag(false);
        writeStream("", true);
        clearInterval(intervalId);
      }
    }, 50);
  } else {
    console.log("Invalid connection type: ", connectionSettings.type);
    writeStream("", true);
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

interface FinalizedPrompt {
  completionsPrompt: string;
  chatCompletionsPrompt: ChatCompletionsMessage[];
}

interface ChatCompletionsMessage {
  role: string;
  message: string;
}

async function buildPrompt(
  allMessages: Message[],
  conversation: Conversation,
  samplingSettings: SamplingSettings,
  connectionSettings: AnyConnectionSettings,
  formatSettings: FormatSettings
): Promise<FinalizedPrompt> {
  try {
    return buildPromptWrapped(
      allMessages,
      conversation,
      samplingSettings,
      connectionSettings,
      formatSettings,
      true
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function buildPromptWrapped(
  allMessages: Message[],
  conversation: Conversation,
  samplingSettings: SamplingSettings,
  connectionSettings: AnyConnectionSettings,
  formatSettings: FormatSettings,
  updateGenerateStats: boolean
): Promise<FinalizedPrompt> {
  // assume allMessages contains the partial AI response, although maybe i'll regret that

  // lorebook + chatmessages fill out remaining tokens
  // everything else is an upfront cost: instructionFormat, systemPrompt, description

  const botName = conversation.botName;
  const systemName = "System";
  const userName = conversation.username;
  const fillRolePlaceholders = (s: string) =>
    s.replace(/{{user}}/g, userName).replace(/{{char}}/g, botName);

  const systemMessageWithRole =
    formatSettings.systemMessage.length !== 0
      ? formatSettings.systemPrefix +
        formatSettings.systemMessage +
        formatSettings.systemSuffix
      : "";
  const descriptionWithRole =
    conversation.memory.length !== 0
      ? formatSettings.assistantPrefix +
        conversation.memory +
        formatSettings.assistantSuffix
      : "";
  const partialFormat = formatSettings.instructionFormat
    .replace("{{SYSTEM_MESSAGE}}", systemMessageWithRole)
    .replace("{{DESCRIPTION}}", descriptionWithRole)
    .replace(/{{user}}/g, userName)
    .replace(/{{char}}/g, botName);

  var maxTokens = 2048;
  var maxResponseLength = 256;
  if (
    "max_tokens" in samplingSettings &&
    typeof samplingSettings.max_tokens === "number"
  ) {
    maxTokens = samplingSettings.max_tokens;
  }
  if (
    "truncation_length" in samplingSettings &&
    typeof samplingSettings.truncation_length === "number"
  ) {
    maxResponseLength = samplingSettings.truncation_length;
  }
  const memoryEstimateString = partialFormat
    .replace("{{LOREBOOK}}", "")
    .replace("{{CHAT_HISTORY}}", "");
  const memoryLength = await cachedTokenCount(
    memoryEstimateString,
    connectionSettings
  );
  const newlineCost = 1;
  var remainingTokens =
    maxResponseLength - maxTokens - memoryLength - newlineCost;

  const activeLorebooks: Lorebook[] = conversation.lorebookIds
    .map((lorebookId) => storageManager.lorebooks.get(lorebookId))
    .filter(isLorebook);
  var lorebookEntries: LorebookEntry[] = [];
  var remainingLorebookTokens = storageManager.storageState.lorebookMaxTokens;
  var addedEntries: Map<string, boolean> = new Map();

  const prefixSuffixByChatRole = new Map<ChatRole, string[]>();
  prefixSuffixByChatRole.set(ChatRole.Bot, [
    fillRolePlaceholders(formatSettings.assistantPrefix),
    fillRolePlaceholders(formatSettings.assistantSuffix),
  ]);
  prefixSuffixByChatRole.set(ChatRole.System, [
    fillRolePlaceholders(formatSettings.systemPrefix),
    fillRolePlaceholders(formatSettings.systemSuffix),
  ]);
  prefixSuffixByChatRole.set(ChatRole.User, [
    fillRolePlaceholders(formatSettings.userPrefix),
    fillRolePlaceholders(formatSettings.userSuffix),
  ]);
  const lorebookPrefixSuffix = prefixSuffixByChatRole.get(
    formatSettings.lorebookRole
  );
  const authorsNotePrefixSuffix = prefixSuffixByChatRole.get(
    formatSettings.authorsNoteRole
  );
  if (lorebookPrefixSuffix === undefined)
    throw Error(`Undefined role ${formatSettings.lorebookRole}`);
  if (authorsNotePrefixSuffix === undefined)
    throw Error(`Undefined role ${formatSettings.authorsNoteRole}`);

  var reverseChatHistory: string[] = []; // a reverse ordered list of strings to add to the final chat history
  var reverseChatCompletions: ChatCompletionsMessage[] = [];
  var indexFromEnd = 0;
  var isFirstBotMessage = true;
  var isFirstUserMessage = true;
  while (allMessages.length - indexFromEnd - 1 >= 0) {
    const message = allMessages[allMessages.length - indexFromEnd - 1];
    var textAddedThisLoop = "";
    if (!message.isDisabled) {
      if (message.tokenCount == null) {
        message.tokenCount = await cachedTokenCount(
          message.text,
          connectionSettings
        );
        storageManager.updateMessage(message, false);
      }

      var messageCost = message.tokenCount;
      var formattedMessageStr = "";
      if (message.userId === "bot") {
        if (isFirstBotMessage) {
          isFirstBotMessage = false;
          formattedMessageStr =
            fillRolePlaceholders(formatSettings.lastAssistantPrefix) +
            message.text;
        } else {
          formattedMessageStr =
            fillRolePlaceholders(formatSettings.assistantPrefix) +
            message.text +
            fillRolePlaceholders(formatSettings.assistantSuffix);
        }
        reverseChatCompletions.push({ role: botName, message: message.text });
      } else if (message.userId === "user") {
        if (isFirstUserMessage) {
          isFirstUserMessage = false;
          formattedMessageStr =
            fillRolePlaceholders(formatSettings.lastUserPrefix) +
            message.text +
            fillRolePlaceholders(formatSettings.lastUserSuffix);
        } else {
          formattedMessageStr =
            fillRolePlaceholders(formatSettings.userPrefix) +
            message.text +
            fillRolePlaceholders(formatSettings.userSuffix);
        }
        reverseChatCompletions.push({ role: userName, message: message.text });
      }
      if (messageCost < remainingTokens) {
        remainingTokens -= messageCost;
        reverseChatHistory.push(formattedMessageStr);
        textAddedThisLoop = formattedMessageStr;
      } else {
        indexFromEnd -= 1;
        break;
      }
    }
    if (indexFromEnd === conversation.authorNotePosition) {
      const finalAuthorsNote = fillRolePlaceholders(conversation.authorNote);
      remainingTokens -=
        newlineCost * 2 +
        (await cachedTokenCount(finalAuthorsNote, connectionSettings)) +
        (await cachedTokenCount(
          authorsNotePrefixSuffix[0] + authorsNotePrefixSuffix[1],
          connectionSettings
        ));
      reverseChatHistory.push(
        authorsNotePrefixSuffix[0] +
          finalAuthorsNote +
          authorsNotePrefixSuffix[1]
      );

      var authorsNoteRoleName = systemName;
      if (formatSettings.authorsNoteRole === ChatRole.Bot) {
        authorsNoteRoleName = botName;
      } else if (formatSettings.authorsNoteRole === ChatRole.User) {
        authorsNoteRoleName = userName;
      }
      reverseChatCompletions.push({
        role: authorsNoteRoleName,
        message: finalAuthorsNote,
      });
      textAddedThisLoop = textAddedThisLoop + "\n" + finalAuthorsNote;
    }
    const newLorebookEntries = triggeredLorebookEntries(
      textAddedThisLoop,
      activeLorebooks
    );
    for (const lbEntry of newLorebookEntries) {
      if (lbEntry.isEnabled === false) continue;
      if (addedEntries.has(lbEntry.entryId)) continue;
      if (
        storageManager.storageState.lorebookMaxInsertionCount !== -1 &&
        lorebookEntries.length >=
          storageManager.storageState.lorebookMaxInsertionCount
      )
        continue;
      var entryCost = await cachedTokenCount(
        lbEntry.entryBody,
        connectionSettings
      );
      if (lorebookEntries.length === 0) {
        entryCost += await cachedTokenCount(
          lorebookPrefixSuffix[0] + lorebookPrefixSuffix[1],
          connectionSettings
        );
      }
      if (
        remainingTokens > entryCost &&
        (remainingLorebookTokens > entryCost ||
          storageManager.storageState.lorebookMaxTokens === -1)
      ) {
        remainingTokens -= entryCost;
        remainingLorebookTokens -= entryCost;
        addedEntries.set(lbEntry.entryId, true);
        lorebookEntries.push(lbEntry);
      }
    }
    indexFromEnd += 1;
  }

  const chatHistoryFormatted = reverseChatHistory.reverse().join("\n");
  var lorebookFormatted = "";
  if (lorebookEntries.length !== 0) {
    lorebookFormatted =
      lorebookPrefixSuffix[0] +
      lorebookEntries.map((value) => value.entryBody).join("\n") +
      lorebookPrefixSuffix[1];
  }
  const finalPrompt = partialFormat
    .replace("{{LOREBOOK}}", lorebookFormatted)
    .replace("{{CHAT_HISTORY}}", chatHistoryFormatted);

  var finalChatPrompt: ChatCompletionsMessage[] = [];
  finalChatPrompt.push({
    role: systemName,
    message: fillRolePlaceholders(formatSettings.systemMessage),
  });
  finalChatPrompt.push({
    role: botName,
    message: fillRolePlaceholders(conversation.memory),
  });
  var lorebookRoleName = systemName;
  if (formatSettings.lorebookRole === ChatRole.Bot) {
    lorebookRoleName = botName;
  } else if (formatSettings.lorebookRole === ChatRole.User) {
    lorebookRoleName = userName;
  }
  finalChatPrompt.push({
    role: lorebookRoleName,
    message: lorebookEntries.map((value) => value.entryBody).join("\n"),
  });
  finalChatPrompt = [...finalChatPrompt, ...reverseChatCompletions.reverse()];

  if (updateGenerateStats) {
    const lorebookTotalTokens =
      storageManager.storageState.lorebookMaxTokens - remainingLorebookTokens;
    generateStatsTracker.updateUsage(lorebookEntries, lorebookTotalTokens);
  }

  return {
    completionsPrompt: finalPrompt,
    chatCompletionsPrompt: finalChatPrompt,
  };
}

function triggeredLorebookEntries(
  message: string,
  lorebooks: Lorebook[]
): LorebookEntry[] {
  // get all the lorebook entries that this message triggered, sorted so that the closest entries to the end of the message are first
  // includes duplicates, since those get handled later anyways
  const locationAndEntry: { index: number; entry: LorebookEntry }[] = [];
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

async function countTokens(
  text: string,
  connectionSettings: AnyConnectionSettings
): Promise<number> {
  if (
    connectionSettings.type === "OPENAI" &&
    isOpenAIConnectionSettings(connectionSettings)
  ) {
    const resp = await fetch(
      `${connectionSettings.url}/v1/internal/token-count`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
        }),
      }
    );
    if (!resp.ok) {
      throw new Error(`Error counting tokens ${resp.status}`);
    }
    try {
      const { length } = await resp.json();
      return length;
    } catch (e) {
      throw new Error(`Error unpacking response json`);
    }
  } else if (
    connectionSettings.type === "DUMMY" &&
    isDummyConnectionSettings(connectionSettings)
  ) {
    return text.length / 3;
  } else {
    console.log("Invalid connection type: ", connectionSettings.type);
  }
  return text.length / 3;
}

async function cachedTokenCount(
  text: string,
  connectionSettings: AnyConnectionSettings
): Promise<number> {
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
    return -1;
  }
}

async function testConversation(): Promise<string> {
  const messages: Message[] = [];
  messages.push({
    userId: "bot",
    username: storageManager.currentConversation.botName,
    key: `0`,
    text: "Hello, I'm a bot.",
    tokenCount: null,
    compressedPrompt: "",
    isDisabled: false,
  });
  messages.push({
    userId: "user",
    username: storageManager.currentConversation.username,
    key: `1`,
    text: "Hello, I'm a user.",
    tokenCount: null,
    compressedPrompt: "",
    isDisabled: false,
  });
  messages.push({
    userId: "bot",
    username: storageManager.currentConversation.botName,
    key: `2`,
    text: "I'm still a bot.",
    tokenCount: null,
    compressedPrompt: "",
    isDisabled: false,
  });
  messages.push({
    userId: "user",
    username: storageManager.currentConversation.username,
    key: `3`,
    text: "And I'm still a user.",
    tokenCount: null,
    compressedPrompt: "",
    isDisabled: false,
  });

  const builtPrompt = await buildPrompt(
    messages,
    storageManager.currentConversation,
    storageManager.getSamplingSettings(
      storageManager.getCurrentFormatSettingsId()
    ),
    storageManager.getCurrentConnectionSettings(),
    storageManager.getCurrentFormatSettings()
  );
  return builtPrompt.completionsPrompt;
}

const tokenCountCache = new Map<string, number>();
const generateStatsTracker = new GenerateStatsTracker();
export {
  generate,
  buildPrompt,
  generateStatsTracker,
  setInterruptFlag,
  testConversation,
};
