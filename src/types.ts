import type { AcceptedPlugin } from "postcss";
import type { CSSModulesOptions, LightningCSSOptions } from "vite";

export interface ResolvedStyleResult {
  isModule: boolean;
  filePath: string;
}

export interface PostCSSTransformerOptions {
  type: "postcss";
  options: {
    plugins?: AcceptedPlugin[];
    modules?: CSSModulesOptions;
  };
}

export interface LightningCSSTransformerOptions {
  type: "lightningcss";
  options: LightningCSSOptions;
}

export type StyleTransformerOptions =
  | PostCSSTransformerOptions
  | LightningCSSTransformerOptions;

export interface PluginOptions {
  /**
   * Force all matched style files to be treated as CSS modules.
   * `false` by default.
   */
  resolveAllStylesAsModules: boolean;
  /**
   * Should style file name match component file name.
   * For example: `Card.jsx` matches `Card.css` and `Card.module.css`.
   * `true` by default
   */
  matchComponentName: boolean;
  /**
   * List of component modules extensions.
   * `[".tsx", ".jsx"]` by default
   */
  componentExtensions: string[];
  /**
   * Glob to match styles in the current directory.
   * `undefined` by default
   */
  styleGlob: string;
  /**
   * List of style files extensions.
   * `[".css", ".scss", ".less"]` by default
   */
  styleExtensions: string[];
  /**
   * Advanced method for matching the transformed components.
   * Accepts component file name and full path.
   *
   * This method takes precedence over `componentExtensions`.
   * `undefined` by default
   */
  shouldTransformComponent(
    fileName: string,
    filePath: string
  ): boolean | Promise<boolean>;
  /**
   * Advanced method for resolving styles for the component.
   * Accepts component file name (without extension), directory name and full path.
   *
   * This method takes precedence over `styleGlob`, `styleExtensions`, `resolveAllStylesAsModules` and `matchComponentName`.
   * `undefined` by default
   */
  resolveStyleForComponent(
    componentName: string,
    directoryName: string,
    filePath: string
  ): ResolvedStyleResult | Promise<ResolvedStyleResult>;
}
