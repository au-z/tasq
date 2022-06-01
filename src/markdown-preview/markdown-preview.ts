import { define, html } from 'hybrids';
import showdown from 'showdown';
import { getset } from '../utils/hybrids';
showdown.extension('anchortarget', function () {
  return [
    {
      type: 'lang',
      regex:
        /\[((?:\[[^\]]*]|[^\[\]])*)]\([ \t]*<?(.*?(?:\(.*?\).*?)?)>?[ \t]*((['"])(.*?)\4[ \t]*)?\)(?:\{\:target=(["'])(.*)\6})?/g,
      replace: function (wholematch, linkText, url, a, b, title, c, target) {
        var result = `<a target="${target ?? '_blank'}" href="${url}"`;

        if (typeof title != 'undefined' && title !== '' && title !== null) {
          title = title.replace(/"/g, '&quot;');
          title = showdown.helper.escapeCharacters(title, '*_', false);
          result = `${result} title="${title}"`;
        }

        result = `${result}>${linkText}</a>`;
        return result;
      },
    },
  ];
});
const converter = new showdown.Converter({ extensions: ['anchortarget'] });

export const MarkdownPreview = define<any>({
  tag: 'markdown-preview',
  md: getset(''),
  parsed: ({ md }) => {
    try {
      return converter.makeHtml(md);
    } catch {
      return `<span>Cannot parse Markdown</span>`;
    }
  },
  render: ({ parsed }) =>
    html`<div class="markdown" innerHTML="${parsed}"></div>
      <style>
        .markdown {
          color: #ddd;
          font-size: 0.92em;
        }
        a {
          color: hsl(210, 70%, 80%);
        }
        pre {
          color: #aaa;
        }
        p {
          margin-block-start: 0.5em;
          margin-block-end: 0.5em;
        }
      </style>`,
});
