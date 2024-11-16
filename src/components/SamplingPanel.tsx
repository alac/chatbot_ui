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
import { FieldGroup, Label } from "../ui/field"
import { Input } from "../ui/input"
import {
    NumberField,
    NumberFieldInput,
    NumberFieldSteppers,
} from "../ui/numberfield"
import { TextField } from "react-aria-components"
import { Select, SelectTrigger, SelectValue, SelectPopover, SelectItem, SelectContent } from "../ui/select"
import { Separator } from "../ui/separator"
import Settings from '@spectrum-icons/workflow/Settings';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

import { storageManager, SamplingSettings, getDefaultSamplingSettings } from '../storage';
import { Key } from 'react-aria-components';


const SamplingPanel = () => {
    // TODO:
    // -- implement selecting panel toggles
    // -- implement showing panel toggles
    // -- persist panel toggles
    // -- add a help text toggle that changes when focusing on a particular field

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
            <div className="flex items-center">
                <span className="text-md font-medium">Sampling</span>
                <div className="ml-auto">
                    <span className='corner-button'>
                        <EditSamplingDialog
                            samplingPanelToggles={panelToggles} setSamplingPanelToggles={setPanelToggles}
                            samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings}
                            samplingUpdateCounter={samplingUpdateCounter} setSamplingUpdateCounter={setSamplingUpdateCounter}
                        />
                    </span>
                </div>
            </div>
        </div>
    );
};


interface EditSamplingDialogProps {
    samplingUpdateCounter: number
    setSamplingUpdateCounter: React.Dispatch<React.SetStateAction<number>>
    samplingPanelToggles: string[]
    setSamplingPanelToggles: React.Dispatch<React.SetStateAction<string[]>>
    samplingSettings: SamplingSettings
    setSamplingSettings: React.Dispatch<React.SetStateAction<SamplingSettings>>
}


