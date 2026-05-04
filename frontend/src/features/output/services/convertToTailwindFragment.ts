import { convertHtmlCssToTailwind } from '../../../../../converters/index'
import type { BuildTailwindFragmentInput, TailwindFragmentResult } from '../interfaces/model'

export async function convertToTailwindFragment(
  input: BuildTailwindFragmentInput,
): Promise<TailwindFragmentResult> {
  const htmlFragment = input.body || input.html
  const fragment = await convertHtmlCssToTailwind(htmlFragment, input.css)

  return {
    fragment,
    size: input.size,
  }
}
