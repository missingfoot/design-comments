import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    projects: i.entity({
      domain: i.string(),
      name: i.string(),
      createdAt: i.number(),
    }),
    comments: i.entity({
      pageUrl: i.string(),
      anchor: i.json<{
        selector: string;
        xpath?: string;
        textQuote?: {
          exact: string;
          prefix?: string;
          suffix?: string;
        };
        // Position relative to element (percentage of element dimensions)
        offset: { x: number; y: number };
        // Legacy: old viewport-based positioning (for backward compatibility)
        rect?: { x: number; y: number };
      }>(),
      content: i.string(),
      author: i.string(),
      authorId: i.string(),
      authorColor: i.string(),
      resolved: i.boolean(),
      createdAt: i.number(),
      parentId: i.string().optional(),
    }),
  },
  links: {
    projectComments: {
      forward: { on: "projects", has: "many", label: "comments" },
      reverse: { on: "comments", has: "one", label: "project" },
    },
  },
  rooms: {
    project: {
      presence: i.entity({
        odor: i.string(),
        name: i.string(),
        color: i.string(),
        pageUrl: i.string(),
        cursor: i.json<{ x: number; y: number } | null>(),
      }),
    },
  },
});

// This helps Typescript infer the schema
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
