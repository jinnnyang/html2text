---
title: "将 Markdown 转为 AST：实现思路与实战解析"
source: "https://jishuzhan.net/article/1966396546759049218"
date: 2026-04-29
---

将 Markdown 转为 AST：实现思路与实战解析 - 技术栈[技术栈](/)**

# 将 Markdown 转为 AST：实现思路与实战解析

huabuyu2025-09-12 15:00

## 将 Markdown 转为 AST：实现思路与实战解析

在前端开发中，有时我们不仅仅需要渲染 Markdown，还希望对其结构进行精细化操作，比如自定义组件渲染、添加交互或者导出成不同格式。这时，把 Markdown 转为 AST（抽象语法树）就非常必要。本文将分享一个完整的实现思路，并提供 TypeScript 实现示例。

---

### 功能目标

我们的目标是：

1. 将 Markdown 文本解析成一棵 AST 树；
2. 支持文本、代码块、HTML 标签、换行等节点类型；
3. 支持自定义标签（如 `<map>` 标签）和属性解析；
4. AST 树便于后续渲染或进一步处理。

效果示意：

ini 复制代码

```ini
const markdown = `
# 标题
这是 **加粗** 文本
<map name="myMap">地图</map>
`;

const ast = mdToAST(markdown);
console.log(ast);
```

输出：

css 复制代码

```css
[  { "type": "heading", "attrs": { "level": 1 }, "children": [{ "type": "text", "text": "标题" }] },
  { "type": "paragraph", "children": [
      { "type": "text", "text": "这是 " },
      { "type": "strong", "children": [{ "type": "text", "text": "加粗" }] },
      { "type": "text", "text": " 文本" }
  ]},
  { "type": "map", "attrs": { "name": "myMap" }, "children": [
      { "type": "text", "text": "地图" }
  ]}
]
```

---

### 实现思路

实现主要分为两个步骤：

1. **将 Markdown 转为 Token**
2. **将 Token 转为 AST**

#### 1️⃣ 使用 `markdown-it` 解析 Markdown 为 Token

`markdown-it` 是一款强大的 Markdown 解析器，它会将 Markdown 文本解析为 token 列表，每个 token 描述了一个语法结构。

ini 复制代码

```ini
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true });
const tokens = md.parse(markdown, {});
```

Token 示例：

json 复制代码

```json
[
  { "type": "heading_open", "tag": "h1", "attrs": null },
  { "type": "inline", "content": "标题", "children": [...] },
  { "type": "heading_close", "tag": "h1" }
]
```

---

#### 2️⃣ 将 Token 转为 AST

Token 的解析是核心步骤，我们需要处理以下几种情况：

##### 文本与内联代码

go 复制代码

```go
if (token.type === 'text' || token.type === 'code_inline') {
  addNode({ type: 'text', text: token.content });
}
```

##### 自定义 HTML 标签 `<map>`

我们使用正则匹配 `<map ...>` 标签，并解析属性：

typescript 复制代码

```typescript
const MAP_TAG_OPEN_REGEX = /^<map\s+([^>]*)>/i;

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([\w-:]+)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = regex.exec(attrString))) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}
```

解析 `<map name="myMap">地图</map>`，生成 AST 节点：

json 复制代码

```json
{ "type": "map", "attrs": { "name": "myMap" }, "children": [{ "type": "text", "text": "地图" }] }
```

##### 块级与内联节点的递归

使用 `stack` 来维护嵌套结构：

go 复制代码

```go
if (token.type.endsWith('_open')) {
  const node: ASTNode = { type, attrs: {}, children: [] };
  addNode(node);
  stack.push({ node });
}

if (token.type.endsWith('_close')) {
  stack.pop();
}
```

##### 换行处理

ini 复制代码

```ini
if (token.type === 'softbreak') addNode({ type: 'softbreak' });
if (token.type === 'hardbreak') addNode({ type: 'hardbreak' });
```

##### 内联 token 递归

ini 复制代码

```ini
if (token.type === 'inline' && token.children) {
  const childrenAST = tokensToAST(token.children);
  childrenAST.forEach(child => addNode(child));
}
```

---

### 核心亮点

1. **支持自定义标签**  
   支持 `<map>` 等自定义 HTML 标签，并能解析属性，便于做可交互组件渲染。
2. **完整的 AST 结构**  
   支持嵌套结构，通过栈维护父子关系，AST 可以直接用于渲染或导出其他格式。
3. **文本与 HTML 混合处理**  
   文本、内联代码、HTML 块、换行都能正确处理，保证 Markdown 原意保留。
4. **可扩展性强**  
   新增自定义标签只需增加正则匹配即可，整体解析逻辑清晰。

---

### 总结

本文展示了如何用 TypeScript 将 Markdown 转为 AST，并支持自定义标签和属性解析。核心思路是：

1. 使用 `markdown-it` 将 Markdown 转为 token；
2. 递归解析 token，处理文本、内联代码、HTML、自定义标签、换行等；
3. 利用栈维护嵌套关系，生成完整的 AST。

这种方式非常适合在前端进行自定义渲染、编辑器实现、导出格式转换等场景。

[前端](/tag/14)[上一篇：Spring DI/IOC核心原理详解](/article/1966396488776990721)[下一篇：Java中的集合类有哪些？如何分类的？](/article/1966396983100882946)相关推荐[岩岩很哇塞！19 小时前【vue实现模仿探探卡片滑动切换效果】前端·javascript·vue.js](/article/2049031102724112385)[无我Code20 小时前全套开源：一款云端服务+本地设备计算的文生图应用前端·人工智能·后端](/article/2049019529322364930)[用户693717500138421 小时前实测可用｜小米 MiMo 百万亿 Token 免费领，开发者速冲前端·后端·ai编程](/article/2049015385375178753)[前端小万21 小时前令人头痛的前端环境前端·前端工程化](/article/2049012637959258114)[明月_清风21 小时前Nginx 模块机制深度解析：从核心原理到生产实践前端·nginx](/article/2049009421037142017)[APIshop21 小时前1688 跨境寻源通详情接口深度解析：从接入到实战前端·网络·chrome](/article/2049005365606547457)[爱上好庆祝21 小时前学习js的第四天前端·css·学习·html·css3·js](/article/2049003314403147777)[d111111111d21 小时前UAER问题+修复小bug前端·javascript·笔记·stm32·单片机·嵌入式硬件·学习](/article/2049003008428670978)[kyriewen111 天前Next.js：让你的React应用从“裸奔”到“穿衣服”开发语言·前端·javascript·react.js·设计模式·ecmascript](/article/2048995295078449154)热门推荐[01GitHub 镜像站点](/article/1965957555249266689)[02近期有什么ai的新消息，新动态？ 2026.4月](/article/2045871296593068034)[032026年4月AI大事件深度解读：大模型竞争进入“深水区“](/article/2046095399023345666)[042026年AI编程工具终极横评：Cursor vs Claude Code vs Copilot](/article/2048219965103341570)[05Codex 接入 DeepSeek API 完整配置文档](/article/2047609374831607810)[06【AI】2026 年具身智能模型和世界模型总结](/article/2048254266264059906)[07在Windows 11上安装Docker的踩坑记录](/article/2048268850177835010)[08零基础教你claude code 接入 deepseek V4](/article/2048580911776727042)[092026年AI前瞻：量子AI、具身智能与科学发现的新纪元](/article/2044279190728540162)[10codex app每次打开重连5次Reconnecting问题解决](/article/2046185682050285570)