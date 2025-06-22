import type { Schema } from "hast-util-sanitize"
import { marked } from "marked"
import { memo, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { Codeblock } from "./codeblock"
import "katex/dist/katex.min.css"

// Custom sanitization schema
const sanitizeSchema: Schema = {
    tagNames: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "blockquote",
        "ul",
        "ol",
        "li",
        "strong",
        "em",
        "del",
        "code",
        "pre",
        "hr",
        "br",
        "a",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td"
    ],
    attributes: {
        "*": ["className", "id", "data-theme"],
        a: ["href", "title", "target", "rel"],
        img: ["src", "alt", "title", "width", "height"],
        card: ["title", "subtext", "largeText", "id", "caption"],
        financialchart: ["*"]
    },
    protocols: {
        href: ["http", "https", "mailto"],
        src: ["http", "https"]
    }
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
    const tokens = marked.lexer(markdown)
    return tokens.map((token) => token.raw)
}

const MemoizedMarkdownBlock = memo(
    ({ content }: { content: string }) => {
        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
                rehypePlugins={[
                    [rehypeSanitize, sanitizeSchema],
                    [rehypeKatex, { output: "html" }]
                ]}
                components={{
                    code: Codeblock
                }}
            >
                {content}
            </ReactMarkdown>
        )
    },
    (prevProps, nextProps) => {
        if (prevProps.content !== nextProps.content) return false
        return true
    }
)

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

export const MemoizedMarkdown = memo(({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content])

    return blocks.map((block, index) => (
        <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ))
})

MemoizedMarkdown.displayName = "MemoizedMarkdown"
