import postcss, { AcceptedPlugin } from "postcss";
import { CSSModuleExports, transform } from "lightningcss";
import postcssModules from "postcss-modules";

import sassPostCssPlugin from "@csstools/postcss-sass";
import sassSyntax from "postcss-scss";
import lessSyntax from "postcss-less";
import { StyleTransformerOptions } from "./types.js";

export async function transformStyles(
  from: string,
  code: string,
  transformer: StyleTransformerOptions
) {
  let manifest: Record<string, string> = {};

  if (transformer.type === "lightningcss") {
    const result = transform({
      code: Buffer.from(code),
      filename: from,
      cssModules: true,
      ...transformer.options,
    });
    manifest = transformLightningCSSManifest(result.exports);

    return {
      manifest,
      css: result.code.toString(),
    };
  }

  const extensions = getSyntaxExtensions(from);
  const postCSSPlugins: AcceptedPlugin[] = [];
  const postCSSOptions = transformer.options;
  if (extensions?.plugin) {
    postCSSPlugins.push(extensions.plugin);
  }

  if (postCSSOptions.plugins) {
    postCSSPlugins.push(...postCSSOptions.plugins);
  }

  const cssModulesOptions = transformer.options.modules ?? {};

  const result = await postcss([
    ...postCSSPlugins,
    postcssModules({
      ...cssModulesOptions,
      getJSON(
        fileName: string,
        json: Record<string, string>,
        outputFileName: string
      ) {
        manifest = json;
        if (
          cssModulesOptions.getJSON &&
          typeof cssModulesOptions.getJSON === "function"
        ) {
          cssModulesOptions.getJSON(fileName, json, outputFileName);
        }
      },
    }),
  ]).process(code, {
    from,
    syntax: extensions?.syntax,
  });
  return {
    manifest,
    css: result.css,
  };
}

function getSyntaxExtensions(fileUrl: string) {
  if (fileUrl.endsWith(".scss") || fileUrl.endsWith(".sass")) {
    return {
      plugin: sassPostCssPlugin,
      syntax: sassSyntax,
    };
  }

  if (fileUrl.endsWith(".less")) {
    return {
      plugin: undefined,
      syntax: lessSyntax,
    };
  }

  return null;
}

function transformLightningCSSManifest(exports: CSSModuleExports | void) {
  if (!exports) {
    return {};
  }

  const manifest: Record<string, string> = {};
  for (let key in exports) {
    const record = exports[key];
    manifest[key] = record.name;
  }

  return manifest;
}
