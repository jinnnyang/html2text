/**
 * Transforms an HTML AST into a Markdown AST.
 */

import type {
  HtmlElement,
  HtmlNode,
  MdNode,
  MdList,
  MdListItem,
  MdTable,
  MdTableRow,
  MdTableCell,
  MdCodeBlock,
  MdStrikethrough,
  MdDefinitionList,
  MdDefinitionTerm,
  MdDefinitionDescription,
} from "./types";

/**
 * Transforms an array of HtmlNodes into an array of MdNodes.
 * Handles filtering out empty text nodes and flattening nested structures where necessary.
 *
 * @param nodes - The HTML AST nodes to transform.
 * @returns The resulting Markdown AST nodes.
 */
export function transformNodes(nodes: HtmlNode[]): MdNode[] {
  const result: MdNode[] = [];

  for (const node of nodes) {
    const transformed = transformNode(node);
    if (Array.isArray(transformed)) {
      result.push(...transformed);
    } else if (transformed) {
      result.push(transformed);
    }
  }

  // Basic whitespace normalization for the current block level
  return cleanTextNodes(result);
}

/**
 * Transforms a single HtmlNode into one or more MdNodes.
 */
function transformNode(node: HtmlNode): MdNode | MdNode[] | null {
  if (node.type === "text") {
    // We keep all text spaces here, but clean them up in cleanTextNodes
    return { type: "text", value: node.content };
  }

  const { tag, attrs, children } = node as HtmlElement;

  switch (tag) {
    // --- Headings ---
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return {
        type: "heading",
        depth: parseInt(tag.charAt(1), 10) as 1 | 2 | 3 | 4 | 5 | 6,
        children: transformNodes(children),
      };

    // --- Block Elements ---
    case "p":
      return {
        type: "paragraph",
        children: transformNodes(children),
      };

    case "div":
    case "article":
    case "section":
    case "main":
    case "header":
    case "footer":
    case "nav":
    case "aside":
      // Treat structural blocks as pass-through containers.
      // Their children will be handled as siblings in the parent's stringifyNodesInternal.
      return transformNodes(children);

    case "blockquote":
      return {
        type: "blockquote",
        children: transformNodes(children),
      };

    case "hr":
      return { type: "thematicBreak" };

    case "br":
      return { type: "break" };

    // --- Inline Formatting ---
    case "strong":
    case "b":
      return {
        type: "strong",
        children: transformNodes(children),
      };

    case "em":
    case "i":
      return {
        type: "emphasis",
        children: transformNodes(children),
      };

    case "s":
    case "del":
    case "strike":
      return {
        type: "strikethrough",
        children: transformNodes(children),
      } as MdStrikethrough;

    case "code":
      // Basic heuristic: if it contains element children or newlines, it might be block
      // But typically, <pre><code> is a block, and <code> is inline.
      return {
        type: "inlineCode",
        value: extractRawText(children),
      };

    case "pre": {
      // Check if it's <pre><code>...</code></pre>
      let lang = "";
      let codeText = "";

      const firstChild = children[0];
      if (
        children.length === 1 &&
        firstChild &&
        firstChild.type === "element" &&
        firstChild.tag === "code"
      ) {
        const codeElement = firstChild as HtmlElement;
        const className = codeElement.attrs["class"] || "";
        const match = className.match(/language-([a-zA-Z0-9\-]+)/);
        if (match) {
          lang = match[1] || "";
        }
        codeText = extractRawText(codeElement.children).trim();
      } else {
        codeText = extractRawText(children).trim();
      }

      return {
        type: "code",
        lang,
        value: codeText,
      } as MdCodeBlock;
    }

    // --- Links & Images ---
    case "a":
      return {
        type: "link",
        url: attrs["href"] || "",
        ...(attrs["title"] ? { title: attrs["title"] } : {}),
        children: transformNodes(children),
      };

    case "img":
      return {
        type: "image",
        url: attrs["src"] || "",
        alt: attrs["alt"] || "",
        ...(attrs["title"] ? { title: attrs["title"] } : {}),
      };

    // --- Lists ---
    case "ul":
    case "ol":
      return {
        type: "list",
        ordered: tag === "ol",
        start: attrs["start"] ? parseInt(attrs["start"], 10) : undefined,
        children: transformNodes(children).filter(
          (n) => n.type === "listItem",
        ) as MdListItem[],
      } as MdList;

    case "li":
      return {
        type: "listItem",
        children: transformNodes(children),
      };

    // --- Definition Lists ---
    case "dl":
      return {
        type: "definitionList",
        children: transformNodes(children).filter(
          (n) =>
            n.type === "definitionTerm" || n.type === "definitionDescription",
        ) as (MdDefinitionTerm | MdDefinitionDescription)[],
      } as MdDefinitionList;

    case "dt":
      return {
        type: "definitionTerm",
        children: transformNodes(children),
      } as MdDefinitionTerm;

    case "dd":
      return {
        type: "definitionDescription",
        children: transformNodes(children),
      } as MdDefinitionDescription;

    // --- Tables ---
    case "table":
      return {
        type: "table",
        children: findTableRows(children),
      } as MdTable;

    // We don't handle tr/td/th here directly at the root,
    // they are extracted within `findTableRows`.
    case "tbody":
    case "thead":
    case "tfoot":
    case "tr":
    case "td":
    case "th":
      // These should be handled by findTableRows/findTableCells.
      // If encountered at the top level or outside a table, we ignore them to avoid duplication.
      return null;

    default:
      // Unknown tags (span, etc.): just pass through their children
      return transformNodes(children);
  }
}

