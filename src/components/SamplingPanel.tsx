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
import { FieldGroup, Label } from "../ui/field"
import { Input } from "../ui/input"
import { TextField } from "react-aria-components"
import { Select, SelectTrigger, SelectValue, SelectPopover, SelectItem, SelectContent } from "../ui/select"
import Settings from '@spectrum-icons/workflow/Settings';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

import { storageManager, FormatSettings, ChatRole, getDefaultFormatSettingsMap, SamplingSettings, getDefaultSamplingSettings } from '../storage';
import { testConversation } from '../generate';
import { Key } from 'react-aria-components';
import TextAreaAutosizeJolly from '../ui/textareaautosizejolly';


const SamplingPanel = () => {
    // TODO: shared between here and the dialog
    // -- which params to show
    // -- the actual values
    // -- hook Sampling settings into persistence
    // -- hook PanelToggles into persistence

    /*
    toggle groups:
    prediction and context length -> max_tokens, truncation_length
    sampler_seed
    temperature
    min_p
    top_p
    top_k
    typical_p
    smoothing => smoothing_factor, smotthing_curve
    repetition_penalty => repeat_penalty, repeat_last_n

    # no toggle
    "temperature_last": true,
    "early_stopping": false,
    "add_bos_token": false,
    "ban_eos_token": false,
    "skip_special_tokens": false,
    */

    const [samplingUpdateCounter, setSamplingUpdateCounter] = useState(0);
    useEffect(() => {
        // storageManager.updateConnectionsPanelCallback = () => {
        //     setConnectionsUpdateCounter(x => x + 1)
        // }
        // return () => {
        //     storageManager.updateConnectionsPanelCallback = null;
        // }
    },)

    const [samplingSettings, setSamplingSettings] = useState<SamplingSettings>(
        storageManager.getSamplingSettings(storageManager.getCurrentFormatSettingsId()),
    );

    const [panelToggles, setPanelToggles] = useState<string[]>([])

    return (
        <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
            <div className="flex items-center" key={"SamplingPanel_" + samplingUpdateCounter}>
                <span className="text-md font-medium">Sampling</span>
                <div className="ml-auto">
                    <span className='corner-button'>
                        <EditSamplingDialog samplingPanelToggles={panelToggles} setSamplingPanelToggles={setPanelToggles}
                            samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings}
                        />
                    </span>
                </div>
            </div>
        </div>
    );
};


interface EditSamplingDialogProps {
    samplingPanelToggles: string[]
    setSamplingPanelToggles: React.Dispatch<React.SetStateAction<string[]>>
    samplingSettings: SamplingSettings
    setSamplingSettings: React.Dispatch<React.SetStateAction<SamplingSettings>>
}


const EditSamplingDialog = ({ samplingPanelToggles, setSamplingPanelToggles, samplingSettings, setSamplingSettings }: EditSamplingDialogProps) => {
    const [samplingSettingsId, setSamplingSettingsId] = useState(storageManager.getCurrentSamplingSettingsId())
    const handleSamplingSettingsIdChange = (key: Key) => {
        const samplingSettingsById = storageManager.getAllSamplingSettings();
        if (typeof key === "string" && samplingSettingsById.has(key)) {
            storageManager.setCurrentSamplingSettingsId(key)
            setSamplingSettingsId(key);
            const newSamplingSettings = samplingSettingsById.get(key)
            if (newSamplingSettings) {
                setSamplingSettings(newSamplingSettings)
            }
        }
    }

    const defaultSamplingSettings = getDefaultSamplingSettings()
    const handleReset = () => {
        setSamplingSettings(defaultSamplingSettings)
        storageManager.setSamplingSettings({ ...defaultSamplingSettings, name: samplingSettingsId })
    }

    const handleDelete = () => {
        storageManager.deleteFormatSettings(samplingSettingsId)
        // switch to the default sampling settings
        storageManager.setCurrentSamplingSettingsId(defaultSamplingSettings.name)
        setSamplingSettingsId(defaultSamplingSettings.name)
        setSamplingSettings(defaultSamplingSettings)
    }

    const currentFormatIsDefault = samplingSettingsId === defaultSamplingSettings.name

    return (
        <DialogTrigger>
            <Button size="icon" aria-label='Edit Lorebook'><Settings /></Button>
            <DialogOverlay>
                <DialogContent className="max-w-[90%] max-h-[90%] overflow-y-scroll" isDismissable={true}>
                    <DialogHeader className='mt-2'>
                        <DialogTitle>Sampling Settings</DialogTitle>
                    </DialogHeader>
                    <Separator />

                    <div className="flex gap-1.5 mr-2" key={"SamplingSelector_" + samplingSettingsId}>
                        <TextField className="flex items-center gap-1.5 mr-2">
                            <Label className="text-md">Selected: </Label>
                            <Select
                                placeholder="Select an item"
                                aria-label="item selection"
                                onSelectionChange={handleSamplingSettingsIdChange}
                                defaultSelectedKey={samplingSettingsId}
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

                        <CopySamplingButton setSamplingSettingsId={setSamplingSettingsId} setSamplingSettings={setSamplingSettings} />
                        <Button size="md" aria-label='Reset to Defaults' onPress={handleReset}>Reset</Button>
                        {(!currentFormatIsDefault) ? <Button size="md" aria-label='Delete Preset' onPress={handleDelete}>Delete</Button> : <></>}
                    </div>

                    <SamplingSettingsEditor
                        samplingSettings={samplingSettings}
                        setSamplingSettings={setSamplingSettings}
                        key={"SamplingEditor_" + samplingSettingsId} />
                </DialogContent>
            </DialogOverlay>
        </DialogTrigger >
    )
};

