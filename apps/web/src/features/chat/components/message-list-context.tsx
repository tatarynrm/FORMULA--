'use client';

import { createContext, useContext } from 'react';

export interface MessageListActions {
  /** A picture finished loading: the list keeps what is on screen in place. */
  onImageLoad: (image: HTMLImageElement) => void;
  openImage: (fileId: string) => void;
  retrySend: (localId: string) => void;
  discardSend: (localId: string) => void;
}

const noop = () => {};

/** What a bubble deep inside the list can ask of it, without passing props through every level. */
export const MessageListContext = createContext<MessageListActions>({
  onImageLoad: noop,
  openImage: noop,
  retrySend: noop,
  discardSend: noop,
});

export const useMessageListActions = () => useContext(MessageListContext);
