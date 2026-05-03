import { test, expect, chromium } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '../../dist');

// Each test gets an isolated browser context with the extension loaded.
test.describe('Extension smoke tests', () => {
  test('extension loads and popup renders', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
      ],
    });

    // Find the extension ID from the service worker
    let extensionId = '';
    for (const sw of context.serviceWorkers()) {
      const url = sw.url();
      const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
      if (match) { extensionId = match[1]!; break; }
    }

    // If no SW yet, wait for it
    if (!extensionId) {
      const sw = await context.waitForEvent('serviceworker');
      const match = sw.url().match(/chrome-extension:\/\/([a-z]{32})\//);
      extensionId = match?.[1] ?? '';
    }

    expect(extensionId).toBeTruthy();

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await popup.waitForLoadState('domcontentloaded');

    // Logo and title should render
    await expect(popup.locator('h1')).toContainText('Breath Break');
    await expect(popup.locator('#logo')).toBeVisible();

    // Enable toggle should exist
    const toggle = popup.locator('#enabled-toggle');
    await expect(toggle).toBeVisible();

    await context.close();
  });

  test('options page renders all sections', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
      ],
    });

    let extensionId = '';
    const sw = context.serviceWorkers()[0]
      ?? await context.waitForEvent('serviceworker');
    const match = sw.url().match(/chrome-extension:\/\/([a-z]{32})\//);
    extensionId = match?.[1] ?? '';

    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/src/options/options.html`);
    await options.waitForLoadState('domcontentloaded');

    // Key sections should be present
    await expect(options.locator('text=Frequency')).toBeVisible();
    await expect(options.locator('text=Breathing pattern')).toBeVisible();
    await expect(options.locator('text=Character')).toBeVisible();
    await expect(options.locator('text=Theme')).toBeVisible();
    await expect(options.locator('text=Language')).toBeVisible();
    await expect(options.locator('#save-btn')).toBeVisible();

    await context.close();
  });

  test('options page save button persists settings', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
      ],
    });

    const sw = context.serviceWorkers()[0]
      ?? await context.waitForEvent('serviceworker');
    const match = sw.url().match(/chrome-extension:\/\/([a-z]{32})\//);
    const extensionId = match?.[1] ?? '';

    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/src/options/options.html`);
    await options.waitForLoadState('domcontentloaded');

    // Switch theme to dark
    await options.selectOption('#theme-select', 'dark');
    await options.click('#save-btn');

    // Saved message should appear
    const savedMsg = options.locator('#saved-msg');
    await expect(savedMsg).toContainText('Saved');

    // Reload and verify theme persisted
    await options.reload();
    await options.waitForLoadState('domcontentloaded');
    const themeVal = await options.inputValue('#theme-select');
    expect(themeVal).toBe('dark');

    await context.close();
  });

  test('onboarding page renders all screens', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
      ],
    });

    const sw = context.serviceWorkers()[0]
      ?? await context.waitForEvent('serviceworker');
    const match = sw.url().match(/chrome-extension:\/\/([a-z]{32})\//);
    const extensionId = match?.[1] ?? '';

    const onboarding = await context.newPage();
    await onboarding.goto(`chrome-extension://${extensionId}/src/onboarding/onboarding.html`);
    await onboarding.waitForLoadState('domcontentloaded');

    // Welcome screen visible
    await expect(onboarding.locator('h1')).toContainText('Breath Break');
    await expect(onboarding.locator('#screen-demo')).toHaveClass(/active/);

    // Skip demo → goes to pitch screen
    await onboarding.click('#skip-demo-btn');
    await expect(onboarding.locator('#screen-pitch')).toHaveClass(/active/);

    await context.close();
  });
});
