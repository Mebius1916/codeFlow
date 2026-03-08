
import type { Node as FigmaNode, Effect, Paint } from "@figma/rest-api-spec";
import type { SimplifiedTextStyle } from "../../types/simplified-types.js";

/**
 * Phase 1 Output: Objective Features extracted from the node
 * This object describes WHAT the node has, not WHAT the node IS.
 */
export interface NodeFeatures {
  // Raw Identity
  rawType: FigmaNode["type"];
  hasChildren: boolean;
  isVisible: boolean;

  // Layout Features
  isContainer: boolean; // Has frame-like properties (clipsContent, or frame type)
  layoutMode: "row" | "column" | "none";
  layoutAlign?: {
    primary: string; // "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN"
    counter: string; // "MIN" | "MAX" | "CENTER" | "BASELINE"
  };
  layoutSizing?: {
    horizontal: "FIXED" | "HUG" | "FILL";
    vertical: "FIXED" | "HUG" | "FILL";
  };
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  gap?: number;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  minMax?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  textLayout?: {
    autoResize?: string;
    truncation?: string;
    maxLines?: number;
  };
  layoutAlignSelf?: "STRETCH" | "INHERIT";
  layoutGrow?: number;
  hasLayoutProps: boolean; // Has padding or gap
  isAbsolute: boolean;

  // Visual Features
  visuals?: {
    fills?: Paint[];
    strokes?: Paint[];
    strokeWeight?: number;
    individualStrokeWeights?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    strokeAlign?: string;
    strokeDashes?: number[];
    opacity?: number;
    blendMode?: string;
    cornerRadius?: number | number[]; // number for uniform, array for mixed
  };
  textStyle?: SimplifiedTextStyle;
  styles?: Record<string, string>;
  componentId?: string;
  componentProperties?: Record<string, any>;
  effects?: Effect[];
  hasFills: boolean;
  hasStrokes: boolean;
  hasEffects: boolean;
  hasExportSettings: boolean;
  
  // Specific Type Features
  looksLikeIcon: boolean;
  looksLikeImage: boolean;
  looksLikeText: boolean;
}
