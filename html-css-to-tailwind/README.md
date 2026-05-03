# HTML CSS To Tailwind

一个针对 `html片段字符串 + css字符串` 场景的独立转换函数库。

## API

```ts
import { convertHtmlCssToTailwind } from "@codify/html-css-to-tailwind";

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

- `index.ts`：公共 API 和转换流程编排
- `src/map-css-to-tailwind.ts`：CSS 规则到 Tailwind 类映射
- `src/rewrite-html-fragment.ts`：将映射应用到 HTML 片段