interface SamplingSettingsEditorProps {
    samplingSettings: SamplingSettings
    setSamplingSettings: React.Dispatch<React.SetStateAction<SamplingSettings>>
}

const SamplingSettingsEditor = ({ samplingSettings, setSamplingSettings }: SamplingSettingsEditorProps) => {
    // const handleTextAreaUpdate = (event: React.ChangeEvent<HTMLTextAreaElement>, field: keyof FormatSettings) => {
    //     var nextFormatSettings: FormatSettings = formatSettings;
    //     if (field === "name") {
    //         nextFormatSettings = { ...formatSettings, ...{ name: event.target.value } }
    //     } else if (field === "systemMessage") {
    //         nextFormatSettings = { ...formatSettings, ...{ systemMessage: event.target.value } }
    //     } else if (field === "systemPrefix") {
    //         nextFormatSettings = { ...formatSettings, ...{ systemPrefix: event.target.value } }
    //     } else if (field === "systemSuffix") {
    //         nextFormatSettings = { ...formatSettings, ...{ systemSuffix: event.target.value } }
    //     } else if (field === "userPrefix") {
    //         nextFormatSettings = { ...formatSettings, ...{ userPrefix: event.target.value } }
    //     } else if (field === "userSuffix") {
    //         nextFormatSettings = { ...formatSettings, ...{ userSuffix: event.target.value } }
    //     } else if (field === "lastUserPrefix") {
    //         nextFormatSettings = { ...formatSettings, ...{ lastUserPrefix: event.target.value } }
    //     } else if (field === "lastUserSuffix") {
    //         nextFormatSettings = { ...formatSettings, ...{ lastUserSuffix: event.target.value } }
    //     } else if (field === "assistantPrefix") {
    //         nextFormatSettings = { ...formatSettings, ...{ assistantPrefix: event.target.value } }
    //     } else if (field === "assistantSuffix") {
    //         nextFormatSettings = { ...formatSettings, ...{ assistantSuffix: event.target.value } }
    //     } else if (field === "lastAssistantPrefix") {
    //         nextFormatSettings = { ...formatSettings, ...{ lastAssistantPrefix: event.target.value } }
    //     } else if (field === "instructionFormat") {
    //         nextFormatSettings = { ...formatSettings, ...{ instructionFormat: event.target.value } }
    //     } else {
    //         throw Error(`FormatSettingsEditor.handleTextAreaUpdate called for ${field}`)
    //     }
    //     setFormatSettings(nextFormatSettings)
    //     storageManager.setFormatSettings(formatSettingsId, nextFormatSettings)
    // };
    // const textareaField = (field: keyof FormatSettings) => {
    //     return <TextField className="flex items-center gap-1.5 mr-2 my-1">
    //         <Label className="text-md w-[180px]">{field}: </Label>
    //         <TextAreaAutosizeJolly value={formatSettings[field]} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTextAreaUpdate(e, field)} />
    //     </TextField>
    // }

    const boolToString = new Map<boolean, string>()
    boolToString.set(true, "true")
    boolToString.set(false, "false")
    const handleBooleanSelectorChange = (key: Key, field: keyof SamplingSettings) => {
        if ((typeof key !== 'string')) {
            throw Error(`FormatSettingsEditor.handleChatRoleChange got unexpected integer key`)
        }
        var nextSamplingSetings: SamplingSettings = samplingSettings;
        if (field === "temperature_last") {
            nextSamplingSetings = { ...nextSamplingSetings, ...{ temperature_last: key === 'true' } }
        } else if (field === "early_stopping") {
            nextSamplingSetings = { ...nextSamplingSetings, ...{ early_stopping: key === 'true' } }
        } else if (field === "add_bos_token") {
            nextSamplingSetings = { ...nextSamplingSetings, ...{ add_bos_token: key === 'true' } }
        } else if (field === "ban_eos_token") {
            nextSamplingSetings = { ...nextSamplingSetings, ...{ ban_eos_token: key === 'true' } }
        } else if (field === "skip_special_tokens") {
            nextSamplingSetings = { ...nextSamplingSetings, ...{ skip_special_tokens: key === 'true' } }
        } else {
            throw Error(`SamplingSettingsEditor.handleBooleanSelectorChange called for ${field}`)
        }
        setSamplingSettings(nextSamplingSetings)
        storageManager.setSamplingSettings(nextSamplingSetings)
    }
    const booleanSelector = (field: keyof SamplingSettings) => {
        return <TextField className="flex items-center gap-1.5 mr-2 my-1">
            <Label className="text-md w-[180px]">{field}: </Label>
            <Select
                placeholder="Select an item"
                aria-label="item selection"
                onSelectionChange={(key: Key) => { handleBooleanSelectorChange(key, field) }}
                defaultSelectedKey={boolToString.get(samplingSettings[field] === true)}
                className="flex w-full"
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectPopover>
                    <SelectContent aria-label="items" className="px-2 py-2">
                        <SelectItem textValue={"true"} id={"true"}>True</SelectItem>
                        <SelectItem textValue={"false"} id={"false"}>False</SelectItem>
                    </SelectContent>
                </SelectPopover>
            </Select>
        </TextField>
    }

    return (<>
        <PanelGroup direction="horizontal" key={samplingSettings.name}>
            <Panel>
                {/* <div key={formatSettingsId}>
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
                </div> */}

            </Panel>
            <PanelResizeHandle />
            <Panel>
                {booleanSelector('temperature_last')}
                {booleanSelector('early_stopping')}
                {booleanSelector('add_bos_token')}
                {booleanSelector('ban_eos_token')}
                {booleanSelector('skip_special_tokens')}
            </Panel>
        </PanelGroup>
    </>)
}

