export const BREAK_NOTIF_ID = 'breath-break-break';

export function notifyViaNotification(): void {
  void chrome.notifications.create(BREAK_NOTIF_ID, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/assets/icons/icon-48.png'),
    title: 'Time for a breath break',
    message: 'One minute to reset.',
    buttons: [{ title: 'Breathe now 🐱' }],
    priority: 0,
  });
}

export function initNotificationListeners(): void {
  chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
    if (notifId !== BREAK_NOTIF_ID || buttonIndex !== 0) return;
    void chrome.tabs.create({ url: chrome.runtime.getURL('src/breathing/breathing.html') });
    void chrome.notifications.clear(BREAK_NOTIF_ID);
  });
}
