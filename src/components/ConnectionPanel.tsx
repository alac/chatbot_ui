import React, { useState, useEffect } from 'react';

import {
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { TextField } from "react-aria-components"
import { Select, SelectTrigger, SelectValue, SelectPopover, SelectItem, SelectContent } from "../ui/select"
import Settings from '@spectrum-icons/workflow/Settings';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

import { storageManager, FormatSettings, ChatRole, getDefaultFormatSettingsMap } from '../storage';
import { testConversation } from '../generate';
import { Key } from 'react-aria-components';
import TextAreaAutosizeJolly from '../ui/textareaautosizejolly';


const ConnectionsPanel = () => {
    const [connectionsUpdateCounter, setConnectionsUpdateCounter] = useState(0);
    useEffect(() => {
        storageManager.updateConnectionsPanelCallback = () => {
            setConnectionsUpdateCounter(x => x + 1)
        }
        return () => {
            storageManager.updateConnectionsPanelCallback = null;
        }
    },)

    return (
        <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
            <div className="flex items-center" key={"ConnPanel_" + connectionsUpdateCounter}>
                <span className="text-md font-medium">Connection</span>
                <div className="ml-auto">
                    <span className='corner-button'><EditConnectionsPanel /></span>
                </div>
            </div>
        </div>
    );
};

const EditConnectionsPanel = () => {
    const defaultConnection = storageManager.getCurrentConnectionSettingsId();
    const [connectionType, setConnectionType] = useState(defaultConnection)
    const handleConnectionTypeChange = (key: Key) => {
        if (typeof key === "string") {
            setConnectionType(key);
        }
        if (key === "OPENAI") {
            storageManager.setCurrentConnectionSettingsId("OPENAI");
        } else if (key === "DUMMY") {
            storageManager.setCurrentConnectionSettingsId("DUMMY");
        }
    }

    const defaultFormat = storageManager.getCurrentFormatSettingsId();
    const [currentFormatId, setCurrentFormatId] = useState(defaultFormat)
    const handleFormatIdChange = (key: Key) => {
        const formatSettingsById = storageManager.getAllFormatSettings();
        if (typeof key === "string" && formatSettingsById.has(key)) {
            storageManager.setCurrentFormatSettingsId(key)
            setCurrentFormatId(key);
            const newFormatSettings = storageManager.getAllFormatSettings().get(key)
            if (newFormatSettings) {
                setFormatSettings(newFormatSettings)
            }
        }
    }

    const builtInFormatMap = getDefaultFormatSettingsMap();
    const currentFormatIsBuiltIn = builtInFormatMap.has(currentFormatId)

    var initialFormatSettings = storageManager.getAllFormatSettings().get(currentFormatId);
    if (!initialFormatSettings) {
        initialFormatSettings = storageManager.getCurrentFormatSettings();
    }
    const [formatSettings, setFormatSettings] = useState(initialFormatSettings)

    const handleReset = () => {
        const originalFormatSettings = getDefaultFormatSettingsMap().get(currentFormatId);
        if (originalFormatSettings) {
            setFormatSettings(originalFormatSettings)
            storageManager.setFormatSettings(currentFormatId, originalFormatSettings)
        }
    }

    const handleDelete = () => {
        storageManager.deleteFormatSettings(currentFormatId)
        // switch to an arbitary formatSettings from the defaults
        const [defaultFormatId] = getDefaultFormatSettingsMap().keys();
        storageManager.setCurrentFormatSettingsId(defaultFormatId)
        setCurrentFormatId(defaultFormatId)
        const defaultFormatSettings = storageManager.getAllFormatSettings().get(defaultFormatId);
        if (defaultFormatSettings) {
            setFormatSettings(defaultFormatSettings)
        }
    }

    return (
        <DialogTrigger>
            <Button size="icon" aria-label='Edit Lorebook'><Settings /></Button>
            <DialogOverlay>
                <DialogContent className="max-w-[90%] max-h-[90%] overflow-y-scroll" isDismissable={true}>
                    <DialogHeader>
                        <DialogTitle>Provider Settings</DialogTitle>
                    </DialogHeader>
                    <Separator />

                    <TextField className="flex items-center gap-1.5 mr-2">
                        <Label className="text-md">Type: </Label>
                        <Select
                            placeholder="Select an item"
                            aria-label="item selection"
                            onSelectionChange={handleConnectionTypeChange}
                            defaultSelectedKey={connectionType}
                        >
                            {/* <Select placeholder="Select an item" aria-label="item selection"> */}
                            <SelectTrigger className="w-[300px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectPopover>
                                <SelectContent aria-label="items" className="px-2 py-2">
                                    <SelectItem textValue="OpenAI" id="OPENAI">OpenAI /Completions</SelectItem>
                                    <SelectItem textValue="Dummy" id="DUMMY">Dummy</SelectItem>
                                </SelectContent>
                            </SelectPopover>
                        </Select>
                    </TextField>

                    {(connectionType === "OPENAI") ? <OpenAIConnectionSettings /> : <></>}
                    {(connectionType === "DUMMY") ? <DummyValueSettings /> : <></>}

                    <DialogHeader className='mt-2'>
                        <DialogTitle>Instruction Template Settings</DialogTitle>
                    </DialogHeader>
                    <Separator />

                    <div className="flex gap-1.5 mr-2" key={"FormatSelector_" + currentFormatId}>
                        <TextField className="flex items-center gap-1.5 mr-2">
                            <Label className="text-md">Selected: </Label>
                            <Select
                                placeholder="Select an item"
                                aria-label="item selection"
                                onSelectionChange={handleFormatIdChange}
                                defaultSelectedKey={currentFormatId}
                            >
                                <SelectTrigger className="w-[300px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectPopover>
                                    <SelectContent aria-label="items" className="px-2 py-2">
                                        {[...storageManager.getAllFormatSettings().values()].map((fs: FormatSettings) => {
                                            return <SelectItem textValue={fs.name} id={fs.id} key={fs.id}>{fs.name}</SelectItem>
                                        })}
                                    </SelectContent>
                                </SelectPopover>
                            </Select>
                        </TextField>

                        <CopyFormatButton setCurrentFormatId={setCurrentFormatId} />
                        {(currentFormatIsBuiltIn) ? <Button size="md" aria-label='Reset Format to Defaults' onPress={handleReset}>Reset</Button> : <></>}
                        {(!currentFormatIsBuiltIn) ? <Button size="md" aria-label='Delete Format' onPress={handleDelete}>Delete</Button> : <></>}
                    </div>

                    <FormatSettingsEditor
                        formatSettingsId={currentFormatId}
                        formatSettings={formatSettings}
                        setFormatSettings={setFormatSettings}
                        key={"FormatEditor_" + currentFormatId} />
                </DialogContent>
            </DialogOverlay>
        </DialogTrigger >
    )
};

const OpenAIConnectionSettings = () => {
    const connectionSettings = storageManager.getOpenAIConnectionSettingsById("OPENAI");
    const [url, setUrl] = useState(connectionSettings.url)
    const [modelName, setModelName] = useState(connectionSettings.modelName)
    const [apiKey, setApiKey] = useState(connectionSettings.apiKey)

    const handleUrlUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
        connectionSettings.url = event.target.value;
        storageManager.setConnectionSettings("OPENAI", connectionSettings);
    };
    const handleModelNameUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        setModelName(event.target.value);
        connectionSettings.modelName = event.target.value;
        storageManager.setConnectionSettings("OPENAI", connectionSettings);
    };
    const handleApiKeyUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(event.target.value);
        connectionSettings.apiKey = event.target.value;
        storageManager.setConnectionSettings("OPENAI", connectionSettings);
    };


    return (<>
        <div>
            <TextField className="flex max-w-[700px] items-center gap-1.5 mr-2">
                <Label className="w-[320px] text-md">Server URL<br />(e.g. "http://127.0.0.1:5000"): </Label>
                <Input value={url} onChange={handleUrlUpdate} />
            </TextField>
            Supports any server compatible with the OpenAI 'completions' endpoint (e.g. <strong>Oogabooga</strong>).
        </div>

        <TextField className="flex max-w-[700px] items-center gap-1.5 mr-2">
            <Label className="w-[320px] text-md">Custom Model (Optional): </Label>
            <Input value={modelName} onChange={handleModelNameUpdate} />
        </TextField>

        <TextField className="flex max-w-[700px] items-center gap-1.5 mr-2">
            <Label className="w-[320px] text-md">API Key (Optional): </Label>
            <Input value={apiKey} onChange={handleApiKeyUpdate} />
        </TextField>

    </>)
}

