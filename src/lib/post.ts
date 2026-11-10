/** Shared media presentation contract. Standalone post persistence is unsupported. */
export type TagPos = { x: number; y: number };
export const DEFAULT_TAG_POS: TagPos = { x: 24, y: 9 };
export type Post = {
  id: string;
  caption: string;
  media: { url: string; type: "image" | "video" }[];
  tagPos?: TagPos | null;
};
