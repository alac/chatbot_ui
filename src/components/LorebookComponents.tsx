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

import { storageManager, Lorebook } from './../storage';



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
    const [lorebookUpdateTimestamp, setLorebookUpdateTimestamp] = useState(new Date());
    useEffect(() => {
        storageManager.lorebookUpdatedCallback = () => {
            setLorebookUpdateTimestamp((new Date()))
        }
        return () => {
            storageManager.lorebookUpdatedCallback = null;
        }
    }, [lorebookUpdateTimestamp]);

    const [newLorebookName, setNewLorebookName] = useState('');
    const handleNewLorebookInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewLorebookName(event.target.value);
    };

    const handleCreateLorebook = () => {
        storageManager.createLorebook(newLorebookName);
    }

    const handleDeleteLorebook = (lorebookId: string) => {
        storageManager.deleteLorebook(lorebookId);
    }

    const handleReorderLorebook = (lorebookId: string, increment: number) => {
        const index = storageManager.storageState.lorebookIds.indexOf(lorebookId);
        const lorebookIdsWithoutX = storageManager.storageState.lorebookIds.filter((s: string) => s !== lorebookId);
        const reorderedLorebookIds = [...lorebookIdsWithoutX.slice(0, index + increment), lorebookId, ...lorebookIdsWithoutX.slice(index + increment)];
        storageManager.updateLorebookOrder(reorderedLorebookIds);
    }

    const maxLorebookEntries = storageManager.getLorebookMaxInsertionCount()
    const handleMaxEntriesInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const numberValue = parseInt(event.target.value, 10);
        if (!isNaN(numberValue) && numberValue >= -1) {
            storageManager.setLorebookMaxInsertionCount(numberValue);
        }
    };

    const maxLorebookTokens = storageManager.getLorebookMaxTokens()
    const handleMaxLorebookTokensInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const numberValue = parseInt(event.target.value, 10);
        if (!isNaN(numberValue) && numberValue >= -1) {
            storageManager.setLorebookMaxTokens(numberValue);
        }
    };

    const lorebooks = storageManager.storageState.lorebookIds.map((s: string) => (storageManager.lorebooks.get(s)))
    const enabledLorebookIds = storageManager.currentConversation.lorebookIds;
    const handleLorebookSelectionChange = (lorebookId: string, isSelected: boolean) => {
        if (isSelected && !storageManager.currentConversation.lorebookIds.includes(lorebookId)) {
            storageManager.currentConversation.lorebookIds = [...storageManager.currentConversation.lorebookIds, lorebookId];
            storageManager.save();
            if (storageManager.lorebookUpdatedCallback) {
                storageManager.lorebookUpdatedCallback()
            }
            return;
        }
        if (!isSelected && storageManager.currentConversation.lorebookIds.includes(lorebookId)) {
            storageManager.currentConversation.lorebookIds = storageManager.currentConversation.lorebookIds.filter((s: string) => s !== lorebookId);
            storageManager.save();
            if (storageManager.lorebookUpdatedCallback) {
                storageManager.lorebookUpdatedCallback()
            }
        }
    };


    return (
        < DialogTrigger >
            <Button size="icon" aria-label='Edit Lorebook'><Edit /></Button>
            <DialogOverlay>
                <DialogContent className="max-w-[80%] max-h-[90%] overflow-y-scroll" closeButton={false}>
                    <DialogHeader>
                        <DialogTitle>Lorebooks</DialogTitle>
                    </DialogHeader>

                    <Separator />

                    <div className="flex items-center" key={`lbentries_${lorebookUpdateTimestamp}`}>
                        <TextField className="flex max-w-sm items-center gap-1.5 mr-2">
                            <Label className="py-2">Max Active Lorebook Entries (default: 10): </Label>
                            <Input placeholder={`${maxLorebookEntries}`} onBlur={handleMaxEntriesInputChange} />
                        </TextField>

                        <TextField className="flex max-w-sm items-center gap-1.5">
                            <Label className="py-2">Max Tokens for Lorebook Entries (default: 1000): </Label>
                            <Input placeholder={`${maxLorebookTokens}`} onBlur={handleMaxLorebookTokensInputChange} />
                        </TextField>
                    </div>
                    <div>0 in either field disables lorebook insertion <strong>entirely</strong>. -1 disables just that constraint. </div>

                    <Separator />

                    <TextField className="flex max-w-lg items-center gap-1.5">
                        <Label className="py-2">Add new lorebook: </Label>
                        <Input placeholder="Gandalf and his homies" onInput={handleNewLorebookInputChange} />
                        <Button size="md" aria-label='New Lorebook' onPress={handleCreateLorebook}>Create Lorebook </Button>
                    </TextField>

                    {/* Import */}

                    <Separator />

                    <div key={`${lorebookUpdateTimestamp}`} >
                        <span className="text-md font-medium">Enabled lorebooks:</span>
                        <div className='grid gap-2'>
                            {lorebooks.map((lb: Lorebook | undefined, index: number) => {
                                if (lb == undefined) {
                                    return;
                                }
                                const hideUp = (index == 0) ? " opacity-50 pointer-events-none" : "";
                                const hideDown = (index == lorebooks.length - 1) ? " opacity-50 pointer-events-none" : "";
                                return <div className="flex items-center bg-white hover:bg-gray-200 transition duration-300 ease-in-out px-2" key={lb.lorebookId}>
                                    <Checkbox defaultSelected={enabledLorebookIds.includes(lb.lorebookId)}
                                        onChange={(isSelected: boolean) => handleLorebookSelectionChange(lb.lorebookId, isSelected)}>
                                        {lb.lorebookName}
                                    </Checkbox>
                                    <div className="ml-auto">
                                        <span className='corner-button mx-2'><EditLorebookButton lorebookId={lb.lorebookId} /></span>
                                        {/* Export <Button size="icon"><Export /></Button> */}
                                        <span className={'corner-button mx-2' + hideUp}><Button size="icon" aria-label='Move lorebook up in list' onPress={() => handleReorderLorebook(lb.lorebookId, -1)}><ChevronUp /></Button></span>
                                        <span className={'corner-button mx-2' + hideDown}><Button size="icon" aria-label='Move lorebook down in list' onPress={() => handleReorderLorebook(lb.lorebookId, 1)}><ChevronDown /></Button></span>
                                        <span className='corner-button mx-2'><Button size="icon" aria-label='Delete lorebook' onPress={() => handleDeleteLorebook(lb.lorebookId)}><Delete /></Button></span>
                                    </div>
                                </div>
                            })}
                        </div>
                    </div>
                </DialogContent>
            </DialogOverlay>
        </DialogTrigger >
    )
};

const EditLorebookButton = ({ lorebookId }: { lorebookId: string }) => {
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