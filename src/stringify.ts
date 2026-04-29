/**
 * Serializes a Markdown AST into a Markdown string.
 */

import type { MdNode, MdTable, MdTableRow, MdYaml } from "./types";

interface StringifyContext {
  // Empty context for now, can be extended later
}

/**
 * Serializes an array of Markdown AST nodes into a Markdown string.
 *
 * @param nodes - The Markdown AST nodes to serialize.
 * @returns The resulting Markdown string.
 */
export function stringifyMdNodes(nodes: MdNode[]): string {
  const context: StringifyContext = {};
  return stringifyNodesInternal(nodes, context).trim();
}

/**
 * Checks if a node is a block-level node in Markdown.
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

/**
 * Serializes a single Markdown AST node.
 */
function stringifyNode(node: MdNode, ctx: StringifyContext): string {
  switch (node.type) {
    case "yaml":
      return stringifyYaml(node) + "\n\n";

    case "root":
      return stringifyNodesInternal(node.children, ctx);

    case "heading": {
      const prefix = "#".repeat(node.depth);
      return `${prefix} ${stringifyChildren(node.children, ctx)}`;
    }

    case "paragraph":
      return stringifyNodesInternal(node.children, ctx).trim();

    case "text":
      return node.value;

    case "strong":
      return `**${stringifyChildren(node.children, ctx)}**`;

    case "emphasis":
      return `*${stringifyChildren(node.children, ctx)}*`;

    case "strikethrough":
      return `~~${stringifyChildren(node.children, ctx)}~~`;

    case "break":
      return "  \n";

    case "link": {
      const titleAttr = node.title ? ` "${node.title}"` : "";
      return `[${stringifyChildren(node.children, ctx)}](${node.url}${titleAttr})`;
    }

    case "image": {
      const titleAttr = node.title ? ` "${node.title}"` : "";
      return `![${node.alt}](${node.url}${titleAttr})`;
    }

    case "inlineCode":
      return `\`${node.value}\``;

    case "code": {
      const lang = node.lang || "";
      // Ensure the code block ends with a newline before the closing backticks
      const code = node.value.endsWith("\n") ? node.value : node.value + "\n";
      return `\`\`\`${lang}\n${code}\`\`\``;
    }

    case "blockquote": {
      const inner = stringifyNodesInternal(node.children, ctx).trim();
      return inner
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    }

    case "list": {
      let result = "";

      for (let i = 0; i < node.children.length; i++) {
        const item = node.children[i];
        if (!item) continue;
        const prefix = node.ordered ? `${(node.start || 1) + i}. ` : "- ";
        const indentStr = " ".repeat(prefix.length);

        let itemContent = stringifyNodesInternal(item.children, ctx).trim();
        itemContent = itemContent
          .split("\n")
          .map((line, idx) => {
            if (idx === 0) return line;
            return line.trim() ? `${indentStr}${line}` : line;
          })
          .join("\n");

        result += `${prefix}${itemContent}\n`;
      }

      return result.trimEnd();
    }

    case "definitionList": {
      let result = "";
      for (let i = 0; i < node.children.length; i++) {
        const item = node.children[i];
        if (!item) continue;

        if (item.type === "definitionTerm") {
          // Add a blank line if this term follows a description (separate items)
          if (i > 0 && node.children[i - 1]?.type === "definitionDescription") {
            result += "\n";
          }
          const termContent = stringifyNodesInternal(item.children, ctx).trim();
          result += `${termContent}\n`;
        } else if (item.type === "definitionDescription") {
          let descContent = stringifyNodesInternal(item.children, ctx).trim();

          // If the description contains multiple lines or starts with a block,
          // ensure it starts correctly after the colon.
          const hasBlock = item.children.some((child) => isBlockNode(child));

          if (hasBlock) {
            // For complex descriptions, it's safer to start on a new line
            descContent = descContent
              .split("\n")
              .map((line) => `  ${line}`)
              .join("\n");
            result += `: \n${descContent}\n`;
          } else {
            descContent = descContent
              .split("\n")
              .map((line, idx) => {
                if (idx === 0) return `: ${line}`;
                return line.trim() ? `  ${line}` : line;
              })
              .join("\n");
            result += `${descContent}\n`;
          }
        }
      }
      return result.trimEnd();
    }

    case "table":
      return stringifyTable(node, ctx);

    case "thematicBreak":
      return "---";

    case "html":
      return node.value;

    // These should be handled within their parents, but just in case
    case "listItem":
    case "definitionTerm":
    case "definitionDescription":
      return stringifyNodesInternal((node as any).children, ctx);

    case "tableRow":
    case "tableCell":
      return stringifyChildren((node as any).children, ctx);

    default:
      return "";
  }
}

