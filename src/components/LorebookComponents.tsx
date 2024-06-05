import {
    DialogContent,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
    DialogTrigger,
} from "./../ui/dialog"
import { Button } from "./../ui/button"
import Edit from '@spectrum-icons/workflow/Edit';

const LorebookPanel = ({ }) => {
    return (
        <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
            <div className="flex items-center">
                <span className="text-md font-medium">Lorebook</span>
                <div className="ml-auto">
                    <span className='corner-button'><Button size="icon" aria-label='Edit Lorebook'><Edit /></Button></span>
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