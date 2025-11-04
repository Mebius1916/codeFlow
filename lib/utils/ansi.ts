/**
 * 当 Node.js 使用 console.log() 输出数组、对象时，会自动添加颜色（通过 util.inspect()）
 * 简单方案：移除所有 ANSI 代码
 */
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[\d+m/g, '')
}


