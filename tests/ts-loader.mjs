import { readFile } from 'node:fs/promises';
import ts from 'typescript';

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (err) {
    if (specifier.startsWith('.') && specifier.endsWith('.tsx')) {
      const url = new URL(specifier, context.parentURL).href;
      return { url, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !specifier.endsWith('.js') && !specifier.endsWith('.ts') && !specifier.endsWith('.tsx')) {
      const url = new URL(specifier + '.ts', context.parentURL).href;
      return { url, shortCircuit: true };
    }
    throw err;
  }
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith('.ts') || url.endsWith('.tsx')) {
    const source = await readFile(new URL(url));
    const { outputText } = ts.transpileModule(source.toString(), {
      compilerOptions: {
        module: ts.ModuleKind.ES2020,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX
      }
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  }
  return defaultLoad(url, context, defaultLoad);
}
