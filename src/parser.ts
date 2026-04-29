/**
 * A lightweight, zero-dependency HTML parser.
 * It builds an HTML AST (HtmlNode[]) from an HTML string.
 */

import type { HtmlElement, HtmlNode, HtmlText } from './types';

// Tags that do not require a closing tag
const SELF_CLOSING_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

/**
 * Parses an HTML string into an array of HtmlNode objects (the AST).
 *
 * @param html - The HTML string to parse.
 * @returns The resulting HTML AST.
 */
export function parseHtml(html: string): HtmlNode[] {
  const root: HtmlElement = {
    type: 'element',
    tag: 'root',
    attrs: {},
    children: [],
  };

  const stack: HtmlElement[] = [root];
  let cursor = 0;

  function currentParent(): HtmlElement {
    const parent = stack[stack.length - 1];
    if (!parent) throw new Error('Stack underflow: no parent element found');
    return parent;
  }

  while (cursor < html.length) {
    const nextTagStart = html.indexOf('<', cursor);

    // 1. Text node before the next tag (or end of file)
    if (nextTagStart === -1) {
      const textContent = html.slice(cursor);
      if (textContent) {
        currentParent().children.push({ type: 'text', content: decodeHtmlEntities(textContent) });
      }
      break;
    }

      const textContent = html.slice(cursor, nextTagStart);
      if (textContent) {
        currentParent().children.push({ type: 'text', content: decodeHtmlEntities(textContent) });
      }

    cursor = nextTagStart;

    // 2. Handle Comments <!-- ... -->
    if (html.startsWith('<!--', cursor)) {
      const commentEnd = html.indexOf('-->', cursor + 4);
      if (commentEnd === -1) {
        break; // Unclosed comment, stop parsing
      }
      cursor = commentEnd + 3;
      continue;
    }

    // 3. Handle DOCTYPE <!DOCTYPE ...>
    if (html.startsWith('<!', cursor) || html.startsWith('<?', cursor)) {
      const endMarker = html.indexOf('>', cursor);
      if (endMarker === -1) break;
      cursor = endMarker + 1;
      continue;
    }

    // 4. Handle Closing Tag </tag>
    if (html.startsWith('</', cursor)) {
      const closeEnd = html.indexOf('>', cursor + 2);
      if (closeEnd === -1) break;

      const tag = html.slice(cursor + 2, closeEnd).trim().toLowerCase();
      
      // Find the closest matching tag in the stack
      let matchedIndex = -1;
      for (let i = stack.length - 1; i >= 1; i--) { // Don't pop 'root'
        const element = stack[i];
        if (element && element.tag === tag) {
          matchedIndex = i;
          break;
        }
      }

      if (matchedIndex !== -1) {
        // Pop all tags up to the matched one
        stack.length = matchedIndex;
      }
      
      cursor = closeEnd + 1;
      continue;
    }

    // 5. Handle Opening Tag <tag attr="value">
    const tagMatch = html.slice(cursor).match(/^<([a-zA-Z0-9\-]+)([^>]*)>/);
    if (!tagMatch) {
      // Not a valid tag, treat '<' as text
      currentParent().children.push({ type: 'text', content: '<' });
      cursor++;
      continue;
    }

    const [fullMatch, rawTag, rawAttrs] = tagMatch;
    if (!rawTag || rawAttrs === undefined) {
      currentParent().children.push({ type: 'text', content: '<' });
      cursor++;
      continue;
    }
    const tag = rawTag.toLowerCase();
    
    // Ignore <script> and <style> content entirely
    if (tag === 'script' || tag === 'style') {
      const closeTag = `</${tag}>`;
      const endIdx = html.toLowerCase().indexOf(closeTag, cursor + fullMatch.length);
      if (endIdx !== -1) {
        cursor = endIdx + closeTag.length;
      } else {
        cursor = html.length; // Unclosed, skip to end
      }
      continue;
    }

    let cleanAttrsStr = rawAttrs.trim();
    const isSelfClosingMarker = cleanAttrsStr.endsWith('/');
    if (isSelfClosingMarker) {
      cleanAttrsStr = cleanAttrsStr.slice(0, -1);
    }
    const attrs = parseAttributes(cleanAttrsStr);
    const isSelfClosing = SELF_CLOSING_TAGS.has(tag) || isSelfClosingMarker;

    const element: HtmlElement = {
      type: 'element',
      tag,
      attrs,
      children: [],
    };

    currentParent().children.push(element);

    if (!isSelfClosing) {
      stack.push(element);
    }

    cursor += fullMatch.length;
  }

  // Flatten the raw HTML text (handles cases where spacing around block elements might be tricky,
  // but we'll do real whitespace normalization in the transformer).
  return root.children;
}

/**
 * Extracts attributes from a raw attribute string.
 * Supports `name="value"`, `name='value'`, and `name=value`.
 *
 * @param attrStr - The inner string of a tag containing its attributes.
 * @returns A dictionary of attributes.
 */
function parseAttributes(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};

  // Regex to match attributes
  // Matches: name="val" OR name='val' OR name=val OR name
  const attrRegex = /([a-zA-Z0-9\-:]+)(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^>\s]+)))?/g;

  let match;
  while ((match = attrRegex.exec(attrStr)) !== null) {
    const name = (match[1] || "").toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? ""; // If no value, default to empty string
    attrs[name] = decodeHtmlEntities(value);
  }

  return attrs;
}

/**
 * Entity decoder for text and attributes.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&([a-zA-Z0-9]+);/g, (match, entity) => {
      const entities: Record<string, string> = {
        amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
        nbsp: ' ', copy: '©', reg: '®', mdash: '—', ndash: '–',
        ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
        hellip: '…', trade: '™'
      };
      return entities[entity.toLowerCase()] || match;
    })
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