const DummyValueSettings = () => {
    const connectionSettings = storageManager.getDummyConnectionSettingsById("DUMMY");
    const [placeholder, setPlaceholder] = useState(connectionSettings.response)
    const handlePlaceholderUpdate = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPlaceholder(event.target.value);
        connectionSettings.response = event.target.value;
        storageManager.setConnectionSettings("DUMMY", connectionSettings);
    };

    return (<>
        <div>
            <TextField className="flex items-center gap-1.5 mr-2">
                <Label className="w-[320px] text-md">Dummy Response: </Label>
                <TextAreaAutosizeJolly className="min-h-[100px]" value={placeholder} onChange={handlePlaceholderUpdate} />
            </TextField>
            For testing. No attempt to connect to an AI will be made. The dummy response will be returned to all messages.
        </div>

    </>)
}

interface FormatSettingsEditorProps {
    formatSettingsId: string,
    formatSettings: FormatSettings,
    setFormatSettings: React.Dispatch<React.SetStateAction<FormatSettings>>
}

const FormatSettingsEditor = ({ formatSettings, setFormatSettings, formatSettingsId }: FormatSettingsEditorProps) => {

    const [formattedPrompt, setFormattedPrompt] = useState("")
    useEffect(() => {
        const updateTestPrompt = async () => {
            const result = await testConversation();
            setFormattedPrompt(result);
        };
        updateTestPrompt()
    }, [formatSettings])

    if (formatSettings === undefined) {
        return <></>
    }

    const handleTextAreaUpdate = (event: React.ChangeEvent<HTMLTextAreaElement>, field: keyof FormatSettings) => {
        var nextFormatSettings: FormatSettings = formatSettings;
        if (field === "name") {
            nextFormatSettings = { ...formatSettings, ...{ name: event.target.value } }
        } else if (field === "systemMessage") {
            nextFormatSettings = { ...formatSettings, ...{ systemMessage: event.target.value } }
        } else if (field === "systemPrefix") {
            nextFormatSettings = { ...formatSettings, ...{ systemPrefix: event.target.value } }
        } else if (field === "systemSuffix") {
            nextFormatSettings = { ...formatSettings, ...{ systemSuffix: event.target.value } }
        } else if (field === "userPrefix") {
            nextFormatSettings = { ...formatSettings, ...{ userPrefix: event.target.value } }
        } else if (field === "userSuffix") {
            nextFormatSettings = { ...formatSettings, ...{ userSuffix: event.target.value } }
        } else if (field === "lastUserPrefix") {
            nextFormatSettings = { ...formatSettings, ...{ lastUserPrefix: event.target.value } }
        } else if (field === "lastUserSuffix") {
            nextFormatSettings = { ...formatSettings, ...{ lastUserSuffix: event.target.value } }
        } else if (field === "assistantPrefix") {
            nextFormatSettings = { ...formatSettings, ...{ assistantPrefix: event.target.value } }
        } else if (field === "assistantSuffix") {
            nextFormatSettings = { ...formatSettings, ...{ assistantSuffix: event.target.value } }
        } else if (field === "lastAssistantPrefix") {
            nextFormatSettings = { ...formatSettings, ...{ lastAssistantPrefix: event.target.value } }
        } else if (field === "instructionFormat") {
            nextFormatSettings = { ...formatSettings, ...{ instructionFormat: event.target.value } }
        } else {
            throw Error(`FormatSettingsEditor.handleTextAreaUpdate called for ${field}`)
        }
        setFormatSettings(nextFormatSettings)
        storageManager.setFormatSettings(formatSettingsId, nextFormatSettings)
    };
    const textareaField = (field: keyof FormatSettings) => {
        return <TextField className="flex items-center gap-1.5 mr-2 my-1">
            <Label className="text-md w-[180px]">{field}: </Label>
            <TextAreaAutosizeJolly value={formatSettings[field]} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTextAreaUpdate(e, field)} />
        </TextField>
    }

    const handleChatRoleChange = (key: Key, field: keyof FormatSettings) => {
        const chatRoleByKey = new Map<string, ChatRole>()
        chatRoleByKey.set(ChatRole.Bot, ChatRole.Bot)
        chatRoleByKey.set(ChatRole.System, ChatRole.System)
        chatRoleByKey.set(ChatRole.User, ChatRole.User)
        if ((typeof key !== 'string')) {
            throw Error(`FormatSettingsEditor.handleChatRoleChange got unexpected integer key`)
        }
        const chatRole = chatRoleByKey.get(key)
        if (chatRole === undefined) {
            throw Error(`FormatSettingsEditor.handleChatRoleChange got undefined chatRole`)
        }
        var nextFormatSettings: FormatSettings = formatSettings;
        if (field === "authorsNoteRole") {
            nextFormatSettings = { ...formatSettings, ...{ authorsNoteRole: chatRole } }
        } else if (field === "lorebookRole") {
            nextFormatSettings = { ...formatSettings, ...{ lorebookRole: chatRole } }
        } else {
            throw Error(`FormatSettingsEditor.handleChatRoleChange called for ${field}`)
        }
        setFormatSettings(nextFormatSettings)
        storageManager.setFormatSettings(formatSettingsId, nextFormatSettings)
    }
    const chatRoleSelector = (field: keyof FormatSettings) => {
        return <TextField className="flex items-center gap-1.5 mr-2 my-1">
            <Label className="text-md w-[180px]">{field}: </Label>
            <Select
                placeholder="Select an item"
                aria-label="item selection"
                onSelectionChange={(key: Key) => { handleChatRoleChange(key, field) }}
                defaultSelectedKey={formatSettings[field]}
                className="flex w-full"
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectPopover>
                    <SelectContent aria-label="items" className="px-2 py-2">
                        {[ChatRole.Bot, ChatRole.System, ChatRole.User].map((role: ChatRole) => {
                            return <SelectItem textValue={role} id={role}>{role}</SelectItem>
                        })}
                    </SelectContent>
                </SelectPopover>
            </Select>
        </TextField>
    }

    return (<>
        <PanelGroup direction="horizontal">
            <Panel>
                <div key={formatSettingsId}>
                    {textareaField('name')}
                    {textareaField('instructionFormat')}
                    {textareaField('systemMessage')}
                    {textareaField('systemPrefix')}
                    {textareaField('systemSuffix')}
                    {textareaField('userPrefix')}
                    {textareaField('userSuffix')}
                    {textareaField('lastUserPrefix')}
                    {textareaField('lastUserSuffix')}
                    {textareaField('assistantPrefix')}
                    {textareaField('assistantSuffix')}
                    {textareaField('lastAssistantPrefix')}
                    {chatRoleSelector('authorsNoteRole')}
                    {chatRoleSelector('lorebookRole')}
                </div>

            </Panel>
            <PanelResizeHandle />
            <Panel>
                <div
                    style={{
                        whiteSpace: 'pre',
                        textWrap: 'wrap'
                    }}
                >
                    ${formattedPrompt}
                </div>
            </Panel>
        </PanelGroup>

    </>)
}

