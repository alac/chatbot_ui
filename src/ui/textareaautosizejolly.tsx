import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize';
import { clsx } from "clsx"

const style = "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

const TextAreaAutosizeJolly = ({ className, ...props }: TextareaAutosizeProps) => {
    return <TextareaAutosize className={clsx(style, className)}  {...props} />
}

export default TextAreaAutosizeJolly;