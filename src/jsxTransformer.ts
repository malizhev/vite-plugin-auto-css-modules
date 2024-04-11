import { defaultImport } from "default-import";
import _traverse from "@babel/traverse";
import _MagicString from "magic-string";
import { parse } from "@babel/parser";
import { NodePath } from "@babel/traverse";
import {
  JSXAttribute,
  StringLiteral,
  isCallExpression,
  isIdentifier,
  isJSXExpressionContainer,
  isObjectExpression,
  isStringLiteral,
} from "@babel/types";

/**
 * Work around the NodeNext module resolution issues
 */
const traverse = defaultImport(_traverse);
const MagicString = defaultImport(_MagicString);

export async function transformJSX({
  moduleId,
  styleModuleId,
  originalCode,
  manifest,
}: {
  moduleId: string;
  styleModuleId: string;
  originalCode: string;
  manifest: Record<string, string>;
}) {
  const source = new MagicString(originalCode);
  const ast = parse(originalCode, {
    plugins: ["typescript", "jsx"],
    sourceType: "module",
  });

  source.prepend(`import "${styleModuleId}";\n`);

  /**
   * No need to walk through JSX if manifest is empty.
   */
  if (Object.keys(manifest).length === 0) {
    return generateRollupTransformResult(source, moduleId);
  }

  traverse(ast, {
    JSXAttribute(path) {
      const { value } = path.node;

      if (isClassAttributePath(path)) {
        /**
         * Handle the simplest case: <div class="foobar" />
         */
        if (isStringLiteral(value)) {
          transformClassStringLiteral(value);
        }

        /**
         * Handle className helper functions, e.g:
         * <div class={ classNames({ foo: true }, ["bar", "baz"]) }/>
         */
        if (
          isJSXExpressionContainer(value) &&
          isCallExpression(value.expression)
        ) {
          transformClassNamesObject(path);
          transformArrayMemberClassName(path);
          return;
        }

        return;
      }

      if (
        isClassListAttributePath(path) &&
        isJSXExpressionContainer(value) &&
        isObjectExpression(value.expression)
      ) {
        transformClassNamesObject(path);
      }
    },
  });

  function transformClassStringLiteral(value: StringLiteral) {
    const { start, end } = value;
    const classSegments = value.value.split(" ").filter((s) => !!s);
    const resolvedClassSegments = classSegments.map((className) => {
      return manifest[className] || className;
    });
    const finalClassName = resolvedClassSegments.join(" ");
    source.overwrite(start!, end!, `"${finalClassName}"`);
  }

  function transformClassNamesObject(path: NodePath) {
    const node = path.node;
    traverse(node, {
      noScope: true,
      ObjectProperty(prop) {
        if (isIdentifier(prop.node.key)) {
          const { start, end } = prop.node.key;
          const { name } = prop.node.key;
          source.overwrite(start!, end!, `"${manifest[name] || name}"`);
          return;
        }

        if (isStringLiteral(prop.node.key)) {
          transformClassStringLiteral(prop.node.key);
        }
      },
    });
  }

  function transformArrayMemberClassName(path: NodePath) {
    const node = path.node;
    traverse(node, {
      noScope: true,
      ArrayExpression(prop) {
        prop.node.elements.forEach((element) => {
          if (isStringLiteral(element)) {
            transformClassStringLiteral(element);
          }
        });
      },
    });
  }

  return generateRollupTransformResult(source, moduleId);
}

function generateRollupTransformResult(
  source: _MagicString.default,
  moduleId: string
) {
  return {
    code: source.toString(),
    map: source.generateMap({
      source: moduleId,
    }),
  };
}

function isClassAttributePath(path: NodePath<JSXAttribute>) {
  return path.node.name.name === "class" || path.node.name.name === "className";
}

function isClassListAttributePath(path: NodePath<JSXAttribute>) {
  return path.node.name.name === "classList";
}
