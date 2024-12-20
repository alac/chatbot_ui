import React, { useState, useEffect } from "react";

import {
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Tab, TabList, TabPanel, Tabs } from "../ui/tabs";
import Edit from "@spectrum-icons/workflow/Edit";
import TextareaAutosize from "react-textarea-autosize";

import { storageManager } from "../storage";

const ContextPanel = () => {
  const [contextUpdatedCounter, setContextUpdatedCounter] = useState(0);
  useEffect(() => {
    storageManager.contextUpdatedCallback = () => {
      setContextUpdatedCounter((x) => x + 1);
    };
    return () => {
      storageManager.contextUpdatedCallback = null;
    };
  });

  useEffect(() => {
    setMemoryValue(storageManager.currentConversation.memory);
    setAuthorsNote(storageManager.currentConversation.authorNote);
  }, [contextUpdatedCounter]);

  const [memoryValue, setMemoryValue] = useState(
    storageManager.currentConversation.memory
  );
  const handleMemoryInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMemoryValue(event.target.value);
    storageManager.currentConversation.memory = event.target.value;
    storageManager.persistConversation();
  };
  const [authorsNote, setAuthorsNote] = useState(
    storageManager.currentConversation.authorNote
  );
  const handleAuthorsNoteInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setAuthorsNote(event.target.value);
    storageManager.currentConversation.authorNote = event.target.value;
    storageManager.persistConversation();
  };

  const [autoExpandPanelInputs, setAutoExpandPanelInputs] = useState(true);

  return (
    <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
      <div className="flex items-center">
        <span className="text-md font-medium">Context</span>
        <div className="ml-auto">
          <span className="corner-button">
            <ContextDialogButton
              memory={memoryValue}
              handleSetMemory={handleMemoryInputChange}
              authorsNote={authorsNote}
              handleSetAuthorsNote={handleAuthorsNoteInputChange}
              autoExpandPanelInputs={autoExpandPanelInputs}
              setAutoExpandPanelInputs={setAutoExpandPanelInputs}
            />
          </span>
        </div>
      </div>
      <span className="text-sm">
        <Tabs>
          <TabList aria-label="Select Context Field">
            <Tab id="Memory">Description</Tab>
            <Tab id="AuthorsNote">Author's Note</Tab>
          </TabList>
          <TabPanel id="Memory" className="mt-0">
            {autoExpandPanelInputs ? (
              <TextareaAutosize
                className="sidebar-text-field"
                value={memoryValue}
                onChange={handleMemoryInputChange}
                style={{ width: "100%" }}
              />
            ) : (
              <textarea
                className="sidebar-text-field"
                value={memoryValue}
                onChange={handleMemoryInputChange}
                style={{ width: "100%" }}
              />
            )}
          </TabPanel>
          <TabPanel id="AuthorsNote" className="mt-0">
            {autoExpandPanelInputs ? (
              <TextareaAutosize
                className="sidebar-text-field"
                value={authorsNote}
                onChange={handleAuthorsNoteInputChange}
                style={{ width: "100%" }}
              />
            ) : (
              <textarea
                className="sidebar-text-field"
                value={authorsNote}
                onChange={handleAuthorsNoteInputChange}
                style={{ width: "100%" }}
              />
            )}
          </TabPanel>
        </Tabs>
      </span>
    </div>
  );
};

interface ContextDialogProps {
  memory: string;
  handleSetMemory: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  authorsNote: string;
  handleSetAuthorsNote: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  autoExpandPanelInputs: boolean;
  setAutoExpandPanelInputs: React.Dispatch<React.SetStateAction<boolean>>;
}

const ContextDialogButton = (props: ContextDialogProps) => {
  return (
    <DialogTrigger>
      <Button size="icon" aria-label="Start a new conversation">
        <Edit />
      </Button>
      <DialogOverlay>
        <DialogContent
          className="max-w-[40%] max-h-[90%] overflow-y-scroll"
          isDismissable={true}
        >
          {({ close }) => (
            <>
              <DialogHeader>
                <DialogTitle>Edit Context</DialogTitle>
              </DialogHeader>

              <div className="grid gap-2" style={{ width: "100%" }}>
                <Checkbox
                  defaultSelected={props.autoExpandPanelInputs}
                  onChange={props.setAutoExpandPanelInputs}
                >
                  Sidebar panel expands to fit Description/Author's Note
                </Checkbox>
              </div>

              <div className="grid gap-2" style={{ width: "100%" }}>
                <span className="text-md font-medium">Description:</span>
                <TextareaAutosize
                  className="sidebar-text-field"
                  value={props.memory}
                  onChange={props.handleSetMemory}
                  style={{ width: "100%" }}
                />
                <span className="text-md">
                  The <i>description</i> is inserted at the top of the
                  conversation. Use it to provide an arbitray amount of
                  background information for the conversation.
                </span>
              </div>
              <div className="grid gap-2">
                <span className="text-md font-medium">Author's Note:</span>
                <TextareaAutosize
                  className="sidebar-text-field"
                  value={props.authorsNote}
                  onChange={props.handleSetAuthorsNote}
                  style={{ width: "100%" }}
                />
                <span className="text-md">
                  The <i>author's note</i> is inserted near the end of the
                  conversation. Use it to <i>remind</i> the AI of important
                  information, or to guide the next responses.
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </DialogOverlay>
    </DialogTrigger>
  );
};

export default ContextPanel;