interface CopySamplingButtonPrompts {
    setSamplingSettingsId: React.Dispatch<React.SetStateAction<string>>
    setSamplingSettings: React.Dispatch<React.SetStateAction<SamplingSettings>>
}

const CopySamplingButton = ({ setSamplingSettingsId, setSamplingSettings }: CopySamplingButtonPrompts) => {
    const [samplingName, setSamplingName] = useState("SamplingSettingsName");

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSamplingName(event.target.value);
    };

    const handleCopy = (close: () => void) => {
        const newSamplingSettings = {
            ...storageManager.getSamplingSettings(storageManager.getCurrentSamplingSettingsId()),
            name: samplingName
        }
        storageManager.setSamplingSettings(newSamplingSettings)
        setSamplingSettings(newSamplingSettings)
        storageManager.setCurrentSamplingSettingsId(samplingName)
        setSamplingSettingsId(samplingName)
        close();
    }
    return (
        <DialogTrigger>
            <Button size="md" aria-label='Copy to a New Format Settings'>Copy</Button>
            <DialogOverlay>
                <DialogContent className="max-w-[40%] max-h-[90%]" isDismissable={true}>
                    {({ close }) => (<>
                        <DialogHeader>
                            <DialogTitle>Copy to a New Sampling Settings</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-5 items-center gap-4">
                            <Label htmlFor="formatName" className="text-right">
                                Name:
                            </Label>
                            <Input
                                id="formatName"
                                defaultValue={samplingName}
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


export default SamplingPanel;