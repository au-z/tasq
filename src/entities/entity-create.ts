import { define, dispatch, html } from 'hybrids';
import produce from 'immer';
import { getset } from '../utils/hybrids';
import { Field, fromSchema, Schema, Types, typeFromTypeof } from './models';
import { EntityList, renderEditor, renderEnum } from './templates';
import * as CamEl from '@auzmartist/cam-el';
const components = { EntityList, ...CamEl };
import styles from './entity-create.css';

function create(host, e) {
  e.preventDefault();
  dispatch(host, 'create', { detail: { ...host.entity }, bubbles: true });
  host.entity = fromSchema(host);
}

function set(host, key, { detail }) {
  host.entity = produce(host.entity, (d) => {
    d[key] = detail;
  });
}

export interface EntityCreate extends HTMLElement {
  schema: Schema;
  context: object; // field additionals
  entity: object;
  fields: Field[];
  lockId: boolean;
  hideReadonly: boolean;
}
export const EntityCreate = define<EntityCreate>({
  tag: 'entity-create',
  schema: getset({ fields: [] } as Schema),
  context: getset({}),
  lockId: false,
  hideReadonly: false,
  entity: {
    get: (host, val = fromSchema(host)) => val,
    set: (host, val) => val,
  },
  fields: ({ context, entity, schema }) =>
    Object.entries(entity).reduce((merged, [key, value]) => {
      const field = schema.fields.find((f) => f.key === key);
      return merged.concat({
        type: typeFromTypeof(Array.isArray(value) ? 'array' : typeof value),
        checked: typeof value === 'boolean' && value === true,
        ...(field || {}),
        options: context[field.key] || field.options,
        key,
        value,
      });
    }, []),
  // prettier-ignore
  render: (host) =>
    html`<fieldset part="fieldset">
      <legend part="legend">${host.schema.name || "Entity"}</legend>
      ${host.fields
        .filter((f) => !(f.readonly && host.hideReadonly))
        .map((f) => html`
          <cam-box m="1 0" flex="start" dir="column" class="field">
            <label>${f.key}</label>
            ${f.type === Types.enum && f.options ?
                renderEnum(host, f, set) :
                f.type === Types.entitylist && f.options ? html`
                  <entity-list
                    field="${f}"
                    entities="${f.options}"
                    entityFormat="${f.listFormat}"
                    onupdate="${(host, e) => set(host, f.key, e)}"
                  ></entity-list>
                ` : f.type === Types.editor ? renderEditor(host, f, set) : html`
                <cam-input
                  part="input"
                  data-type="${f.type}"
                  type="${f.type}"
                  value="${f.value}"
                  checked="${f.type === Types.checkbox && !!f.value}"
                  disabled="${(host.lockId && f.key === "id") || f.readonly}"
                  onupdate="${(host, e) => set(host, f.key, e)}"
                ></cam-input>`}
          </cam-box> `
        )}

      <button part="button" onclick="${create}">Create</button>
      <style>
        :host {
          display: flex;
          flex-direction: column;
        }

        cam-input[data-type="number"]::part(input),
        cam-input[data-type="text"]::part(input) {
          width: 8rem;
        }
      </style>
    </fieldset>`.style(styles),
});
