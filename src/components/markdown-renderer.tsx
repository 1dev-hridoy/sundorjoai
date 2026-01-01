import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("text-sm space-y-4", className)}>
            <ReactMarkdown
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <div className="rounded-md overflow-hidden my-2 shadow-sm border border-gray-800">
                                <SyntaxHighlighter
                                    {...props}
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: '0', fontSize: '12px' }}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code {...props} className={cn("bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono", className)}>
                                {children}
                            </code>
                        );
                    },
                    p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="pl-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-xl font-bold pb-2 border-b border-gray-200 mt-4 mb-2 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h3>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 py-1 italic text-gray-600 bg-gray-50 rounded-r-md">{children}</blockquote>,
                    a: ({ children, href }) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
