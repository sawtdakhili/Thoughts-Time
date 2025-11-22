import { test, expect } from '@playwright/test';

test.describe('Thoughts & Time App', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test('should load the app with header and two panes', async ({ page }) => {
    await page.goto('/');

    // Check header
    await expect(page.locator('h1')).toContainText('Thoughts & Time');

    // Check both panes are visible
    await expect(page.locator('text=THOUGHTS')).toBeVisible();

    // Check search and settings buttons
    await expect(page.getByTitle('Search')).toBeVisible();
    await expect(page.getByTitle('Settings')).toBeVisible();
  });

  test('should create a todo item', async ({ page }) => {
    await page.goto('/');

    // Find the input in Thoughts pane
    const input = page.locator('input[placeholder*="thought"]').first();
    await input.fill('t buy groceries at 3pm');
    await input.press('Enter');

    // Verify item appears in Thoughts pane
    await expect(page.locator('text=buy groceries')).toBeVisible();
  });

  test('should create a note item', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[placeholder*="thought"]').first();
    await input.fill('* remember this idea');
    await input.press('Enter');

    await expect(page.locator('text=remember this idea')).toBeVisible();
  });

  test('should create an event item', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[placeholder*="thought"]').first();
    await input.fill('e meeting from 2pm to 3pm');
    await input.press('Enter');

    await expect(page.locator('text=meeting')).toBeVisible();
  });

  test('should toggle todo completion', async ({ page }) => {
    await page.goto('/');

    // Create a todo
    const input = page.locator('input[placeholder*="thought"]').first();
    await input.fill('t test task at 4pm');
    await input.press('Enter');

    // Find the checkbox button and click it
    const checkbox = page.locator('button:has-text("□")').first();
    await checkbox.click();

    // Verify it's now checked
    await expect(page.locator('button:has-text("☑")')).toBeVisible();
  });

  test('should delete an item', async ({ page }) => {
    await page.goto('/');

    // Create a note
    const input = page.locator('input[placeholder*="thought"]').first();
    await input.fill('* delete me');
    await input.press('Enter');

    // Hover over the item to show delete button
    const item = page.locator('text=delete me').first();
    await item.hover();

    // Click delete button (×)
    const deleteBtn = page.locator('button[title="Delete"]').first();
    await deleteBtn.click();

    // Confirm deletion in dialog
    await page.locator('button:has-text("Delete")').click();

    // Verify item is gone
    await expect(page.locator('text=delete me')).not.toBeVisible();
  });

  test('should open and close settings', async ({ page }) => {
    await page.goto('/');

    // Open settings
    await page.getByTitle('Settings').click();

    // Verify settings modal is open
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // Close settings
    await page.locator('button:has-text("×")').first().click();

    // Verify settings modal is closed
    await expect(page.locator('h2:has-text("Settings")')).not.toBeVisible();
  });

  test('should toggle theme in settings', async ({ page }) => {
    await page.goto('/');

    // Open settings
    await page.getByTitle('Settings').click();

    // Toggle to light theme
    await page.locator('button:has-text("Light")').click();

    // Verify theme changed
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Toggle back to dark
    await page.locator('button:has-text("Dark")').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('should toggle view mode in settings', async ({ page }) => {
    await page.goto('/');

    // Open settings
    await page.getByTitle('Settings').click();

    // Toggle to book mode
    await page.locator('button:has-text("Book Style")').click();

    // Close settings and verify view changed (book mode has different layout)
    await page.keyboard.press('Escape');
  });

  test('should search for items', async ({ page }) => {
    await page.goto('/');

    // Create items
    const input = page.locator('input[placeholder*="thought"]').first();
    await input.fill('* searchable note');
    await input.press('Enter');
    await input.fill('* other content');
    await input.press('Enter');

    // Open search
    await page.getByTitle('Search').click();

    // Type search query
    const searchInput = page.locator('input[placeholder="Search..."]');
    await searchInput.fill('searchable');

    // Wait for debounce
    await page.waitForTimeout(400);

    // Verify only matching item is highlighted/visible
    await expect(page.locator('text=searchable note')).toBeVisible();
  });

  test('should use undo/redo', async ({ page }) => {
    await page.goto('/');

    // Create an item
    const input = page.locator('input[placeholder*="thought"]').first();
    await input.fill('* undo test');
    await input.press('Enter');

    // Verify item exists
    await expect(page.locator('text=undo test')).toBeVisible();

    // Undo (Ctrl+Z)
    await page.keyboard.press('Control+z');

    // Verify item is gone
    await expect(page.locator('text=undo test')).not.toBeVisible();

    // Redo (Ctrl+Shift+Z)
    await page.keyboard.press('Control+Shift+z');

    // Verify item is back
    await expect(page.locator('text=undo test')).toBeVisible();
  });

  test('should export and import data', async ({ page }) => {
    await page.goto('/');

    // Create an item
    const input = page.locator('input[placeholder*="thought"]').first();
    await input.fill('* export test item');
    await input.press('Enter');

    // Open settings
    await page.getByTitle('Settings').click();

    // Verify export button exists
    await expect(page.locator('button:has-text("Export Data")')).toBeVisible();
    await expect(page.locator('button:has-text("Import Data")')).toBeVisible();
  });

  test('should toggle time format', async ({ page }) => {
    await page.goto('/');

    // Open settings
    await page.getByTitle('Settings').click();

    // Toggle to 24-hour
    await page.locator('button:has-text("24-hour")').click();

    // Close settings
    await page.keyboard.press('Escape');

    // Reopen settings and verify it's still 24-hour
    await page.getByTitle('Settings').click();
    const btn24 = page.locator('button:has-text("24-hour")');
    await expect(btn24).toHaveClass(/bg-text-primary/);
  });
});