const EditSamplingDialog = (props: EditSamplingDialogProps) => {
    const [samplingSettingsId, setSamplingSettingsId] = useState(storageManager.getCurrentSamplingSettingsId())
    const handleSamplingSettingsIdChange = (key: Key) => {
        const samplingSettingsById = storageManager.getAllSamplingSettings();
        if (typeof key === "string" && samplingSettingsById.has(key)) {
            storageManager.setCurrentSamplingSettingsId(key)
            setSamplingSettingsId(key);
            const newSamplingSettings = samplingSettingsById.get(key)
            if (newSamplingSettings) {
                props.setSamplingSettings(newSamplingSettings)
            }
            props.setSamplingUpdateCounter((s) => (s + 1))
        }
    }

    const defaultSamplingSettings = getDefaultSamplingSettings()
    const handleReset = () => {
        const resetSamplingSettings = { ...defaultSamplingSettings, name: samplingSettingsId }
        storageManager.setSamplingSettings(resetSamplingSettings)
        props.setSamplingSettings(resetSamplingSettings)
        props.setSamplingUpdateCounter((s) => (s + 1))
    }

    const handleDelete = () => {
        storageManager.deleteSamplingSettings(samplingSettingsId)
        // switch to the default sampling settings
        storageManager.setCurrentSamplingSettingsId(defaultSamplingSettings.name)
        setSamplingSettingsId(defaultSamplingSettings.name)
        props.setSamplingSettings(defaultSamplingSettings)
        props.setSamplingUpdateCounter((s) => (s + 1))
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

                    <div className="flex gap-1.5 mr-2" key={`SamplingSelector_${props.samplingUpdateCounter}_${samplingSettingsId}`}>
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
                                        {[...storageManager.getAllSamplingSettings().values()].map((fs: SamplingSettings) => {
                                            return <SelectItem textValue={fs.name} id={fs.name} key={fs.name}>{fs.name}</SelectItem>
                                        })}
                                    </SelectContent>
                                </SelectPopover>
                            </Select>
                        </TextField>

                        <CopySamplingButton setSamplingSettingsId={setSamplingSettingsId} setSamplingSettings={props.setSamplingSettings} />
                        <Button size="md" aria-label='Reset to Defaults' onPress={handleReset}>Reset</Button>
                        {(!currentFormatIsDefault) ? <Button size="md" aria-label='Delete Preset' onPress={handleDelete}>Delete</Button> : <></>}
                    </div>

                    <SamplingSettingsEditor
                        samplingSettings={props.samplingSettings}
                        setSamplingSettings={props.setSamplingSettings}
                        key={`SamplingEditor_${props.samplingUpdateCounter}`} />
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
            <Label className="text-md">{field}: </Label>
            <div className='ml-auto'>
                <Select
                    placeholder="Select an item"
                    aria-label="item selection"
                    onSelectionChange={(key: Key) => { handleBooleanSelectorChange(key, field) }}
                    defaultSelectedKey={boolToString.get(samplingSettings[field] === true)}
                    className="flex w-[180px]"
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
            </div>
        </TextField>
    }

    return (<>
        <PanelGroup direction="horizontal" key={samplingSettings.name}>
            <Panel>
                <SamplingFieldSelector field='max_tokens' min={64} max={32768} step={64} value={samplingSettings.max_tokens} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='max_context_length' min={128} max={32768} step={128} value={samplingSettings.max_context_length} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='temperature' min={0.0} max={5.0} step={.05} value={samplingSettings.temperature} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='min_p' min={0.0} max={1.0} step={.01} value={samplingSettings.min_p} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='top_p' min={0.0} max={1.0} step={.01} value={samplingSettings.top_p} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='top_k' min={-1} max={20} step={1} value={samplingSettings.top_k} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='typical_p' min={0.0} max={1.0} step={.05} value={samplingSettings.typical_p} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='smoothing_factor' min={0.0} max={5.0} step={.05} value={samplingSettings.smoothing_factor} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='smoothing_curve' min={1.0} max={10.0} step={.1} value={samplingSettings.smoothing_curve} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='repetition_penalty' min={1.0} max={3} step={.05} value={samplingSettings.repetition_penalty} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
                <SamplingFieldSelector field='repetition_penalty_range' min={0} max={2048} step={128} value={samplingSettings.repetition_penalty_range} samplingSettings={samplingSettings} setSamplingSettings={setSamplingSettings} />
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

interface SamplingFieldSelectorProps {
    field: keyof SamplingSettings
    min: number
    max: number
    value: number
    step: number
    samplingSettings: SamplingSettings
    setSamplingSettings: React.Dispatch<React.SetStateAction<SamplingSettings>>
}

const SamplingFieldSelector = ({ field, min, max, value, step, samplingSettings, setSamplingSettings }: SamplingFieldSelectorProps) => {
    const handleNumericSelectorUpdate = (value: number, field: keyof SamplingSettings) => {
        var nextSamplingSettings: SamplingSettings = { ...samplingSettings }
        if (field === "max_tokens") {
            nextSamplingSettings[field] = value
        } else if (field === "max_context_length") {
            nextSamplingSettings[field] = value
        } else if (field === "sampler_seed") {
            nextSamplingSettings[field] = value
        } else if (field === "temperature") {
            nextSamplingSettings[field] = value
        } else if (field === "min_p") {
            nextSamplingSettings[field] = value
        } else if (field === "top_p") {
            nextSamplingSettings[field] = value
        } else if (field === "top_k") {
            nextSamplingSettings[field] = value
        } else if (field === "typical_p") {
            nextSamplingSettings[field] = value
        } else if (field === "smoothing_factor") {
            nextSamplingSettings[field] = value
        } else if (field === "smoothing_curve") {
            nextSamplingSettings[field] = value
        } else if (field === "repetition_penalty") {
            nextSamplingSettings[field] = value
        } else if (field === "repetition_penalty_range") {
            nextSamplingSettings[field] = value
        } else {
            throw Error(`SamplingSettingsEditor.handleNumericSelectorUpdate called for ${field}`)
        }
        setSamplingSettings(nextSamplingSettings)
        storageManager.setSamplingSettings(nextSamplingSettings)
    };
    return <NumberField minValue={min} maxValue={max} defaultValue={value} step={step} onChange={(v: number) => { handleNumericSelectorUpdate(v, field) }}
        className="flex items-center gap-1.5 mr-2 my-1">
        <Label className="text-md">{field}</Label>
        <div className='ml-auto'>
            <FieldGroup className="w-[180px]">
                <NumberFieldInput />
                <NumberFieldSteppers />
            </FieldGroup>
        </div>
    </NumberField>
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