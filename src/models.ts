import { Schema, Types } from './entities/models';
import { v4 as uuid } from 'uuid';

export const TaskSchema: Schema = {
  name: 'task',
  fields: [
    { key: 'id', type: Types.text, value: () => uuid(), readonly: true },
    { key: 'state', type: Types.text, value: 'todo', readonly: true },
    {
      key: 'metrics',
      type: Types.text,
      value: () => ({ timings: [{ event: 'created', timestamp: Date.now().toString() }] }),
      readonly: true,
    },
    { key: 'name', type: Types.text },
    { key: 'description', type: Types.editor },
  ],
};