interface CopyFormatButtonPrompts {
    setCurrentFormatId: React.Dispatch<React.SetStateAction<string>>
}

const CopyFormatButton = (props: CopyFormatButtonPrompts) => {
    const [formatName, setFormatName] = useState("NewFormatName");

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormatName(event.target.value);
    };

    const handleCopy = (close: () => void) => {
        const newFormatSettings = {
            ...storageManager.getCurrentFormatSettings(),
            id: `${Date.now()}_${formatName}`,
            name: formatName
        }
        storageManager.setFormatSettings(newFormatSettings.id, newFormatSettings)
        storageManager.setCurrentFormatSettingsId(newFormatSettings.id)
        props.setCurrentFormatId(newFormatSettings.id)
        close();
    }
    return (
        <DialogTrigger>
            <Button size="md" aria-label='Copy to a New Format Settings'>Copy</Button>
            <DialogOverlay>
                <DialogContent className="max-w-[40%] max-h-[90%]" isDismissable={true}>
                    {({ close }) => (<>
                        <DialogHeader>
                            <DialogTitle>Copy to a New Format Settings</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-5 items-center gap-4">
                            <Label htmlFor="formatName" className="text-right">
                                Name:
                            </Label>
                            <Input
                                id="formatName"
                                defaultValue={formatName}
                                className="col-span-4"
                                onChange={handleInputChange}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" onPress={() => { handleCopy(close) }}>Copy</Button>
                        </DialogFooter>
                    </>)}
                </DialogContent>
            </DialogOverlay>
        </DialogTrigger >
    )
};


export default ConnectionsPanel;