function stringifyChildren(children: MdNode[], ctx: StringifyContext): string {
  return children.map((child) => stringifyNode(child, ctx)).join("");
}

/**
 * Internal helper to stringify nodes with proper block spacing.
 */
function stringifyNodesInternal(
  nodes: MdNode[],
  ctx: StringifyContext,
): string {
  let result = "";
  let prevNode: MdNode | null = null;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;

    const content = stringifyNode(node, ctx);
    if (!content && node.type !== "break") continue;

    const currentIsBlock = isBlockNode(node);
    const prevIsBlock = prevNode ? isBlockNode(prevNode) : false;

    if (currentIsBlock || prevIsBlock) {
      if (result.length > 0) {
        result = result.trimEnd() + "\n\n";
      }
    }

    result += content;
    prevNode = node;
  }
  return result;
}

/**
 * Serializes a Table by calculating column widths for a neat text alignment.
 */
function stringifyTable(table: MdTable, ctx: StringifyContext): string {
  if (table.children.length === 0) return "";

  const rows = table.children;
  // Calculate max width for each column
  const colWidths: number[] = [];

  // Extract text representation of all cells
  const stringifiedRows: string[][] = rows.map((row) => {
    return row.children.map((cell) =>
      stringifyChildren(cell.children, ctx).trim(),
    );
  });

  // Calculate widths
  stringifiedRows.forEach((row) => {
    row.forEach((cellText, colIdx) => {
      const width = cellText.length;
      const currentWidth = colWidths[colIdx] ?? 0;
      if (colIdx >= colWidths.length) {
        colWidths.push(Math.max(width, 3)); // Minimum width 3 for '---'
      } else {
        colWidths[colIdx] = Math.max(currentWidth, Math.max(width, 3));
      }
    });
  });

  let result = "";
  const hasHeader =
    rows.length > 0 && rows[0]?.children.some((cell) => cell.header);

  if (!hasHeader) {
    let dummyRow = "|";
    let sepStr = "|";
    for (let colIdx = 0; colIdx < colWidths.length; colIdx++) {
      const width = colWidths[colIdx] ?? 3;
      dummyRow += ` ${" ".repeat(width)} |`;
      sepStr += `-${"-".repeat(width)}-|`;
    }
    result += dummyRow + "\n" + sepStr + "\n";
  }

  // Render rows
  stringifiedRows.forEach((row, rowIdx) => {
    let rowStr = "|";
    for (let colIdx = 0; colIdx < colWidths.length; colIdx++) {
      const cellText = row[colIdx] || "";
      const width = colWidths[colIdx] ?? 3;
      const padLen = width - cellText.length;
      rowStr += ` ${cellText}${" ".repeat(padLen > 0 ? padLen : 0)} |`;
    }
    result += rowStr + "\n";

    // Render separator after the first row if it's a header
    if (rowIdx === 0 && hasHeader) {
      let sepStr = "|";
      for (let colIdx = 0; colIdx < colWidths.length; colIdx++) {
        const width = colWidths[colIdx] ?? 3;
        sepStr += `-${"-".repeat(width)}-|`;
      }
      result += sepStr + "\n";
    }
  });

  return result.trimEnd();
}

/**
 * Basic YAML stringifier for Front Matter.
 * Supports primitives, arrays, and flat objects.
 */
function stringifyYaml(node: MdYaml): string {
  if (typeof node.value === "string") {
    return `---\n${node.value.trim()}\n---`;
  }

  let yaml = "---\n";
  const obj = node.value as Record<string, any>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === "string") {
        // If string contains newlines or special chars, wrap in quotes
        if (val.includes("\n") || val.includes(":")) {
          yaml += `${key}: "${val.replace(/"/g, '\\"')}"\n`;
        } else {
          yaml += `${key}: ${val}\n`;
        }
      } else if (Array.isArray(val)) {
        yaml += `${key}:\n`;
        val.forEach((item) => {
          yaml += `  - ${item}\n`;
        });
      } else if (typeof val === "object" && val !== null) {
        yaml += `${key}:\n`;
        const subObj = val as Record<string, any>;
        for (const subKey in subObj) {
          yaml += `  ${subKey}: ${subObj[subKey]}\n`;
        }
      } else {
        yaml += `${key}: ${val}\n`;
      }
    }
  }
  yaml += "---";
  return yaml;
}
