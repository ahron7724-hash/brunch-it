import clsx from "clsx";

import styles from "./RichText.module.css";

type RichTextProps = { text: string };

type Block = { key: string; kind: "heading" | "paragraph"; text: string };

/**
 * Renders owner-written plain text as JSX: blocks separated by blank lines,
 * a block starting with "## " becomes a heading. No HTML is ever interpreted.
 */
export function RichText({ text }: RichTextProps) {
  const blocks = parseBlocks(text);

  return (
    <div className={styles.text}>
      {blocks.map((block) =>
        block.kind === "heading" ? (
          <h2 key={block.key} className={clsx("reveal", styles.heading)}>
            {block.text}
          </h2>
        ) : (
          <p key={block.key} className="reveal">
            {block.text}
          </p>
        )
      )}
    </div>
  );
}

function parseBlocks(text: string): Block[] {
  const seen = new Map<string, number>();
  return text
    .split(/\n\s*\n/)
    .map((raw) => raw.trim())
    .filter((raw) => raw.length > 0)
    .map((raw) => {
      const isHeading = raw.startsWith("## ");
      const content = isHeading ? raw.slice(3).trim() : raw;
      // Key from the content itself; a counter separates identical blocks.
      const count = seen.get(content) ?? 0;
      seen.set(content, count + 1);
      return { key: `${count}:${content}`, kind: isHeading ? "heading" : "paragraph", text: content };
    });
}
