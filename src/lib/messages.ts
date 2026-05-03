import type { MessageType } from '../types';

export function sendToBackground(message: MessageType): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

export function sendToTab(tabId: number, message: MessageType): Promise<unknown> {
  return chrome.tabs.sendMessage(tabId, message);
}

export function onMessage(handler: (msg: MessageType, sender: chrome.runtime.MessageSender) => void | Promise<unknown>): void {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const result = handler(msg as MessageType, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch(() => sendResponse(null));
      return true;
    }
  });
}
