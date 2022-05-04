import { Schema, Type } from './entities/models';
import { v4 as uuid } from 'uuid';

export const TaskSchema: Schema = {
  name: 'task',
  fields: [
    { key: 'id', type: Type.text, value: () => uuid(), readonly: true },
    { key: 'state', type: Type.text, value: 'todo', readonly: true },
    {
      key: 'metrics',
      type: Type.text,
      value: () => ({ timings: [{ event: 'created', timestamp: Date.now().toString() }] }),
      readonly: true,
    },
    { key: 'name', type: Type.text },
    { key: 'description', type: Type.editor },
  ],
};
