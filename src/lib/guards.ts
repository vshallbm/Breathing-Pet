import { isDenyListedHost, isDenyListedPath } from '../data/deny-list';

export function isInjectableUrl(url: string): boolean {
  return url.startsWith('http:') || url.startsWith('https:');
}

export function isFullscreen(): boolean {
  return !!(document.fullscreenElement || (document as unknown as { webkitFullscreenElement: Element | null }).webkitFullscreenElement);
}

export function isUserTyping(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  const el = active as HTMLElement;
  return tag === 'input' || tag === 'textarea' || !!el.isContentEditable || el.contentEditable === 'true';
}

export function isPiP(): boolean {
  return !!(document as unknown as { pictureInPictureElement: Element | null }).pictureInPictureElement;
}

export function isMediaCallActive(): boolean {
  const videos = document.querySelectorAll('video');
  for (const v of videos) {
    if (!v.paused && v.srcObject instanceof MediaStream) return true;
  }
  return false;
}

export function isDenyListed(): boolean {
  const { hostname, pathname } = window.location;
  return isDenyListedHost(hostname) || isDenyListedPath(pathname);
}

export function shouldSuppressOverlay(): { suppressed: boolean; reason?: string } {
  if (isDenyListed()) return { suppressed: true, reason: 'deny-listed' };
  if (isFullscreen()) return { suppressed: true, reason: 'fullscreen' };
  if (isPiP()) return { suppressed: true, reason: 'pip' };
  if (isUserTyping()) return { suppressed: true, reason: 'typing' };
  if (isMediaCallActive()) return { suppressed: true, reason: 'media-call' };
  return { suppressed: false };
}
