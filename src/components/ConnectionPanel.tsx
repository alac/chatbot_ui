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

import { storageManager, Conversation } from '../storage';
import { Key } from 'react-aria-components';
import { TextArea } from '../ui/textarea';


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
                <span className="text-md font-medium">Generate</span>
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

    return (
        <DialogTrigger>
            <Button size="icon" aria-label='Edit Lorebook'><Settings /></Button>
            <DialogOverlay>
                <DialogContent className="max-w-[80%] max-h-[90%] overflow-y-scroll" isDismissable={true}>
                    <DialogHeader>
                        <DialogTitle>Connection Settings</DialogTitle>
                    </DialogHeader>
                    <Separator />

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
                    {(connectionType === "OPENAI") ? <OpenAIConnectionSettings /> : <></>}
                    {(connectionType === "DUMMY") ? <DummyValueSettings /> : <></>}

                    <DialogHeader>
                        <DialogTitle>Connection Settings</DialogTitle>
                    </DialogHeader>
                    <Separator />


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
                <TextArea className="min-h-[400px]" value={placeholder} onChange={handlePlaceholderUpdate} />
            </TextField>
            For testing. No attempt to connect to an AI will be made. The dummy response will be returned to all messages.
        </div>

    </>)
}

export default ConnectionsPanel;