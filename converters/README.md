# Converters

一个面向代码产物转换场景的独立函数库，当前先提供 `html片段字符串 + css字符串 -> tailwind html片段` 的转换能力。

## API

```ts
import { convertHtmlCssToTailwind } from "@codify/converters";

const html = '<div class="card title">Hello</div>';
const css = ".card{display:flex;padding:16px}.title{color:#111;font-size:14px}";

const tailwindHtml = await convertHtmlCssToTailwind(html, css);
```

## 当前策略

- 只处理简单类选择器
- 读取 HTML 片段上的 class
- 将 class 对应的 CSS 规则映射为 Tailwind utilities
- 默认移除 `data-id` 之类的设计追踪属性
- 输出 Tailwind HTML 片段字符串（非完整 HTML 文档）

## 代码结构

- `index.ts`：包根聚合导出
- `html-to-tailwind/index.ts`：`html + css -> tailwind html片段` 的公共入口
- `html-to-tailwind/convert.ts`：转换流程编排
- `html-to-tailwind/css/build-map.ts`：CSS 规则到 Tailwind 类映射
- `html-to-tailwind/html/rewrite-classes.ts`：将映射应用到 HTML 片段
- `html-to-tailwind/html/clean-fragment.ts`：清理最终 Tailwind 片段
