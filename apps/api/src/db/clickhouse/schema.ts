import type { IntrospectedSchema } from "./schema.generated.ts";

// The client pins no `database`, so table keys must be fully qualified.
// Every table in the generated schema is exposed automatically; tables from
// other databases can be added later by intersecting another mapped block.
export type Database = {
  [
    Table in keyof IntrospectedSchema as `new_vertical.${Table & string}`
  ]: IntrospectedSchema[Table];
};
