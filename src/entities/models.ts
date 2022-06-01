import { Entity } from '../state';

export const Types = {
  checkbox: 'checkbox',
  number: 'number',
  text: 'text',
  editor: 'editor',
  enum: 'enum',
  entitylist: 'entitylist',
  list: 'list',
  entity: 'entity',
} as const;

export type Type = keyof typeof Types;

function defaultFromType(type: Type, options?: Record<string, string>[]) {
  switch (type) {
    case Types.checkbox:
      return false;
    case Types.number:
      return 0;
    case Types.text:
      return '';
    case Types.entitylist:
      return [];
    case Types.enum:
      return options?.keys?.()[0] || null;
    case Types.list:
      return [];
    case Types.entity:
      return {};
  }
}

export function typeFromTypeof(type: string | Type) {
  switch (type) {
    case 'string':
      return Types.text;
    case 'number':
      return Types.number;
    case 'boolean':
      return Types.checkbox;
    case 'array':
      return Types.list;
    case 'object':
      return Types.entity;
  }
}

export interface Field {
  key: string;
  type: Type;
  checked?: boolean;
  value?: any;
  options?: { value: string; name: string }[] | ((state: any) => Entity[]);
  editor?: { theme: string; language: string };
  readonly?: boolean;
  schema?: Schema;
  listFormat?: (entity: Entity) => string;
}

export interface Schema {
  name?: string;
  fields: Field[];
}

export function fromSchema(host) {
  return host.schema?.fields.reduce((entity, f) => {
    entity[f.key] = typeof f.value === 'function' ? f.value() : f.value ?? defaultFromType(f.type);
    return entity;
  }, {});
}
