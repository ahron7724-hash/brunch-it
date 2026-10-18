-- Page content is stored as plain text (paragraphs separated by blank lines, "## " for headings)
-- and rendered as JSX, never as raw HTML.
alter table public.pages rename column body_html to body_text;
alter table public.pages rename constraint pages_body_len to pages_body_text_len;
