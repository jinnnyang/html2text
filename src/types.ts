/**
 * HTML to Markdown Converter Types
 *
 * This file defines the Abstract Syntax Tree (AST) structures for both
 * the parsed HTML and the generated Markdown.
 */

// ==========================================
// 1. HTML AST Types
// ==========================================

/**
 * A node in the HTML AST.
 * It can be either an Element (tag) or a Text node.
 */
export type HtmlNode = HtmlElement | HtmlText;

/**
 * Represents an HTML element like <p>, <div>, <a>, etc.
 */
export interface HtmlElement {
  /** Discriminant property to identify the node type */
  type: 'element';
  /** The tag name in lowercase (e.g., 'div', 'a', 'img') */
  tag: string;
  /** A dictionary of HTML attributes */
  attrs: Record<string, string>;
  /** The child nodes of this element */
  children: HtmlNode[];
}

/**
 * Represents a raw text node inside HTML.
 */
export interface HtmlText {
  /** Discriminant property to identify the node type */
  type: 'text';
  /** The raw text content */
  content: string;
}

// ==========================================
// 2. Markdown AST (MDAST inspired) Types
// ==========================================

/**
 * A node in the Markdown AST.
 */
export type MdNode =
  | MdRoot
  | MdYaml
  | MdParagraph
  | MdHeading
  | MdText
  | MdStrong
  | MdEmphasis
  | MdLink
  | MdImage
  | MdList
  | MdListItem
  | MdTable
  | MdTableRow
  | MdTableCell
  | MdCodeBlock
  | MdInlineCode
  | MdBlockquote
  | MdThematicBreak
  | MdStrikethrough
  | MdBreak
  | MdHtml // Fallback for raw HTML that we don't convert
  | MdDefinitionList
  | MdDefinitionTerm
  | MdDefinitionDescription;

/**
 * The root node of the Markdown document.
 */
export interface MdRoot {
  type: 'root';
  children: MdNode[];
}

/**
 * YAML Front Matter block at the top of the document.
 */
export interface MdYaml {
  type: 'yaml';
  /** The front matter value. It can be an object to be serialized, or a raw string. */
  value: Record<string, unknown> | string;
}

/**
 * A standard Markdown paragraph.
 */
export interface MdParagraph {
  type: 'paragraph';
  children: MdNode[];
}

/**
 * A Markdown heading (e.g., # Heading 1).
 */
export interface MdHeading {
  type: 'heading';
  /** The depth of the heading (1-6) */
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  children: MdNode[];
}

/**
 * Plain text within Markdown.
 */
export interface MdText {
  type: 'text';
  value: string;
}

/**
 * Strong (bold) text (e.g., **text**).
 */
export interface MdStrong {
  type: 'strong';
  children: MdNode[];
}

/**
 * Emphasis (italic) text (e.g., *text*).
 */
export interface MdEmphasis {
  type: 'emphasis';
  children: MdNode[];
}

/**
 * A Markdown link (e.g., [Text](url "title")).
 */
export interface MdLink {
  type: 'link';
  url: string;
  title?: string;
  children: MdNode[];
}

/**
 * A Markdown image (e.g., ![alt](url "title")).
 */
export interface MdImage {
  type: 'image';
  url: string;
  alt: string;
  title?: string;
}

/**
 * A Markdown list (either ordered or unordered).
 */
export interface MdList {
  type: 'list';
  /** Whether the list is ordered (1. 2. 3.) or unordered (- - -) */
  ordered: boolean;
  /** The starting number for ordered lists */
  start?: number;
  children: MdListItem[];
}

/**
 * An item within a Markdown list.
 */
export interface MdListItem {
  type: 'listItem';
  children: MdNode[];
}

/**
 * A Markdown table.
 */
export interface MdTable {
  type: 'table';
  children: MdTableRow[];
}

/**
 * A row within a Markdown table.
 */
export interface MdTableRow {
  type: 'tableRow';
  children: MdTableCell[];
}

/**
 * A cell within a Markdown table row.
 */
export interface MdTableCell {
  type: 'tableCell';
  /** Whether this cell is a header cell <th> */
  header: boolean;
  children: MdNode[];
}

/**
 * A fenced code block (e.g., ```js ... ```).
 */
export interface MdCodeBlock {
  type: 'code';
  /** The programming language specified after the backticks */
  lang?: string;
  /** The raw code content */
  value: string;
}

/**
 * Inline code (e.g., `code`).
 */
export interface MdInlineCode {
  type: 'inlineCode';
  value: string;
}

/**
 * A blockquote (e.g., > Quote).
 */
export interface MdBlockquote {
  type: 'blockquote';
  children: MdNode[];
}

/**
 * A horizontal rule / thematic break (e.g., ---).
 */
export interface MdThematicBreak {
  type: 'thematicBreak';
}

/**
 * Raw HTML embedded in Markdown.
 */
export interface MdHtml {
  type: 'html';
  value: string;
}

/**
 * Strikethrough text (e.g., ~~text~~).
 */
export interface MdStrikethrough {
  type: 'strikethrough';
  children: MdNode[];
}

/**
 * A hard line break (e.g., <br> or two spaces at end of line).
 */
export interface MdBreak {
  type: 'break';
}

/**
 * A Markdown definition list (from <dl>).
 */
export interface MdDefinitionList {
  type: 'definitionList';
  children: (MdDefinitionTerm | MdDefinitionDescription)[];
}

/**
 * A term in a definition list (from <dt>).
 */
export interface MdDefinitionTerm {
  type: 'definitionTerm';
  children: MdNode[];
}

/**
 * A description in a definition list (from <dd>).
 */
export interface MdDefinitionDescription {
  type: 'definitionDescription';
  children: MdNode[];
}
