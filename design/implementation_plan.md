# 实现零依赖 HTML 到 Markdown 转换器 (html2text)

该计划旨在不依赖任何第三方库（如 `cheerio`、`unified` 等）的情况下，使用纯 TypeScript 实现完整的 `HTML 文本 -> HTML AST -> Markdown AST -> Markdown 文本` 的转换管线。

## User Review Required

> [!IMPORTANT]
> **HTML 解析器的复杂度权衡**
> 浏览器级别的 HTML 解析极其复杂（涉及大量容错和特殊规则）。由于要求零依赖，我们将实现一个**轻量级但健壮的状态机/正则混合解析器**。它能完美处理标准的 HTML 标签嵌套、属性提取（如 `href`, `src`, `alt`, `title`）和表格结构，但可能无法 100% 模拟浏览器对极端畸形 HTML（如标签未闭合的交叉嵌套）的纠错行为。请确认这是否符合您的预期场景。

## 架构设计与文件拆分

系统分为三大独立模块，数据流向清晰，完全解耦。

### 1. 类型定义层 (`src/types.ts`)
定义 HTML AST 和 Markdown AST 的节点结构，使用 TypeScript 联合类型 (Union Types) 和判别属性 (Discriminant Properties) 实现严格的类型安全。

### 2. 解析层 (`src/parser.ts`)
纯字符串处理。遍历 HTML 字符串，利用状态机分词，构建带有层级关系的 HTML AST 树。

### 3. 转换层 (`src/transformer.ts`)
递归遍历 HTML AST。根据 HTML 标签类型（`tag`），将其映射并组装成 Markdown AST。例如将 `<table>` 转换为包含行和单元格的 MD 节点，将 `<a>` 转换为链接节点。

### 4. 生成层 (`src/stringify.ts`)
递归遍历 Markdown AST。将结构化的 MD 节点转换为纯文本。这里将处理缩进、列表前缀、表格对齐（计算列宽和分隔线）等格式化工作。

### 5. 组合入口 (`src/index.ts`)
提供对外的 `html2markdown(html: string): string` API，串联上述三个过程。

---

## 核心实现步骤与模块细节

### 1. 定义 AST 类型 (`types.ts`)

#### [NEW] `src/types.ts`
将包含详尽的 TSDoc 注释。

**HTML AST:**
```typescript
type HtmlNode = HtmlElement | HtmlText;
interface HtmlElement { type: 'element'; tag: string; attrs: Record<string, string>; children: HtmlNode[]; }
interface HtmlText { type: 'text'; content: string; }
```

**Markdown AST:**
```typescript
type MdNode = MdRoot | MdYaml | MdParagraph | MdHeading | MdText | MdStrong | MdEmphasis | MdLink | MdImage | MdList | MdListItem | MdTable | MdTableRow | MdTableCell | MdCodeBlock | MdInlineCode | MdBlockquote;

// 例如 YAML Front Matter、图片和表格的定义
interface MdYaml { type: 'yaml'; value: Record<string, any> | string; }
interface MdImage { type: 'image'; url: string; alt: string; title?: string; }
interface MdTable { type: 'table'; children: MdTableRow[]; }
```

### 2. 实现 HTML 解析器 (`parser.ts`)

#### [NEW] `src/parser.ts`
使用基于游标 (Cursor) 的字符串扫描解析：
- 识别文本节点
- 识别起始标签 `<tag attr="value">` 并提取属性（支持单引号、双引号和无引号属性）
- 识别结束标签 `</tag>`
- 维护一个栈 (Stack) 来构建父子树形结构。自闭合标签（如 `<img>`, `<br>`, `<hr>`）将特殊处理，不入栈。

### 3. 实现 AST 转换器 (`transformer.ts`)

#### [NEW] `src/transformer.ts`
通过 `transformNode(node: HtmlNode): MdNode | MdNode[]` 进行递归转换。
- **表格 (`table`, `tr`, `td`, `th`)**：将 `<td>` 内容转换为 `MdTableCell`，最终向上聚合成 `MdTable`。
- **链接 (`a`)**：提取 `attrs.href`，子节点递归转换后作为链接文本。
- **图片 (`img`)**：提取 `attrs.src`, `attrs.alt`, `attrs.title` 组装为 `MdImage`。
- **忽略无效标签**：如 `<script>`, `<style>`, `<meta>` 等将被过滤。
- **块级与行内元素处理**：处理连续的空白字符折叠问题。

### 4. 实现 Markdown 生成器 (`stringify.ts`)

#### [NEW] `src/stringify.ts`
- **YAML Front Matter**：如果根节点包含 `MdYaml`，在输出最顶部生成 `---` 包裹的 YAML 块（对象将序列化为 YAML 字符串，如果不依赖第三方库，可手写一个基础的对象转 YAML 函数）。
- **基础节点**：如加粗 `**${text}**`，斜体 `*${text}*`。
- **图片和链接**：`![${alt}](${url} "${title}")` 和 `[${text}](${url})`。
- **表格渲染**：遍历整个 `MdTable` 以确定每列的最大宽度，从而生成对齐美观的 Markdown 表格分隔线 `|---|---|`。
- **列表与嵌套**：维护当前的缩进级别 (Depth) 和列表符号，正确输出嵌套列表。

### 5. 入口与测试

#### [NEW] `src/index.ts`
导出核心函数和各个阶段的子模块，方便调试。对外 API 更新为支持传入 Front Matter 选项：
`html2markdown(html: string, options?: { frontmatter?: Record<string, any> | string }): string`。

#### [NEW] `test-run.ts`
提供包含复杂表格、带 title 的图片、YAML Front Matter、各种嵌套链接、多级列表等综合测试用例，运行并打印最终结果。

## 验证计划 (Verification Plan)

### 本地测试
我们将编写一个包含各种边缘情况的 HTML 字符串，运行 `ts-node test-run.ts`（或编译后执行）来验证：
1. **树结构完整性**：打印中间的 HTML AST 和 Markdown AST。
2. **特殊结构正确性**：验证表格对齐、图片属性的提取。
3. **类型安全性**：确保 `tsc` 编译通过，无任何 `any` 滥用，所有 AST 节点通过 Discriminant type 正确推导。
