import { dispatch, html, Hybrids, property } from "hybrids"
import { Field, Schema, Type, typeFromTypeof } from "./models"
import { renderEntity, renderEnum, renderList } from "./templates"

function updateDraft(host, key, e) {
	host.draft = {...host.draft, [key]: e.detail || e.target?.value}
}

function update(host, e) {
	e.preventDefault()
	dispatch(host, 'update', {detail: host.doDelete ? null : host.draft, bubbles: true})
}

export interface EntityUpdate extends HTMLElement {
	schema: Schema,
	context: object,
	entity: object,
	draft: object,
	fields: Field[],
	deep: boolean,
	doDelete: boolean,
	deletable: boolean,
}
export const EntityUpdate: Hybrids<EntityUpdate> = {
	context: {get: (host, val = {}) => val, set: (host, val) => val},
	entity: property({}, null, (host, entity) => {
		host.draft = {...entity}
	}),
	schema: property({fields: []}),
	draft: {get: (_, val = {}) => val, set: (_, val) => val},
	fields: ({context, entity, schema}) => Object.entries(entity).reduce((merged, [key, value]) => {
		const field = schema.fields.find((f) => f.key === key) || {} as Field
		return merged.concat({
			type: typeFromTypeof(Array.isArray(value) ? 'array' : typeof value),
			checked: typeof value === 'boolean' && value === true,
			...(field || {}),
			options: context[field.key] || field.options,
			key,
			value,
		})
	}, []),
	deletable: false,
	deep: false,
	doDelete: {
		get: (_, val = false) => val,
		set: (_, val) => val,
	},
	render: (host) => html`<fieldset>
		<legend>${host.schema.name || 'Entity'}</legend>
		${host.fields.map((f) => html`<cam-box m="1 0" flex="start" dir="column" class="field">
				<label>${f.key}</label>
				${(f.type === Type.list) ? renderList(host, f) :
					(f.type === Type.entity) ? renderEntity(host, f, updateDraft) :
					(f.type === Type.entitylist) ? html`<entity-list field="${f}"
						entities="${f.options}"
						entityFormat="${f.listFormat}"
						onupdate="${(host, e) => updateDraft(host, f.key, e)}"
					></entity-list>` :
					(f.type === Type.enum && f.options) ? renderEnum(host, f, updateDraft) : html`
					<cam-input data-type="${f.type}" type="${f.type}" value="${f.value}" disabled="${f.readonly}" checked="${f.checked}"
						onupdate="${(host, e) => updateDraft(host, f.key, e)}">
					</cam-input>
				`}
			</cam-box>
		`)}
		
		${host.deletable && html` <cam-box m="1 0" flex="start" dir="column" class="field delete">
			<label>Delete</label>
			<cam-input type="checkbox" toggle
				onupdate="${(host, {detail}) => host.doDelete = detail}"></cam-input>
		</cam-box>`}

		<button onclick="${update}">Update</button>

		<style>
			cam-input[data-type=text]::part(input) {
				width: 12rem;
			}
		</style>
	</fieldset>`,
}