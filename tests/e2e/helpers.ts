import { BrowserContext, Page } from '@playwright/test';

/**
 * Returns the extension ID by navigating to chrome://extensions and reading
 * the first installed extension's ID from the shadow DOM.
 * Requires the extension to already be loaded via --load-extension.
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  await page.waitForTimeout(500);

  const id = await page.evaluate((): string => {
    const manager = document.querySelector('extensions-manager') as HTMLElement & {
      shadowRoot: ShadowRoot | null;
    };
    const itemList = manager?.shadowRoot?.querySelector('extensions-item-list') as HTMLElement & {
      shadowRoot: ShadowRoot | null;
    };
    const item = itemList?.shadowRoot?.querySelector('extensions-item') as HTMLElement & {
      id: string;
      shadowRoot: ShadowRoot | null;
    };
    return item?.id ?? '';
  });

  await page.close();
  return id;
}

/**
 * Opens the extension popup page directly (bypasses toolbar click).
 */
export async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
  return page;
}

/**
 * Opens the options page directly.
 */
export async function openOptions(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/options/options.html`);
  return page;
}
