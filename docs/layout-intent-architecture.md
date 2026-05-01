# 布局意图推断架构升级设计（Layout Intent Architecture）

> **状态**：待办，作为未来架构升级方向记录。
> **背景**：当前 pipeline 在处理非 AutoLayout（GROUP / FRAME(NONE)）容器下的子节点时，直接将其标记为 absolute 并剔除出 layout 推断流程，导致大量"视觉上应为 flex/grid"的结构（如 `Mon/Tues/Wed/...`、`图标+数字`、卡片网格）退化为绝对定位。零散的启发式算法（adjacency-clustering、layout-grouping、list-pattern、spatial-merging）各自为政、互相掣肘，难以在保证正确性的同时得到语义化的布局输出。
> **决策前提**（已与项目所有者确认）：
> 1. 以一份测试稿为单位，逐稿迭代调优；
> 2. 接受 headless 渲染对比作为反馈信号；
> 3. 完全迁移到新架构，不保留渐进式旧路径；
> 4. 纯算法，不引入任何 ML / 分类器 / embedding。

---

## 1. 目标与评判标准

"最优"不是"看起来对"，而是同时满足：

| 维度       | 含义                                                                  |
| -------- | ------------------------------------------------------------------- |
| **正确性**  | 输出布局与 Figma 原稿视觉等价（像素 / 结构误差 < 阈值）                                  |
| **语义化**  | HTML/CSS 使用 flex/grid/自适应，而非堆叠 `position: absolute`                  |
| **鲁棒性**  | 对坐标噪声、手工随意摆放的设计稿容忍                                                  |
| **可演进** | 新增推断规则不会退化成 if-else 巨兽，不破坏既有输出                                      |

---

## 2. 当前架构的根本问题

```
Figma JSON
  → Extractor（提取原始属性）
  → Algorithms（彼此独立的启发式：adjacency / layout-grouping / spatial-merging / list-pattern）
  → Reconstruction（组装树）
  → Codegen（写 CSS）
```

**缺了什么**：Extractor 与 Algorithms 之间缺一层 **"布局意图识别（Layout Intent Recognition）"**。当前各算法：

1. **彼此不通信**：一个算法的推断结果不反馈给另一个；
2. **证据系统不统一**：每个算法用自己的阈值、自己的信号；
3. **没有置信度**：推断对错的代价不可控；
4. **无全局视角**：缺乏"这整个 GROUP 是一个菜单/卡片列表"的整体判断；
5. **过度信任 Figma 的 `position: absolute` 标记**：GROUP 下子节点全被剔除出推断。

结果：大量应为 flex 的结构被错误地输出为绝对定位。

---

## 3. 新架构总览

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 1: Normalization（归一化）                              │
│   - GROUP / FRAME / COMPONENT / INSTANCE 统一为 Node          │
│   - absoluteBoundingBox → 本地坐标                            │
│   - 剥离视觉旋转（当前 pipeline 已完成）                      │
│   - 文本属性规整：textAutoResize / truncation / fontFeatures │
│   输出：NormalizedTree                                        │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Layer 2: Feature Extraction（特征提取）                       │
│   SelfFeature（自身）：type, sizeClass, textClass, color,     │
│     fontSize, fontWeight, aspectRatio, isLeaf                │
│   SiblingRelation（兄弟）：                                   │
│     xAlignGroups, yAlignGroups, gapPatterns,                 │
│     sizeSimilarityClusters, typeHomogeneityScore             │
│   ParentContext（父）：父是否 autoLayout、父尺寸、约束        │
│   输出：FeatureMap                                            │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Layer 3: Hypothesis Generation（假设生成）★                  │
│   每个容器生成多个候选假设：                                   │
│   H = { row, column, grid(r×c), stack(absolute), overlay }   │
│   每个假设附带 localCost、evidence、childConstraints          │
│   输出：HypothesisPool                                        │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Layer 4: Global Consistency Solver（全局一致性求解）          │
│   树 DP，在整棵树上选一组互相兼容的假设，最小化全局代价         │
│   输出：AssignedTree                                          │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Layer 5: Layout Synthesis（布局合成）                         │
│   基于 AssignedTree 生成虚拟容器结构（virtual flex、           │
│   inline-flex 组合、ellipsis 包裹等）                          │
│   输出：SynthesizedTree                                       │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Layer 6: Codegen（基本沿用现有 core/codegen）                 │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Layer 7: Visual Regression（仅开发态）                        │
│   Headless 渲染 HTML → 与 Figma 截图做分块 SSIM 对比          │
│   差异映射回节点 → 反馈进代价函数，驱动下一轮求解               │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. 核心数据结构

