import { define, dispatch, html } from 'hybrids';
import { getset } from './utils/hybrids';
import styles from './tasq-item.css';
import produce from 'immer';
import { redux, State, store, Task, TaskState } from './store';
import { MarkdownPreview } from './markdown-preview/markdown-preview';
const components = { MarkdownPreview };

export interface TasqItem extends HTMLElement {
  states: TaskState[];
  [key: string]: any;
}

export const TasqItem = define<TasqItem>({
  tag: 'tasq-item',
  task: getset({}),
  id: {
    value: '',
    get: ({ task }) => task.id,
  },
  draft: {
    get: (host, val = host.task) => val,
    set: (host, val) => val,
  },
  taskStates: redux(store, (_, state: State) => state.states.data) || [],
  taskStateIdx: ({ task, taskStates }) => taskStates.findIndex((state) => state.name === task.state),
  isFirstState: ({ taskStateIdx }) => taskStateIdx === 0,
  isLastState: ({ taskStateIdx, taskStates }) => taskStateIdx === taskStates.length - 1,

  isEditMode: {
    ...getset(false),
    observe: (host, val, last) => {
      if (last === true && val === false) host.isCompactToggle = false;
      if (!val) {
        dispatch(host, 'update', { detail: host.draft });
      }
    },
  },
  isCompactToggle: {
    get: ({ isLastState }, val = isLastState) => val,
    set: (host, val) => val,
  },
  render: ({ task, draft, isLastState, isEditMode, isCompactToggle }) =>
    html` <div class="task card">
      <div class="header" title="${task.id}">
        <h4>${task.name} | <small style="font-weight: 100; opacity: 0.4;">${task.id.substr(0, 8)}</small></h4>
        <button class="small circle delete" title="delete" onclick="${remove}">
          <cam-icon>close</cam-icon>
        </button>
      </div>
      <div class="content">
        ${(task.description || isEditMode) &&
        html`<div class="${{ description: true, compact: !isEditMode && isCompactToggle }}">
          <div class="tools">
            <button
              class="small circle"
              onclick="${html.set('isCompactToggle', !isCompactToggle)}"
              title="${isCompactToggle ? 'unfold_more' : 'unfold_less'}"
            >
              <cam-icon>${isCompactToggle ? 'unfold_more' : 'unfold_less'}</cam-icon>
            </button>
            <button
              class="small circle btn-edit-description"
              onclick="${html.set('isEditMode', !isEditMode)}"
              title="${isEditMode ? 'done' : 'edit'}"
            >
              <cam-icon>${isEditMode ? 'done' : 'edit'}</cam-icon>
            </button>
          </div>
          ${isEditMode
            ? html` <div class="resizable">
                <monaco-editor
                  language="markdown"
                  value="${draft.description}"
                  onchange="${updateDescription}"
                ></monaco-editor>
              </div>`
            : html`<markdown-preview md="${task.description}"></markdown-preview>`}
        </div>`}
      </div>
      <div class="footer">
        <div class="actions">
          ${isLastState && html`<button onclick="${archive}"><cam-icon>archive</cam-icon>&nbsp;&nbsp; Archive</button>`}
          ${!task.description &&
          html`<button onclick="${html.set('isEditMode', !isEditMode)}" title="${isEditMode ? 'done' : 'edit'}">
            <cam-icon>${isEditMode ? 'done' : 'edit'}</cam-icon>
          </button>`}
          <div class="button-group">
            <button class="small" onclick="${move.bind(null, -1)}">
              <cam-icon>chevron_left</cam-icon>
            </button>
            <button class="small" onclick="${move.bind(null, 1)}">
              <cam-icon>chevron_right</cam-icon>
            </button>
          </div>
        </div>
      </div>
    </div>`.style(styles),
});

function archive(host: TasqItem, e) {
  host.draft = produce(host.draft, (task: Task) => {
    task.archived = true;
  });
  dispatch(host, 'update', { detail: host.draft });
}

function updateDescription(host, { detail }: CustomEvent) {
  host.draft = produce(host.task, (task: Task) => {
    task.description = detail ?? task.description;
  });
}

function move(add: number, host: TasqItem, e) {
  host.draft = produce(host.task, (task: Task) => {
    let idx = host.taskStates.findIndex((state) => task.state === state.name);
    const nextIndex = Math.max(Math.min(idx + add, host.taskStates.length - 1), 0);
    task.state = host.taskStates[nextIndex]?.name;
  });

  dispatch(host, 'update', { detail: host.draft });
}

function remove(host, e) {
  dispatch(host, 'delete', { detail: host.task.id });
}
