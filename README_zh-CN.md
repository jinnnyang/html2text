# html2text

一个使用 TypeScript 编写的健壮、零依赖的 HTML 转 Markdown 工具。

本项目专注于转换过程中的结构正确性和输出内容的整洁度，非常适合用于网页爬虫、数据采集以及 AI 数据预处理流程。

## 🌟 致敬与灵感

- **灵感来源：** [Alir3z4/html2text](https://github.com/Alir3z4/html2text)
- **技术参考：** [nchapman/html2markdown-rs](https://github.com/nchapman/html2markdown-rs)
- **致谢：** [Markdown Guide](https://www.markdownlang.com)

## ✨ 特性

- **零依赖**：纯 TypeScript 实现，无任何外部运行时依赖。
- **三阶段转换流水线**：
  1. **HTML 解析 (Parser)**：将原始 HTML 字符串解析为简洁的 HTML AST。
  2. **转换映射 (Transformer)**：将 HTML AST 节点精确映射为 Markdown AST 节点。
  3. **字符串序列化 (Stringifier)**：将 Markdown AST 转换为高质量、格式规范的 Markdown 文本。
- **丰富的元素支持**：
  - 标题 (H1 - H6)
  - 表格 (支持表头、对齐等)
  - 列表 (有序、无序、嵌套列表)
  - 定义列表 (`<dl>`, `<dt>`, `<dd>`)
  - 代码块 (栅栏式) 与行内代码
  - 引用块 (Blockquotes)
  - 链接与图片 (支持 title/alt 属性)
  - 文本格式化 (加粗、斜体、删除线)
  - 支持 YAML Front Matter
  - 分割线与硬换行

## 🚀 快速上手

### 安装

本项目目前处于开发阶段，您可以克隆仓库并在您的 TypeScript 项目中直接引用。

```bash
git clone https://github.com/nchapman/html2markdown-rs.git
cd html2markdown-rs/html2text
npm install
```

### 基础用法

```typescript
import { html2markdown } from './src';

const html = `
  <h1>你好，世界</h1>
  <p>这是 <strong>html2text</strong> 转换效果。</p>
  <ul>
    <li>简单</li>
    <li>强大</li>
  </ul>
`;

const markdown = html2markdown(html, {
  frontmatter: {
    title: "我的转换文档",
    date: "2024-04-29"
  }
});

console.log(markdown);
```

## 🛠️ 项目初衷

本项目主要以**学习与研究**为目的，旨在深入探索文档结构转换的实现细节。它非常适合配合爬虫工具使用，将杂乱的网页内容转换为结构清晰、易于 AI 理解的 Markdown 格式。

### 运行示例

您可以运行内置的示例程序来查看转换效果：

```bash
npx ts-node .\example\run-example.ts
```

## 📄 开源协议

本项目采用 MIT 协议开源。
