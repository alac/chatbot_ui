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
import { Tab, TabList, TabPanel, Tabs } from "../ui/tabs"
import Delete from '@spectrum-icons/workflow/Delete';
import NewItem from '@spectrum-icons/workflow/NewItem';
import Switch from '@spectrum-icons/workflow/Switch';

import { storageManager, Conversation } from '../storage';


const ContextPanel = () => {
    const [conversationsUpdateCounter, setConversationsUpdateCounter] = useState(0);
    useEffect(() => {
        storageManager.conversationLifecycleCallback = () => {
            setConversationsUpdateCounter(x => x + 1)
        }
        return () => {
            storageManager.conversationLifecycleCallback = null;
        }
    },);

    return (
        <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
            <div className="flex items-center">
                <span className="text-md font-medium">Context</span>
                <div className="ml-auto">
                    <span className='corner-button'><NewConversationButton /></span>
                </div>
            </div>
            <span className="text-sm">
                <Tabs>
                    <TabList aria-label="Select Context Field">
                        <Tab id="Header">Header</Tab>
                        <Tab id="Footer">Footer</Tab>
                    </TabList>
                    <TabPanel id="Header">
                        Arma virumque cano, Troiae qui primus ab oris.
                    </TabPanel>
                    <TabPanel id="Footer">
                        Senatus Populusque Romanus.
                    </TabPanel>
                </Tabs>
            </span>

        </div>
    );
};


const NewConversationButton = () => {
    const date = new Date();
    const formattedDate = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
    const [conversationName, setConversationName] = useState(formattedDate + " - New Conversation");

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setConversationName(event.target.value);
    };

    const handleCreate = (close: () => void) => {
        storageManager.newConversation(conversationName);
        close();
    }
    return (
        <DialogTrigger>
            <Button size="icon" aria-label='Start a new conversation'><NewItem /></Button>
            <DialogOverlay>
                <DialogContent className="max-w-[40%] max-h-[90%]" isDismissable={true}>
                    {({ close }) => (<>
                        <DialogHeader>
                            <DialogTitle>New Conversation</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-5 items-center gap-4">
                            <Label htmlFor="conversationName" className="text-right">
                                Title:
                            </Label>
                            <Input
                                id="conversationName"
                                defaultValue={conversationName}
                                className="col-span-4"
                                onChange={handleInputChange}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" onPress={() => { handleCreate(close) }}>Create</Button>
                        </DialogFooter>
                    </>)}
                </DialogContent>
            </DialogOverlay>
        </DialogTrigger >
    )
};


export default ContextPanel;