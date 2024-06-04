import { Button } from "./../ui/button"
import CollectionEdit from '@spectrum-icons/workflow/CollectionEdit';

const LorebookPanel = ({ }) => {
    return (
        <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
            <div className="flex items-center">
                <h1>Lorebook</h1>
                <div className="ml-auto">
                    <span className='message-option'><Button size="icon" aria-label='Edit Lorebook'><CollectionEdit /></Button></span>
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


export default LorebookPanel;