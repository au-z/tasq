import { define, dispatch, html } from 'hybrids';
import produce from 'immer';
import { getset, propertyFn } from '../utils/hybrids';
import { Field } from './models';

type Entity = { id: string };

export const renderList = (host, f: Field) => html` <div class="list">${f.value.length} Items</div> `;

export const renderEntity = (host, f: Field, onupdate: (host, key, e) => void) =>
  host.deep
    ? html`
        <entity-update
          entity="${f.value}"
          schema="${f.schema || { fields: [f] }}"
          deep
          onupdate="${(_, e) => onupdate(host, f.key, e)}"
        >
        </entity-update>
      `
    : html`{...}`;

export const renderEnum = (host, f: Field, onchange: (host, key, e) => void) => html`
  <select data-type="${f.type}" value="${f.value}" onchange="${(host, e) => onchange(host, f.key, e)}">
    ${f.options.map((o) => html`<option value="${o.value}">${o.name}</option>`)}
  </select>
`;

export const renderEditor = (host, f: Field, onchange: (host, key, e) => void) => html`
  <div class="textarea">
    <monaco-editor
      theme="${f.editor?.theme}"
      language="${f.editor?.language}"
      value="${f.value}"
      onchange="${(host, e) => onchange(host, f.key, e)}"
      transparent
    ></monaco-editor>
  </div>
`;

interface EntityList extends HTMLElement {
  [key: string]: any;
}
function push(host, e) {
  host.list = produce(host.list, (l) => {
    l.push(e.detail || e.target?.value);
  });
  dispatch(host, 'update', { detail: host.list, bubbles: true });
  if (e.target) e.target.value = '';
}
function splice(host, id) {
  host.list = produce(host.list, (l) => {
    l.splice(l.indexOf(id), 1);
  });
  dispatch(host, 'update', { detail: host.list, bubbles: true });
}
export const EntityList = define<EntityList>({
  tag: 'entity-list',
  field: getset({} as Field),
  entities: { get: (_, val = []) => val, set: (_, val) => val },
  entityFormat: propertyFn(({ id }: Entity) => id),
  list: {
    get: (host, val = host.field.value || []) => val,
    set: (_, val) => val,
  },
  render: ({ entities, list, field }) => html`
    <select data-type="${field.type}" value="" onchange="${push}">
      <option></option>
      ${entities
        .filter((e: Entity) => !list.includes(e.id))
        .map((e) => html` <option value="${e.id}">${field.format(e)}</option> `)}
    </select>
    <ul>
      ${field.value.map(
        (id) => html`<li>
          <button onclick="${(host, e) => splice(host, id)}">X</button>
          ${field.format(entities.find((e) => e.id === id))}
        </li>`,
      )}
    </ul>
  `,
});
