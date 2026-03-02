import type { ExtractorFn, SimplifiedNode } from "../../types/extractor-types.js";

/**
 * Extracts component-related properties from INSTANCE nodes.
 */
export const componentExtractor: ExtractorFn = (_node, context) => {
  const result: Partial<SimplifiedNode> = {};
  
  const rawType = context.features?.rawType;

  if (rawType === "INSTANCE") {
    const compId = context.smartNode?.getComponentId();
    if (compId) {
      result.componentId = compId;
    }

    // Add specific properties for instances of components
    const compProps = context.smartNode?.getComponentProperties();
    if (compProps) {
      result.componentProperties = Object.entries(compProps).map(
        ([name, prop]: [string, any]) => ({
          name,
          value: prop.value.toString(),
          type: prop.type,
        }),
      );
    }
  }

  return result;
};
