import React, { useRef, useEffect, useState } from 'react';
import Delete from '@spectrum-icons/workflow/Delete';
import Deselect from '@spectrum-icons/workflow/Deselect';
import Compare from '@spectrum-icons/workflow/Compare';

import { DialogContent, DialogHeader, DialogOverlay, DialogTitle, DialogTrigger, } from "../../ui/dialog"
import { Button } from "../../ui/button"

import { storageManager, Message, decompressString } from '../../storage';


const ChatBubble = ({ data }: { data: Message }) => {
    const updateMessageText = (updatedText: string) => {
        storageManager.updateMessage({ ...data, text: updatedText, tokenCount: null })
        storageManager.save()
    }
    const toggleDisabled = () => {
        storageManager.updateMessage({ ...data, isDisabled: !data.isDisabled })
        storageManager.save()
    }
    const deleteMessage = () => {
        storageManager.deleteMessage(data.key)
        storageManager.save()
    }
    const [isEditing, setIsEditing] = useState(false);

    const promptButton = (< DialogTrigger >
        <span className='corner-button'><Button variant="outline" size="icon" aria-label='Show Prompt'><Compare /></Button></span>
        <DialogOverlay>
            <DialogContent className="max-w-[80%] max-h-[90%] overflow-y-scroll" closeButton={false}>
                <DialogHeader>
                    <DialogTitle>Prompt</DialogTitle>
                </DialogHeader>
                <div style={{ whiteSpaceCollapse: 'preserve' }}>
                    {decompressString(data.compressedPrompt)}
                </div>
            </DialogContent>
        </DialogOverlay>
    </DialogTrigger >
    )

    const ownMessage = data.userId === 'user'
    return (
        <div style={{ paddingBottom: '1rem', display: 'flex' }}>
            <div
                style={{
                    minWidth: '200px',
                    maxWidth: '80%',
                    width: isEditing ? '80%' : 'auto',
                    marginLeft: data.userId === 'user' ? 'auto' : undefined,

                    background: ownMessage ? '#0253B3' : '#F0F0F3',
                    color: ownMessage ? 'white' : 'black',
                    borderRadius: '1rem',
                    padding: '1rem',
                    whiteSpace: 'pre',
                    textWrap: 'wrap',
                    opacity: `${data.isDisabled ? .5 : 1}`,
                }}
            >
                <div className="flex items-center">
                    <span className="text-lg font-medium">{data.username}</span>
                    <div className="ml-auto">
                        <span className='corner-button'><Button variant="outline" size="icon" onPress={toggleDisabled} aria-label='Hide Message'><Deselect /></Button></span>
                        <span className='corner-button'><Button variant="outline" size="icon" onPress={deleteMessage} aria-label='Delete Message'><Delete /></Button></span>
                        {data.compressedPrompt !== "" ? promptButton : null}
                    </div>
                </div>
                <EditableText initialText={data.text} onTextChange={updateMessageText} isEditing={isEditing} setIsEditing={setIsEditing} key={data.text} />
            </div>
        </div >
    )
}


const EditableText = ({ initialText, onTextChange, isEditing, setIsEditing }: { initialText: string, onTextChange: (updatedText: string) => void, isEditing: boolean, setIsEditing: (isEditing: boolean) => void }) => {
    const [text, setText] = useState(initialText);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const spanRef = useRef<HTMLSpanElement>(null);

    const handleFocus = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onTextChange(text);
    };

    const handleTextEdit = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);
    };

    const [widthHeight, setWidthHeight] = useState([0, 0])
    const measureSpanHeight = () => {
        if (spanRef.current) {
            setWidthHeight([spanRef.current.offsetWidth, spanRef.current.offsetHeight])
        }
    }
    useEffect(measureSpanHeight, [isEditing])
    const setInitialTextareaSize = () => {
        if (textareaRef.current) {
            const [width, height] = widthHeight;
            textareaRef.current.style.minWidth = `${width}px`
            textareaRef.current.style.minHeight = `${height}px`
        }
    }
    useEffect(setInitialTextareaSize, [isEditing, widthHeight])

    const expandTextareaDuringEditing = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }
    useEffect(expandTextareaDuringEditing, [text]);

    return (
        <div
            onClick={handleFocus}
            onBlur={handleBlur}
            style={{ border: '1px solid #ccc', padding: '10px', cursor: 'pointer' }}
        >
            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextEdit}
                    autoFocus
                    className='message-body text-gray-700'
                    style={{ width: '100%' }}
                />
            ) : (
                <span
                    ref={spanRef}
                    className='message-body'
                >{text}</span>
            )}
        </div>
    );
};


export { ChatBubble, EditableText };