### 4.1 LayoutHypothesis（假设）

```ts
type LayoutMode =
  | { kind: "row";     gap: number; align: "start" | "center" | "end" | "stretch"; justify: string; wrap: boolean }
  | { kind: "column";  gap: number; align: ...; justify: ... }
  | { kind: "grid";    rows: number; cols: number; gap: [number, number] }
  | { kind: "stack";   order: "absolute" }                    // 兜底绝对定位
  | { kind: "overlay"; base: NodeId; overlays: NodeId[] };    // 如卡片 + 标注

interface LayoutHypothesis {
  mode: LayoutMode;
  evidence: Evidence[];       // 支持证据，可追溯
  localCost: number;          // 单独看这个容器的代价

  childConstraints: {
    nodeId: NodeId;
    required: Partial<ChildConstraint>;   // 例如 "必须 width=hug"
  }[];

  parentRequirements?: {
    mustBe?: "flex" | "any";
    mustNotBe?: "stack";
  };
}

interface Evidence {
  kind:
    | "y-align" | "x-align" | "uniform-gap"
    | "type-homogeneous" | "same-font"
    | "figma-autolayout" | "constraint-hint" | ...;
  strength: number;    // [0, 1]
  detail: any;         // 可审计
}
```

### 4.2 代价函数的确定形式

```ts
// 单容器代价
localCost(h, container, children) =
    w_semantic * semanticCost(h.mode)                  // stack > row/column > grid-like
  + w_visual   * visualDeviationCost(h, children)      // 与 AABB 摆放的像素差
  + w_sizing   * sizingFlexCost(h, children)           // 是否丢失 hug/fill 语义
  + w_noise    * noisePenalty(children)                // 子节点坐标方差
  - w_evidence * Σ evidence.strength                   // 证据支持减少代价

// 整树代价
globalCost(assignment) =
    Σ localCost(h_v, v)
  + w_consistency * Σ inconsistencyPenalty(v, parent(v))
  + w_symmetry    * Σ symmetryViolation(siblings)
```

`w_*` 为**有限个静态权重**，通过在测试稿上做网格搜索 / Nelder-Mead 调优——**非 ML**，而是多参数最优化。

---

## 5. 求解策略（纯算法）

| 方案                        | 复杂度              | 何时使用       | 备注                |
| ------------------------- | ---------------- | ---------- | ----------------- |
| **A. 自底向上树 DP**（推荐）       | O(N · H²)        | 父假设仅依赖直接子  | 首选，最稳定            |
| B. 消息传递（Belief Propagation） | O(N · H² · K)    | 跨兄弟强约束     | 树 DP 能覆盖 ≥ 90% 场景 |
| C. ILP（整数线性规划）            | 指数 worst-case    | 约束复杂度爆炸时兜底 | 仅极端场景             |

**推荐 A**。状态转移：

```
treeCost(v, h) = localCost(h, v, children(v))
               + Σ_{c ∈ children(v)} min_{h'} [treeCost(c, h') + compatPenalty(h, h')]

整棵树最优 = min_h treeCost(root, h)
```

每个容器 Hypothesis 通常 ≤ 5 个，整体复杂度 O(N · 25)，完全可接受。

---

## 6. Hypothesis 生成规则（纯算法）

### 6.1 容器 → row / column 候选

