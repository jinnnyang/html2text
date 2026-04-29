/**
 * html2text - Zero dependency HTML to Markdown converter
 */

import { parseHtml } from './parser';
import { transformNodes } from './transformer';
import { stringifyMdNodes } from './stringify';
import type { MdNode, MdRoot, MdYaml } from './types';

export * from './types';
export { parseHtml } from './parser';
export { transformNodes } from './transformer';
export { stringifyMdNodes } from './stringify';

export interface Html2MarkdownOptions {
  /**
   * YAML Front Matter to prepend to the output Markdown.
   * Can be a raw string or an object to be serialized.
   */
  frontmatter?: Record<string, any> | string;
}

/**
 * Converts an HTML string into Markdown text.
 *
 * @param html - The HTML string to convert.
 * @param options - Conversion options (e.g., frontmatter).
 * @returns The generated Markdown string.
 */
export function html2markdown(html: string, options?: Html2MarkdownOptions): string {
  // 1. Parse HTML string to HTML AST
  const htmlAst = parseHtml(html);

  // 2. Transform HTML AST to Markdown AST
  let mdNodes = transformNodes(htmlAst);

  // 3. Handle options like Front Matter
  if (options?.frontmatter) {
    const yamlNode: MdYaml = {
      type: 'yaml',
      value: options.frontmatter,
    };
    mdNodes = [yamlNode, ...mdNodes];
  }

  // Wrap in a Root node (optional, but good for structural completeness before stringifying)
  const root: MdRoot = {
    type: 'root',
    children: mdNodes,
  };

  // 4. Stringify Markdown AST to Markdown text
  return stringifyMdNodes([root]);
}
