import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('discovery combines search and genre filters, handles empty results and sorts', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.film-card')).toHaveCount(4);
  await page.getByRole('button', { name: 'Sci-fi', exact: true }).click();
  await expect(page.locator('.film-card')).toHaveCount(2);
  await page.getByRole('searchbox', { name: 'Search films' }).fill('steel');
  await expect(page.locator('.film-card')).toHaveCount(1);
  await page.getByRole('searchbox').fill('no-such-film');
  await expect(page.getByRole('heading', { name: 'No films found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByLabel('Sort', { exact: true }).selectOption('newest');
  await expect(page.locator('.title-button').first()).toHaveText('Tears of Steel');
});

test('watchlist persists through reload and supports removal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Save Sintel to my list', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /^My list/ }).click();
  await expect(page.locator('.film-card')).toHaveCount(1);
  await expect(page.locator('.title-button')).toHaveText('Sintel');
  await page.getByRole('button', { name: 'Remove Sintel from my list' }).click();
  await expect(page.locator('.film-card')).toHaveCount(0);
  await expect(page.getByText('Your list starts with a little curiosity.')).toBeVisible();
});

test('profile is safely rendered, persists and clears all data with confirmation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Save Sintel to my list' }).click();
  await page.getByRole('button', { name: 'Edit viewer profile' }).click();
  await page.getByLabel('Display name').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.locator('#viewer-name')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#viewer-name img')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#viewer-name')).toHaveText('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Edit viewer profile' }).click();
  await page.getByRole('button', { name: 'Clear my local data', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#list-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Clear my local data', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, clear local data' }).click();
  await expect(page.locator('#viewer-name')).toHaveText('Guest');
  await expect(page.locator('#list-count')).toHaveText('0');
});

test('details support saving and Escape closes the modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View details for Sintel', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Sintel', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+ Save to my list', exact: true }).click();
  await expect(page.getByRole('button', { name: '✓ In my list', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#film-dialog')).not.toBeVisible();
});

test('player reports network errors without losing the saved list', async ({ page }) => {
  await page.route(/https:\/\/(archive\.org|.*\.archive\.org|media\.w3\.org)\//, route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Save Sintel to my list', exact: true }).click();
  await page.getByRole('button', { name: '▶ Watch Sintel', exact: true }).click();
  await expect(page.locator('#player-status')).toContainText('could not load');
  await page.getByRole('button', { name: 'Close player', exact: true }).click();
  await expect(page.locator('#list-count')).toHaveText('1');
});

test('continue watching reads saved progress and excludes completed films', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('umpsa-stream:v2', JSON.stringify({ name: 'Guest', saved: [], progress: { sintel: { seconds: 42, duration: 100 }, steel: { seconds: 99, duration: 100 } } })));
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue watching', exact: true }).click();
  await expect(page.locator('.film-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Resume Sintel', exact: true })).toContainText('0:42');
});

test('corrupted and unavailable browser storage recover gracefully', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('umpsa-stream:v2', '{broken'));
  await page.goto('/');
  await expect(page.locator('.film-card')).toHaveCount(4);
  await page.evaluate(() => Object.defineProperty(Storage.prototype, 'setItem', { value() { throw Error('QuotaExceededError'); } }));
  await page.getByRole('button', { name: 'Edit viewer profile' }).click();
  await page.getByLabel('Display name').fill('Farid');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.locator('#viewer-name')).toHaveText('Farid');
  await expect(page.locator('#toast')).toContainText('changes last for this visit only');
  await expect(page.locator('.film-card')).toHaveCount(4);
});

test('keyboard focus stays in the modal and returns to its trigger', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Explore the film ↗', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelector('#film-dialog').contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('discovery and profile have no automatically detectable WCAG A/AA violations', async ({ page }) => {
  await page.goto('/');
  const discovery = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(discovery.violations).toEqual([]);
  await page.getByRole('button', { name: 'Edit viewer profile' }).click();
  const profile = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(profile.violations).toEqual([]);
});

test('layout fits the viewport and local assets load without runtime errors', async ({ page }) => {
  const errors = [];
  const failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().includes('127.0.0.1') && response.status() >= 400) failed.push(response.url()); });
  await page.goto('/');
  await expect(page.locator('.film-card')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});
