import React, { useState, useRef, useEffect } from 'react';

import {
    DialogContent,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
    DialogTrigger,
} from "./../ui/dialog"
import { Checkbox } from "./../ui/checkbox"
import { TextField } from "react-aria-components"
import { Button } from "./../ui/button"
import { Separator } from "./../ui/separator"
import { Input } from "../ui/input"
import { Label } from "./../ui/label"
import Delete from '@spectrum-icons/workflow/Delete';
import Edit from '@spectrum-icons/workflow/Edit';
import ChevronDown from '@spectrum-icons/workflow/ChevronDown';
import ChevronUp from '@spectrum-icons/workflow/ChevronUp';


const LorebookPanel = ({ }) => {
    return (
        <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
            <div className="flex items-center">
                <span className="text-md font-medium">Lorebook</span>
                <div className="ml-auto">
                    <span className='corner-button'><ViewLorebooksButton /></span>
                </div>
            </div>
            <span className="text-sm">
                Enabled: N/A.
                <br />
                Entries: 1/20. Tokens: 1000.
            </span>
        </div>
    );
};


const ViewLorebooksButton = ({ }) => {
    const [newLorebookName, setNewLorebookName] = useState('');
    const handleNewLorebookInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewLorebookName(event.target.value);
    };

    const [maxLorebookEntries, setMaxLorebookEntries] = useState('');
    const handleMaxEntriesInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMaxLorebookEntries(event.target.value);
    };

    const [maxLorebookTokens, setMaxLorebookTokens] = useState('');
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMaxLorebookTokens(event.target.value);
    };

    const dummyLorebookNames = ["HarryPotterCharacters", "HarryPotterLocations", "RealWorldLocations", "MidgarLocations"]

    return (
        < DialogTrigger >
            <Button size="icon" aria-label='Edit Lorebook'><Edit /></Button>
            <DialogOverlay>
                <DialogContent className="max-w-[80%] max-h-[90%] overflow-y-scroll" closeButton={false}>
                    <DialogHeader>
                        <DialogTitle>Lorebooks</DialogTitle>
                    </DialogHeader>

                    <Separator />

                    <div className="flex items-center">
                        <TextField className="flex max-w-sm items-center gap-1.5 mr-2">
                            <Label className="py-2">Max Active Lorebook Entries (default: 5): </Label>
                            <Input placeholder="0" onInput={handleMaxEntriesInputChange} />
                        </TextField>

                        <TextField className="flex max-w-sm items-center gap-1.5">
                            <Label className="py-2">Max Tokens for Lorebook Entries (default: 1000): </Label>
                            <Input placeholder="0" onInput={handleInputChange} />
                        </TextField>
                    </div>
                    <div>0 in either field disables lorebook insertion <strong>entirely</strong>. -1 disables just that constraint. </div>

                    <Separator />

                    <TextField className="flex max-w-lg items-center gap-1.5">
                        <Label className="py-2">Add new lorebook: </Label>
                        <Input placeholder="Gandalf and his homies" onInput={handleNewLorebookInputChange} />
                        <Button size="md" aria-label='New Lorebook' onPress={() => alert(newLorebookName)}>Create Lorebook </Button>
                    </TextField>

                    {/* Import */}

                    <Separator />

                    <span className="text-md font-medium">Enabled lorebooks:</span>
                    <div className='grid gap-2'>
                        {dummyLorebookNames.map((name: string) => (
                            <div className="flex items-center bg-white hover:bg-gray-200 transition duration-300 ease-in-out px-2">
                                <Checkbox id="terms">{name}</Checkbox>
                                <div className="ml-auto">
                                    <span className='corner-button mx-2'><EditLorebookButton lorebookId={name} /></span>
                                    {/* Export <Button size="icon" aria-label='Edit Lorebook'><Export /></Button> */}
                                    <span className='corner-button mx-2'><Button size="icon" aria-label='Edit Lorebook'><ChevronUp /></Button></span>
                                    <span className='corner-button mx-2'><Button size="icon" aria-label='Edit Lorebook'><ChevronDown /></Button></span>
                                    <span className='corner-button mx-2'><Button size="icon" aria-label='Edit Lorebook'><Delete /></Button></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </DialogOverlay>
        </DialogTrigger >
    )
};

const EditLorebookButton = ({ lorebookId }: { lorebookId: string }) => {
    const [newLorebookName, setNewLorebookName] = useState('');
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewLorebookName(event.target.value);
    };

    const dummyLorebookNames = ["HarryPotterCharacters", "HarryPotterLocations", "RealWorldLocations", "MidgarLocations"]

    return (
        < DialogTrigger >
            <Button size="icon" aria-label='Edit Lorebook'><Edit /></Button>
            <DialogOverlay isDismissable={false}>
                <DialogContent className="max-w-[80%] max-h-[90%] overflow-y-scroll" closeButton={true}>
                    <DialogHeader>
                        <DialogTitle>Editing Lorebook: '{lorebookId}'</DialogTitle>
                    </DialogHeader>

                    <Separator />

                </DialogContent>
            </DialogOverlay>
        </DialogTrigger >
    )
};


export default LorebookPanel;