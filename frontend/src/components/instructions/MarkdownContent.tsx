import { type FC } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { InstructionImage } from './InstructionImage';

/* eslint-disable react/no-unstable-nested-components */
const markdownComponents: Components = {
    a({ href, children, ...rest }) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-4"
                {...rest}
            >
                {children}
            </a>
        );
    },
    code({ className: codeClassName, children }) {
        const isInline = !codeClassName;
        if (isInline) {
            return (
                <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm before:content-none after:content-none">
                    {children}
                </code>
            );
        }
        return <code className={codeClassName}>{children}</code>;
    },
    table({ children }) {
        return (
            <div className="my-4 w-full overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    {children}
                </table>
            </div>
        );
    },
    img({ src, alt }) {
        if (!src) return null;
        return <InstructionImage src={src} alt={alt ?? ''} />;
    },
};

export const MarkdownContent: FC<{ content: string }> = ({ content }) => {
    return (
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
        </Markdown>
    );
};
