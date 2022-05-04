import { define, dispatch, html } from 'hybrids';
import * as monaco from 'monaco-editor';
import { getset, ref } from '../utils/hybrids';
import monacoStyles from 'monaco-editor/min/vs/editor/editor.main.css';
import styles from './monaco-editor.css';

const editorColorsFromCSSVars = {
  get: (host) => {
    const styles = getComputedStyle(host);
    return {};
  },
};

export const MonacoEditor = define<any>({
  tag: 'monaco-editor',
  theme: 'vs-dark',
  language: 'markdown',
  colors: editorColorsFromCSSVars,
  value: {
    get: (host, val = '') => val,
    set: (host, val) => val,
    observe: (host, val, last) => {
      if (!last && last !== '' && !!val) host.editor?.getModel().setValue(val);
    },
  },
  draft: {
    get: (host, val = host.value) => val,
    set: (host, val) => {
      dispatch(host, 'change', { detail: val });
      return val;
    },
  },
  container: ref('.container'),
  editor: {
    get: ({ container, theme, language, value, colors }, val) => {
      monaco.editor.defineTheme('custom', {
        base: theme,
        inherit: true,
        rules: [],
        colors,
      });
      return val ?? monaco.editor.create(container, { theme: 'custom', language, value });
    },
    connect: (host, key) => {
      host[key]?.getModel()?.onDidChangeContent(() => {
        host.draft = host[key].getValue();
      });
      return () => {
        host[key]?.dispose();
      };
    },
  },
  render: () => html`<div class="container"></div>`.style(monacoStyles, styles),
});

(<any>self).MonacoEnvironment = {
  getWorker: function (workerId, label) {
    const getWorkerModule = (moduleUrl, label) => {
      return new Worker((<any>self).MonacoEnvironment.getWorkerUrl(moduleUrl), {
        name: label,
        type: 'module',
      });
    };

    switch (label) {
      case 'json':
        return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker?worker', label);
      case 'css':
      case 'scss':
      case 'less':
        return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker?worker', label);
      case 'html':
      case 'handlebars':
      case 'razor':
        return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker?worker', label);
      case 'typescript':
      case 'javascript':
        return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker?worker', label);
      default:
        return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker?worker', label);
    }
  },
};
