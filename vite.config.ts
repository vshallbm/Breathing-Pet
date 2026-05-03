import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Breath Break',
  version: '1.0.0',
  description: 'A one-minute breath, brought to you by a cat.',
  icons: {
    '16': 'src/assets/icons/icon-16.png',
    '48': 'src/assets/icons/icon-48.png',
    '128': 'src/assets/icons/icon-128.png'
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module'
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle'
    }
  ],
  action: {
    default_popup: 'src/popup/popup.html',
    default_icon: { '48': 'src/assets/icons/icon-48.png' }
  },
  options_page: 'src/options/options.html',
  permissions: [
    'storage',
    'alarms',
    'tabs',
    'activeTab',
    'scripting',
    'notifications',
  ],
  host_permissions: ['<all_urls>'],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'none';",
  },
  web_accessible_resources: [
    {
      resources: [
        'src/onboarding/onboarding.html',
        'src/privacy/privacy.html',
        'src/assets/icons/icon-48.png',
      ],
      matches: ['<all_urls>'],
    },
  ],
  commands: {
    '_execute_action': { suggested_key: { default: 'Alt+Shift+B' }, description: 'Dismiss overlay' }
  }
});

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        onboarding: 'src/onboarding/onboarding.html',
        privacy: 'src/privacy/privacy.html',
      },
    },
  },
});
