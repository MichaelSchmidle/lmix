import MarkdownIt from 'markdown-it'

export default function useMarkdown() {
    const m = (message: string, renderOutline?: boolean) => {
        const mdIt = new MarkdownIt({ linkify: true })

        return renderOutline ? mdIt.render(message) : mdIt.renderInline(message)
    }

    return { m }
}