import React, { useState, useEffect } from "react";

import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Label } from "../ui/field";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "../ui/menu";
import Delete from "@spectrum-icons/workflow/Delete";
import NewItem from "@spectrum-icons/workflow/NewItem";
import Switch from "@spectrum-icons/workflow/Switch";
import RailLeft from "@spectrum-icons/workflow/RailLeft";

import { storageManager, Conversation } from "../storage";

const MenuPanel = ({
  setShowToolsBar,
}: {
  setShowToolsBar: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [conversationsUpdateCounter, setConversationsUpdateCounter] =
    useState(0);
  useEffect(() => {
    storageManager.conversationLifecycleCallback = () => {
      setConversationsUpdateCounter((x) => x + 1);
    };
    return () => {
      storageManager.conversationLifecycleCallback = null;
    };
  });

  const [showSwitchConversationDialog, setShowSwitchConversationDialog] =
    useState(false);
  const [showNewConversationDialog, setShowNewConversationDialog] =
    useState(false);

  return (
    <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
      <div className="flex items-center">
        <span className="text-md font-medium">Menu</span>
        <div className="ml-auto corner-button">
          <MenuTrigger>
            <Button aria-label="Menu" size="icon" variant="outline">
              ☰
            </Button>
            <MenuPopover>
              <Menu>
                <MenuItem onAction={() => setShowNewConversationDialog(true)}>
                  <Button size="icon">
                    <NewItem />
                  </Button>
                  New Chat
                </MenuItem>
                <MenuItem
                  onAction={() => setShowSwitchConversationDialog(true)}
                >
                  <Button size="icon">
                    <Switch />
                  </Button>
                  Switch Chat
                </MenuItem>
                <MenuItem onAction={() => setShowToolsBar((b) => !b)}>
                  <Button size="icon">
                    <RailLeft />
                  </Button>
                  Toggle Tools
                </MenuItem>
              </Menu>
            </MenuPopover>
          </MenuTrigger>
        </div>
      </div>
      <SwitchConversationDialog
        isDialogOpen={showSwitchConversationDialog}
        setIsDialogOpen={setShowSwitchConversationDialog}
        conversationsUpdateCounter={conversationsUpdateCounter}
      />
      <NewConversationDialog
        isDialogOpen={showNewConversationDialog}
        setIsDialogOpen={setShowNewConversationDialog}
      />
    </div>
  );
};

interface SwitchConversationButtonProps {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  conversationsUpdateCounter: number;
}

const SwitchConversationDialog = ({
  isDialogOpen,
  setIsDialogOpen,
  conversationsUpdateCounter,
}: SwitchConversationButtonProps) => {
  return (
    <DialogTrigger isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Button className="hidden">Hidden Trigger</Button>
      <DialogOverlay>
        <DialogContent
          side="right"
          className="max-w-[80%] overflow-y-scroll"
          isDismissable={true}
        >
          <DialogHeader>
            <DialogTitle>Conversations</DialogTitle>
          </DialogHeader>

          <Separator />

          <div
            className="grid gap-2"
            key={"ConvList_" + conversationsUpdateCounter}
          >
            {Array.from(storageManager.conversations.values()).map(
              (conversation: Conversation) => {
                const isLoaded =
                  storageManager.storageState.currentConversationId ===
                  conversation.conversationId;
                var conversationTitleTag = (
                  <span>{conversation.displayName}</span>
                );
                if (isLoaded) {
                  conversationTitleTag = (
                    <span>
                      {conversation.displayName}{" "}
                      <span className="font-medium">(loaded)</span>
                    </span>
                  );
                }
                const hideLoad = isLoaded
                  ? " opacity-50 pointer-events-none"
                  : "";
                const hideDelete = isLoaded
                  ? " opacity-50 pointer-events-none"
                  : "";

                return (
                  <div
                    className="flex items-center hover:bg-gray-200 transition duration-300 ease-in-out px-2"
                    key={conversation.conversationId}
                  >
                    <span className={"corner-button mx-2" + hideLoad}>
                      <Button
                        size="icon"
                        aria-label="Switch Conversation"
                        onPress={() => {
                          storageManager.setActiveConversation(
                            conversation.conversationId
                          );
                        }}
                      >
                        <Switch />
                      </Button>
                    </span>
                    {conversationTitleTag}
                    <div className="ml-auto">
                      <span className={"corner-button mx-2" + hideDelete}>
                        <Button
                          size="icon"
                          aria-label="Delete Conversation"
                          onPress={() => {
                            storageManager.deleteConversation(
                              conversation.conversationId
                            );
                          }}
                        >
                          <Delete />
                        </Button>
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </DialogContent>
      </DialogOverlay>
    </DialogTrigger>
  );
};

interface NewConversationButtonProps {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NewConversationDialog = ({
  isDialogOpen,
  setIsDialogOpen,
}: NewConversationButtonProps) => {
  const date = new Date();
  const formattedDate = `${
    date.getMonth() + 1
  }-${date.getDate()}-${date.getFullYear()}`;
  const [conversationName, setConversationName] = useState(
    formattedDate + " - New Conversation"
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConversationName(event.target.value);
  };

  const handleCreate = (close: () => void) => {
    storageManager.newConversation(conversationName);
    close();
  };
  return (
    <DialogTrigger isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Button className="hidden">Hidden Trigger</Button>
      <DialogOverlay>
        <DialogContent className="max-w-[40%] max-h-[90%]" isDismissable={true}>
          {({ close }) => (
            <>
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
                <Button
                  type="submit"
                  onPress={() => {
                    handleCreate(close);
                  }}
                >
                  Create
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </DialogOverlay>
    </DialogTrigger>
  );
};

export default MenuPanel;
