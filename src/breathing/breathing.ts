import '../content/overlay';

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const overlay = document.querySelector('breath-break-overlay') as unknown as { show: () => Promise<void> } | null;

  if (overlay) {
    loading?.remove();
    overlay.show().catch(() => undefined);
  }
});
