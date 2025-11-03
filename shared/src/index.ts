export type ID = string;

export interface Note {
  id: ID;
  title: string;
  content: string;    // markdown string
  tags: string[];
  createdAt: number;  // epoch ms
  updatedAt: number;  // epoch ms
  deleted?: boolean;
  version?: string;   // optional version vector / etag
}