/**
 * Extracts raw text from an HTML AST. Useful for `<pre>` or `<code>` blocks.
 */
function extractRawText(nodes: HtmlNode[]): string {
  let result = "";
  for (const node of nodes) {
    if (node.type === "text") {
      result += node.content;
    } else if (node.type === "element") {
      // For elements like <br> inside pre
      if (node.tag === "br") {
        result += "\n";
      } else {
        result += extractRawText(node.children);
      }
    }
  }
  return result;
}

/**
 * Finds and converts all <tr> elements inside a table (recursively checking thead/tbody).
 */
function findTableRows(nodes: HtmlNode[]): MdTableRow[] {
  const rows: MdTableRow[] = [];

  for (const node of nodes) {
    if (node.type === "element") {
      if (node.tag === "tr") {
        rows.push({
          type: "tableRow",
          children: findTableCells(node.children),
        });
      } else if (["thead", "tbody", "tfoot"].includes(node.tag)) {
        rows.push(...findTableRows(node.children));
      }
    }
  }

  return rows;
}

/**
 * Finds and converts all <td> and <th> elements inside a <tr>.
 */
function findTableCells(nodes: HtmlNode[]): MdTableCell[] {
  const cells: MdTableCell[] = [];

  for (const node of nodes) {
    if (node.type === "element" && (node.tag === "td" || node.tag === "th")) {
      cells.push({
        type: "tableCell",
        header: node.tag === "th",
        children: transformNodes(node.children),
      });
    }
  }

  return cells;
}

/**
 * Cleans up text nodes by collapsing excessive whitespace.
 * In a real browser, whitespace rules are very complex (block vs inline context).
 * We do a basic heuristic here.
 */
function cleanTextNodes(nodes: MdNode[]): MdNode[] {
  const cleaned: MdNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;

    if (node.type === "text") {
      // Replace multiple whitespaces/newlines with a single space
      let text = node.value.replace(/\s+/g, " ");

      const prev = cleaned[cleaned.length - 1];
      const next = nodes[i + 1];

      const isPrevBoundary =
        prev && (isBlockNode(prev) || prev.type === "break");
      const isNextBoundary =
        next && (isBlockNode(next) || next.type === "break");

      // Trim leading space if it's the first node or preceded by a block/break node
      if (!prev || isPrevBoundary) {
        text = text.trimStart();
      }

      // Trim trailing space if it's the last node or followed by a block/break node
      if (!next || isNextBoundary) {
        text = text.trimEnd();
      }

      if (text) {
        cleaned.push({ type: "text", value: text });
      }
    } else {
      cleaned.push(node);
    }
  }

  return cleaned;
}

/**
 * Checks if a node is a block-level node in Markdown.
 * Duplicate of logic in stringify but useful here for AST cleaning.
 */
function isBlockNode(node: MdNode): boolean {
  return [
    "paragraph",
    "heading",
    "list",
    "table",
    "blockquote",
    "code",
    "thematicBreak",
    "html",
    "yaml",
    "definitionList",
    "listItem",
  ].includes(node.type);
}
