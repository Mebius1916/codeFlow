# 项目工程约束

## `interface` 与 `type`

> Internal: types. External: interfaces.
> “Be conservative in what you do, be liberal in what you accept from others.”

- `interface`：用于表达对外稳定对象契约、跨模块共享结构、组件 `Props`、store state 和输入输出 DTO。
- `type`：用于表达联合类型、函数类型、条件类型、映射类型、工具类型，以及模块内部的中间态、组合态、派生态或局部类型别名。

| 场景                                              | 选择                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 联合类型、函数类型、条件类型、映射类型、工具类型  | `type`                                                                                    |
| Props、store state、DTO、跨模块稳定复用的对象契约 | `interface`                                                                               |
| 模块内部使用的小型对象、中间态、组合态            | `type`                                                                                    |
| 普通对象结构两者都能写，且没有明显边界语义        | 先和同一语义层保持一致；没有既定写法时，<br />对外契约用 `interface`，内部实现用 `type` |
