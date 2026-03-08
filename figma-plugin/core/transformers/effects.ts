import type {
  DropShadowEffect,
  InnerShadowEffect,
  BlurEffect,
} from "@figma/rest-api-spec";
import { SmartNode } from "../extractors/analysis/index.js";
import { htmlColor } from "./style";
import { resolveVariableColorName } from "./utils/text-utils.js";
import type { SimplifiedEffects } from "../types/simplified-types.js";

export { SimplifiedEffects };

export function buildSimplifiedEffects(node: SmartNode): SimplifiedEffects {
  const effects = node.getEffects();
  if (!effects.length) return {};

  // Handle drop and inner shadows (both go into CSS box-shadow)
  const dropShadows = effects
    .filter((e): e is DropShadowEffect => e.type === "DROP_SHADOW")
    .map(simplifyDropShadow);

  const innerShadows = effects
    .filter((e): e is InnerShadowEffect => e.type === "INNER_SHADOW")
    .map(simplifyInnerShadow);

  const boxShadow = [...dropShadows, ...innerShadows].join(", ");

  // Handle blur effects - separate by CSS property
  // Layer blurs use the CSS 'filter' property
  const filterBlurValues = effects
    .filter((e): e is BlurEffect => e.type === "LAYER_BLUR")
    .map(simplifyBlur)
    .join(" ");

  // Background blurs use the CSS 'backdrop-filter' property
  const backdropFilterValues = effects
    .filter((e): e is BlurEffect => e.type === "BACKGROUND_BLUR")
    .map(simplifyBlur)
    .join(" ");

  const result: SimplifiedEffects = {};

  if (boxShadow) {
    if (node.isText()) {
      result.textShadow = boxShadow;
    } else {
      result.boxShadow = boxShadow;
    }
  }
  if (filterBlurValues) result.filter = filterBlurValues;
  if (backdropFilterValues) result.backdropFilter = backdropFilterValues;

  return result;
}

function simplifyDropShadow(effect: DropShadowEffect) {
  const variableName = resolveVariableColorName(effect);
  const fallbackColor = htmlColor(effect.color, effect.color.a);
  const color = variableName ? `var(--${variableName}, ${fallbackColor})` : fallbackColor;
  return `${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${effect.spread ?? 0}px ${color}`;
}

function simplifyInnerShadow(effect: InnerShadowEffect) {
  const variableName = resolveVariableColorName(effect);
  const fallbackColor = htmlColor(effect.color, effect.color.a);
  const color = variableName ? `var(--${variableName}, ${fallbackColor})` : fallbackColor;
  return `inset ${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${effect.spread ?? 0}px ${color}`;
}

function simplifyBlur(effect: BlurEffect) {
  return `blur(${effect.radius}px)`;
}