```
对容器 v 的 children：
  1) 按 x 投影（IoU < ε 视为独立）得 Sx；按 y 投影得 Sy
  2) 若 |Sx| == children.length 且 |Sy| == 1
     → 强候选 row，gap = median of x-gaps
  3) 若 |Sy| == children.length 且 |Sx| == 1
     → 强候选 column，gap = median of y-gaps
  4) 两者皆成立（单元素） → 都加入池
  5) 否则 → 考察 grid / overlay / stack
```

对齐容差：`tolerance = 0.25 * min(child.height) + 1px`（文本 baseline 对齐用比例而非绝对值）。

### 6.2 容器 → grid 候选

```
若 |children| ≥ 4 且：
  - 可按 x 切成 ≥ 2 列
  - 可按 y 切成 ≥ 2 行
  - 行数 × 列数 == |children|
  - 单元尺寸方差 < 阈值
→ 生成 grid(rows, cols) 候选
```

（8 张课程卡应在此分支识别为 grid 2×4，语义优于当前两个虚拟 row 容器。）

### 6.3 stack（absolute）兜底

永远作为最低优先级候选保留；`localCost` 基线最高，但保证在所有假设都不成立时仍能输出正确视觉。

### 6.4 文本节点专属 Hypothesis

| 条件                                | Hypothesis                  | 说明     |
| --------------------------------- | --------------------------- | ------ |
| `textAutoResize == WIDTH_AND_HEIGHT` | `nowrap + width: max-content` | 总是生成   |
| `textAutoResize == HEIGHT`           | `wrap + width: 固定`           | 总是生成   |
| `textTruncation == ENDING`           | `nowrap + ellipsis`          | 强候选    |
| 字号 ≥ 18 且单行                         | `nowrap` 候选                  | 启发式    |
| 全数字 / 短字符                           | `nowrap + width: auto`       | 启发式    |

### 6.5 "图标 + 文本"行内组合

```
若容器 v 的子节点数 == 2：
  - a 为小尺寸图像（≤ 32px）
  - b 为 TEXT
  - y 中心对齐容差 ≤ 3px
  - x 间距 ≤ b.fontSize * 0.8
→ 高置信 row(align: center, wrap: false) 候选
```

自然处理 `🔥 250` / `📍 Location` 等组合。

---

## 7. 全局一致性约束

```
inconsistencyPenalty(parent_h, child_h):
  if parent_h.mode == "stack":
    penalty = 0
  if parent_h.mode in {"row", "column"}:
    if child.position == "absolute" in child_h:
      penalty = λ1 * (1 - stretchTolerance)
    else:
      penalty = 0
  if parent_h.mode == "grid":
    if child 尺寸 与 grid cell 不匹配:
      penalty = λ2

symmetryViolation(siblings):
  countBy(s => s.selectedHypothesis.kind)
  分布越不均匀，penalty 越大
  （鼓励同父兄弟选相同 mode）
```

全部为**纯代价函数**，非 ML；权重可通过测试稿调参固化。

---

## 8. 视觉回归（Layer 7）

不是事后检查，而是求解器外层循环：

```
repeat:
  assignment = solveTree(hypothesisPool, costWeights)
  html       = synthesize(assignment) && render()
  errorMap   = compareToFigma(html, figmaScreenshot)   // 分块 SSIM
  if errorMap.isEmpty(): break
  else: boostVisualCost(errorMap) in hypothesisPool
```

停机条件：像素误差 < 阈值 或迭代超限。视觉对比由此从人工 QA 变为**自动代价修正**。

---

## 9. 完全迁移计划

### 9.1 删除清单

| 文件 / 模块                                      | 被取代                          |
| -------------------------------------------- | ---------------------------- |
| `core/extractors/algorithms/layout-grouping.ts`      | Hypothesis 生成 + Solver        |
| `core/extractors/algorithms/adjacency-clustering.ts` | 启发式迁移为 Evidence               |
| `core/extractors/algorithms/utils/list-pattern.ts`   | Hypothesis 中 grid / list 覆盖   |
| `core/extractors/algorithms/spatial-merging.ts`      | 合入 Hypothesis 生成阶段            |
| `core/extractors/analysis/analyze.ts` 中布局推断分支       | 迁移到 Feature Extraction        |

