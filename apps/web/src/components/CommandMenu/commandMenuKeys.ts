const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export const isTypingElement = (tagName: string, isContentEditable: boolean): boolean =>
  TYPING_TAGS.has(tagName) || isContentEditable;

export const isCommandKShortcut = (key: string, metaKey: boolean, ctrlKey: boolean): boolean =>
  key.toLowerCase() === "k" && (metaKey || ctrlKey);
