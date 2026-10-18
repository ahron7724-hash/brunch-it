import { Fragment } from "react";

type BidiTextProps = { text: string };

// Numeric ranges and fractions such as "8–10", "10:00–12:00" or "1/3".
const NUMERIC_RUN = /(\d[\d:.,]*(?:\s*[–\-/]\s*\d[\d:.,]*)+)/;

/**
 * Renders Hebrew text so numeric ranges keep their left-to-right order
 * ("8–10 סועדים" would otherwise display as "10–8 סועדים").
 */
export function BidiText({ text }: BidiTextProps) {
  const parts = text.split(NUMERIC_RUN);
  // split() with a capture group alternates: text, match, text, match…
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <bdi key={`${index}:${part}`} dir="ltr">
            {part}
          </bdi>
        ) : (
          <Fragment key={`${index}:${part}`}>{part}</Fragment>
        )
      )}
    </>
  );
}
