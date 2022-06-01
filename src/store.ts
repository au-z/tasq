import { createStore } from 'redux';
import { merge } from 'lodash';
import { produce } from 'immer';
const devtools = (<any>window).__REDUX_DEVTOOLS_EXTENSION__ && (<any>window).__REDUX_DEVTOOLS_EXTENSION__();

const STORAGE_KEY = 'tasq-data';

export interface Task {
  id: string;
  state: string;
  metrics?: {
    timings: { event: string; timestamp: string }[];
  };
  [key: string]: any;
}
export type TaskState = { id: string; name: string };

export interface State {
  tasks: {
    selected: string;
    data: Task[];
  };
  states: {
    data: TaskState[];
  };
}

const STATE: State = {
  tasks: {
    selected: '',
    data: [],
  },
  states: {
    data: [
      { id: '1', name: 'todo' },
      { id: '2', name: 'in progress' },
      { id: '3', name: 'review' },
      { id: '4', name: 'done' },
    ],
  },
};

export const createTask = (task: Task) => ({
  type: 'CREATE_TASK',
  value: task,
});
export const updateTask = (task: Partial<Task & { id: string }>) => ({
  type: 'UPDATE_TASK',
  value: task,
});
export const deleteTask = (id: string) => ({ type: 'DELETE_TASK', value: id });

const storeConfig = (state = STATE, { type, value }) => {
  const reduce = reducers[type];
  return reduce ? reduce(state, value) : state;
};

const reducers = {
  CREATE_TASK: (state: State, task: Task) =>
    produce(state, (draft: State) => {
      draft.tasks.data.push(task);
    }),
  UPDATE_TASK: (state: State, task: Partial<Task>) =>
    produce(state, (draft: State) => {
      const idx = draft.tasks.data.findIndex((t) => t.id === task.id);
      if (idx === -1) {
        draft.tasks.data.push(task as Task);
      } else {
        draft.tasks.data.splice(idx, 1, merge({}, draft.tasks.data[idx], task));
      }
    }),
  DELETE_TASK: (state: State, id: string) =>
    produce(state, (draft: State) => {
      const idx = draft.tasks.data.findIndex((t) => t.id === id);
      if (!idx) return;
      draft.tasks.data.splice(idx, 1);
    }),
};

export const store = createStore(storeConfig, load(STATE));
store.subscribe(() => save(store.getState()));

function save(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: state.tasks }));
  } catch (ex) {
    console.warn(ex);
  }
}

function load(defaultState: State): State {
  try {
    return {
      ...defaultState,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY)),
      states: defaultState.states,
    };
  } catch (ex) {
    console.warn(ex);
    return undefined;
  }
}

export function redux<T, S, E>(store, mapState?: (host: E, state: S) => T) {
  const get = mapState ? (host) => mapState(host, store.getState()) : () => store.getState();

  return {
    get,
    connect: (host, key, invalidate) =>
      store.subscribe(() => {
        if (host[key] !== get(host)) invalidate();
      }),
  };
}

import { createApp, ref, toHandlers } from 'vue';
import { createPinia, defineStore, StateTree, Store } from 'pinia';
import { Descriptor, Property } from 'hybrids';

const app = createApp({});
app.use(createPinia());

export interface PiniaState extends StateTree {
  count: any;
}

export const useStore = defineStore('root', {
  state: (): PiniaState => ({
    count: { value: 0, child: { foo: 'bar' } },
  }),
  actions: {
    increment() {
      this.count = produce(this.count, (count) => {
        count.value++;
        count.child.foo = 'bang';
      });
      console.log(this.count);
    },
    nothing() {
      console.log('nothing!');
    },
  },
});

export function pinia<T, S extends Store, E>(store: S, mapState?: (host: E, state: S) => T) {
  let curr;
  const get = (host) => {
    curr = mapState ? mapState(host, store) : () => store;
    console.log('CURR', curr);
    return curr;
  };

  return {
    get,
    connect: (host, key, invalidate) => {
      // re-get on every subscription
      store.$subscribe((mut, state) => {
        let newV = mapState(host, store);
        console.log(curr === mapState(host, store));
        console.log(curr, newV);
        if (mut.events.oldValue === curr) invalidate();
      });
    },
  };
}

export function useActions<S extends Store, E>(
  store: S,
  map: (store: S) => Record<string, () => void>,
  prefix = '',
): Record<keyof S, Descriptor<E, () => void>> {
  return Object.entries(map(store)).reduce((props, [key, actionFn]) => {
    props[`${prefix}${key}`] = (host) => actionFn;
    return props;
  }, {} as Record<keyof S, Descriptor<E, () => void>>);
}
