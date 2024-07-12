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


const ConnectionsPanel = () => {
    return (
        <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
            <div className="flex items-center">
                <span className="text-md font-medium">Generate</span>
                <div className="ml-auto">
                    <span className='corner-button'><EditConnectionsPanel /></span>
                </div>
            </div>
        </div>
    );
};

const EditConnectionsPanel = () => {
    const [connectionType, setConnectionType] = useState("DUMMY")
    const handleConnectionTypeChange = (key: Key) => {
        if (typeof key === "string") {
            setConnectionType(key);
        }
    }
    console.log(connectionType)

    return (
        < DialogTrigger >
            <Button size="icon" aria-label='Edit Lorebook'><Settings /></Button>
            <DialogOverlay>
                <DialogContent className="max-w-[80%] max-h-[90%] overflow-y-scroll" isDismissable={true}>
                    <DialogHeader>
                        <DialogTitle>Connection Settings</DialogTitle>
                    </DialogHeader>
                    <Separator />

                    <Select placeholder="Select an item" aria-label="item selection" onSelectionChange={handleConnectionTypeChange} defaultSelectedKey={connectionType}>
                        {/* <Select placeholder="Select an item" aria-label="item selection"> */}
                        <SelectTrigger className="w-[300px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectPopover>
                            <SelectContent aria-label="items" className="px-2 py-2">
                                <SelectItem textValue="OpenAI" id="OPENAI"> OpenAI /Completions</SelectItem>
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
    return (<>
        <div>
            <TextField className="flex max-w-[700px] items-center gap-1.5 mr-2">
                <Label className="w-[320px] text-md">Server URL<br />(e.g. "http://127.0.0.1:5000"): </Label>
                <Input placeholder={``} onBlur={() => { }} />
            </TextField>
            Supports any server compatible with the OpenAI 'completions' endpoint (e.g. <strong>Oogabooga</strong>).
        </div>

        <TextField className="flex max-w-[700px] items-center gap-1.5 mr-2">
            <Label className="w-[320px] text-md">Custom Model (Optional): </Label>
            <Input placeholder={``} onBlur={() => { }} />
        </TextField>

        <TextField className="flex max-w-[700px] items-center gap-1.5 mr-2">
            <Label className="w-[320px] text-md">API Key (Optional): </Label>
            <Input placeholder={``} onBlur={() => { }} />
        </TextField>

    </>)
}

const DummyValueSettings = () => {
    return (<>
        <div>
            <TextField className="flex max-w-[600px] items-center gap-1.5 mr-2">
                <Label className="w-[320px] text-md">Dummy Response: </Label>
                <Input placeholder={``} onBlur={() => { }} />
            </TextField>
            For testing. No attempt to connect to an AI will be made. The dummy response will be returned to all messages.
        </div>

    </>)
}

export default ConnectionsPanel;