### 9.2 新建目录（建议）

| 路径                                  | 职责            |
| ----------------------------------- | ------------- |
| `core/intent/normalize.ts`          | Layer 1       |
| `core/intent/features.ts`           | Layer 2       |
| `core/intent/hypotheses/*.ts`       | Layer 3，每种假设一 |
| `core/intent/solver/tree-dp.ts`     | Layer 4       |
| `core/intent/synthesis.ts`          | Layer 5       |
| `core/intent/cost.ts`               | 代价函数集中管理      |
| `core/intent/evidence.ts`           | 证据类型定义        |
| `tools/visual-regression/`          | Layer 7 开发态工具 |

### 9.3 Codegen 保留

`core/codegen` 基本不改，输入从"零散 layout 对象"换为 "Solver 产出的 AssignedTree"，接口更清晰。

---

## 10. 推进顺序（未来执行时参考）

1. **基础契约**：定义 `LayoutHypothesis` / `Evidence` / `Cost` 的 TS 类型与 JSDoc；
2. **端到端 Row 假设**：串通 Feature → Hypothesis → Solver → Codegen，仅支持 row；
3. **替换 layout-grouping**：新链路覆盖当前课程卡场景；
4. **文本专属假设**：加入 nowrap / ellipsis / inline-flex 的假设生成；
5. **视觉回归闭环**：接入 Puppeteer + SSIM；
6. **下线旧算法**：adjacency-clustering → list-pattern → spatial-merging；
7. **权重调参**：全部测试稿跑完后，网格搜索调 `w_*` 参数收敛。

---

## 11. 风险与注意事项

* **求解退化**：当 Hypothesis 池膨胀且约束紧时，树 DP 可能无可行解 → 必须保证 stack 兜底始终在池中。
* **权重过拟合**：逐稿调参可能导致在当前稿过拟合、对新稿退化 → 维护"反例库"，每轮调参后在全量反例库回归。
* **代价函数可计算性**：所有组件需可在 O(N) 内计算，禁止任何隐式递归 / 反射开销。
* **GROUP 的语义保真**：有些 GROUP 本就无布局意义（装饰组合），强制推 flex 会破坏视觉 → 保留"置信度不足即回退 stack"机制。

---

## 12. 对四条决策的最终对齐

| 决策                       | 架构落地                                        |
| ------------------------ | ------------------------------------------- |
| 1. 一稿一调                  | 步骤 5-7 的"视觉回归驱动调参"正好匹配                      |
| 2. 做渲染对比                 | Layer 7 把视觉对比做成求解器反馈信号                      |
| 3. 完全迁移                  | 第 9 节明确废弃清单，无渐进式并存                          |
| 4. 纯算法                   | 全链路基于规则 + 最优化；唯一参数是代价权重，调参为确定性数学过程，非学习过程     |

---

## 附录 A：与当前 pipeline 已发现问题的映射

| 当前问题                            | 新架构如何解决                                                                |
| ------------------------------- | ---------------------------------------------------------------------- |
| 课程卡 virtual-grouping 错位         | Hypothesis 生成阶段直接识别为 grid 2×4，由 Solver 输出一个 grid 容器                    |
| GROUP 下并排文本（Mon/Tues/...）未被推为 flex | Feature Extraction + Hypothesis 不再剔除 absolute 节点，row 证据强支持             |
| 图标 + 文本组合（🔥 250）独立 absolute    | 行内组合假设（§6.5）高置信 row                                                    |
| 文本被强制设 width 导致换行异常            | 文本专属 Hypothesis（§6.4）提供 nowrap / max-content / ellipsis 候选             |
| 两个相同尺寸的虚拟容器被合并成同一 class       | 每个容器在 Hypothesis 中携带自身 `locationRelativeToParent`，layout 对象本身已区分      |

---

**结语**：本文档定位为未来架构升级的设计基线。任何重构 PR 应回溯此文档，确保未退回到"启发式拼凑 + 局部贪心"的旧模式。
