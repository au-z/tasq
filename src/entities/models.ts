import { Entity } from "../state";

export enum Type {
  checkbox = "checkbox",
  number = "number",
  text = "text",
  editor = "editor",
  enum = "enum",
  entitylist = "entitylist",
  list = "list",
  entity = "entity",
}

function defaultFromType(type: Type, options?: Record<string, string>[]) {
  switch (type) {
    case Type.checkbox:
      return false;
    case Type.number:
      return 0;
    case Type.text:
      return "";
    case Type.entitylist:
      return [];
    case Type.enum:
      return options?.keys?.()[0] || null;
    case Type.list:
      return [];
    case Type.entity:
      return {};
  }
}

export function typeFromTypeof(type: string) {
  switch (type) {
    case "string":
      return Type.text;
    case "number":
      return Type.number;
    case "boolean":
      return Type.checkbox;
    case "array":
      return Type.list;
    case "object":
      return Type.entity;
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
    entity[f.key] =
      typeof f.value === "function"
        ? f.value()
        : f.value ?? defaultFromType(f.type);
    return entity;
  }, {});
}
