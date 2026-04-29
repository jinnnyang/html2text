# html2text

A robust, zero-dependency HTML to Markdown converter written in TypeScript.

This project is designed with a focus on structural correctness and clean output, making it ideal for web scrapers, crawlers, and AI-driven data processing pipelines.

## 🌟 Acknowledgments & Inspiration

- **Inspired by:** [Alir3z4/html2text](https://github.com/Alir3z4/html2text)
- **Acknowledge:** [nchapman/html2markdown-rs](https://github.com/nchapman/html2markdown-rs)
- **Thanks:** [Markdown Guide](https://www.markdownlang.com)

## ✨ Features

- **Zero Dependencies**: Pure TypeScript implementation with no external runtime dependencies.
- **Three-Stage Transformation**:
  1. **HTML Parser**: Parses raw HTML into a clean HTML AST.
  2. **Transformer**: Maps HTML AST nodes to Markdown AST (MDAST-inspired) nodes.
  3. **Stringifier**: Serializes the Markdown AST into high-quality Markdown text.
- **Rich Element Support**:
  - Headings (H1 - H6)
  - Tables (with headers)
  - Lists (Ordered, Unordered, Nested)
  - Definition Lists (`<dl>`, `<dt>`, `<dd>`)
  - Code Blocks (fenced) & Inline Code
  - Blockquotes
  - Links & Images (with title/alt support)
  - Text Formatting (Bold, Italic, Strikethrough)
  - YAML Front Matter support
  - Thematic Breaks & Hard Line Breaks

## 🚀 Quick Start

### Installation

Since this project is currently in development, you can clone the repository and use it directly in your TypeScript project.

```bash
git clone https://github.com/nchapman/html2markdown-rs.git
cd html2markdown-rs/html2text
npm install
```

### Basic Usage

```typescript
import { html2markdown } from './src';

const html = `
  <h1>Hello World</h1>
  <p>This is <strong>html2text</strong> conversion.</p>
  <ul>
    <li>Simple</li>
    <li>Robust</li>
  </ul>
`;

const markdown = html2markdown(html, {
  frontmatter: {
    title: "My Conversion",
    date: "2024-04-29"
  }
});

console.log(markdown);
```

## 🛠️ Development

This project was built primarily for **learning and exploration**, specifically to understand the nuances of document structure transformation. It is optimized to work seamlessly with web crawling tools to convert messy web content into clean, AI-friendly Markdown.

### Running the Example

You can run the included example to see the converter in action:

```bash
npx ts-node .\example\run-example.ts
```

## 📄 License

This project is licensed under the MIT License.
