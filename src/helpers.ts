import { scandir } from "@nodelib/fs.scandir";
import { parse } from "path";
import micromatch from "micromatch";
import { PluginOptions, ResolvedStyleResult } from "./types.js";

export async function resolveStylesFromDirectory({
  componentFilePath,
  directory,
  options,
}: {
  componentFilePath: string;
  directory: string[];
  options: Partial<PluginOptions>;
}): Promise<ResolvedStyleResult[]> {
  const parsedPath = parse(componentFilePath);
  const componentName = parsedPath.name;
  const directoryName = parsedPath.dir;

  if (typeof options.resolveStyleForComponent === "function") {
    const result = await options.resolveStyleForComponent(
      componentName,
      directoryName,
      componentFilePath
    );

    return result ? [result] : [];
  }

  if (typeof options.styleGlob === "string") {
    const matches = micromatch(directory, options.styleGlob, {
      basename: true,
    });

    return handleGlobMatches(matches, options.resolveAllStylesAsModules);
  }

  if (!options.styleExtensions) {
    throw new Error(
      "One of 'resolveStyleForComponent', 'styleGlob' or 'styleExtensions' is required"
    );
  }

  const globs = options.styleExtensions.map((ext) => {
    /**
     * If `matchComponentName` is enabled then the result glob
     * would look like this: `component*.{css|scss|less}`.
     * Otherwise: `*.{css|scss|less}` (matches any style file)
     */
    const prefix = options.matchComponentName ? componentName : "";
    return `${prefix}*${ext}`;
  });

  const matches = micromatch(directory, globs, {
    basename: true,
  });

  return handleGlobMatches(matches, options.resolveAllStylesAsModules);
}

function handleGlobMatches(
  matches: string[],
  resolveAllStylesAsModules = false
): ResolvedStyleResult[] {
  return matches.map((filePath) => {
    const parsedStylePath = parse(filePath);
    let isModule: boolean;
    if (resolveAllStylesAsModules) {
      isModule = true;
    } else {
      isModule = parsedStylePath.name.endsWith(".module");
    }

    return {
      filePath,
      isModule,
    };
  });
}

export async function getAllFilesInDirectory(dir: string) {
  return new Promise<string[]>((resolve, reject) => {
    scandir(dir, (err, result) => {
      if (err) {
        return reject(err);
      }

      const paths = result
        .filter((entry) => !entry.stats?.isDirectory())
        .map((entry) => entry.path);

      resolve(paths);
    });
  });
}
