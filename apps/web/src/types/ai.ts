export type ApprovalQuestion = {
  q: string;
  type: "radio" | "check";
  options: string[];
};

export type ChatHistoryItem = {
  id: string;
  label: string;
};

export type ThinkingRow = {
  primary: string;
  secondary?: string;
  mono?: boolean;
  add?: number;
  del?: number;
  href?: string;
};

export type ChatMsg = { role: string; content: string; questions?: ApprovalQuestion[]; thoughts?: string[] };
export type Session = { id: string; title: string; messages: ChatMsg[] };
export type ModelItem = { key: string; name: string; tag: string };
export type StreamingToken = { text: string; cite?: boolean };
export type StreamingSource = { name: string; domain: string; href: string; image?: string };
