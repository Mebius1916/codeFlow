
import type { Node as FigmaNode } from "@figma/rest-api-spec";
import type { NodeFeatures } from "./types.js";

/**
 * Smart Node Wrapper
 * Encapsulates raw Figma node data and analyzed features into a unified, type-safe API.
 */
export class SmartNode {
  constructor(
    public readonly raw: FigmaNode,
    public readonly features: NodeFeatures,
    public readonly parent?: SmartNode
  ) {}

  get id() { return this.raw.id; }
  get name() { return this.raw.name; }
  get type() { return this.raw.type; }

  /**
   * Type Guards
   */
  isContainer(): boolean {
    return this.features.isContainer;
  }

  isText(): boolean {
    return this.features.looksLikeText;
  }

  isIcon(): boolean {
    return this.features.looksLikeIcon;
  }

  isImage(): boolean {
    return this.features.looksLikeImage;
  }

  isVisible(): boolean {
    return this.features.isVisible;
  }

  /**
   * Layout Helpers
   */
  getLayoutMode(): "row" | "column" | "none" {
    if (this.isContainer()) {
      return this.features.layoutMode;
    }
    return "none";
  }

  getLayoutAlign() {
    if (this.isContainer() && this.features.layoutAlign) {
      return this.features.layoutAlign;
    }
    return { primary: "MIN", counter: "MIN" };
  }

  getLayoutSizing() {
    return this.features.layoutSizing ?? { horizontal: "FIXED", vertical: "FIXED" };
  }

  getBoundingBox() {
    return this.features.absoluteBoundingBox;
  }

  getMinMax() {
    return this.features.minMax || {};
  }

  getTextLayout() {
    return this.features.textLayout || {};
  }

  getEffects() {
    return this.features.effects || [];
  }

  getVisuals() {
    return this.features.visuals || {};
  }

  getStyles() {
    return this.features.styles;
  }

  getComponentId() {
    return this.features.componentId;
  }

  getComponentProperties() {
    return this.features.componentProperties;
  }

  getTextStyle() {
    return this.features.textStyle;
  }

  getLayoutAlignSelf() {
    return this.features.layoutAlignSelf;
  }

  getLayoutGrow() {
    return this.features.layoutGrow ?? 0;
  }

  hasLayoutProps(): boolean {
    return this.features.hasLayoutProps;
  }

  isAbsolute(): boolean {
    return this.features.isAbsolute;
  }

  /**
   * Raw Property Access (Safe Fallbacks)
   */
  get padding() {
    if (this.features.padding) return this.features.padding;
    if (!this.isContainer()) return { top: 0, right: 0, bottom: 0, left: 0 };
    const n = this.raw as any;
    return {
      top: n.paddingTop ?? 0,
      right: n.paddingRight ?? 0,
      bottom: n.paddingBottom ?? 0,
      left: n.paddingLeft ?? 0,
    };
  }

  get gap() {
    if (this.features.gap !== undefined) return this.features.gap;
    if (!this.isContainer()) return 0;
    return (this.raw as any).itemSpacing ?? 0;
  }
}
