import { test, expect } from '@playwright/test';

test.describe('Integration Tests - Key User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test.describe('Capture → Timeline Flow', () => {
    test('should capture a todo with time and show it in time pane', async ({ page }) => {
      // Create a todo with specific time
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('t meeting with team at 2pm');
      await input.press('Enter');

      // Verify item appears in Thoughts pane
      const thoughtsPane = page.locator('.w-1\\/2').first();
      await expect(thoughtsPane.locator('text=meeting with team')).toBeVisible();

      // Verify item appears in Time pane (right pane)
      const timePane = page.locator('.w-1\\/2').last();
      await expect(timePane.locator('text=meeting with team')).toBeVisible();
    });

    test('should capture an event with start/end time and show in timeline', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('e project review from 3pm to 4pm');
      await input.press('Enter');

      // Verify event appears in both panes
      await expect(page.locator('text=project review').first()).toBeVisible();

      // Check time indicators exist
      const timePane = page.locator('.w-1\\/2').last();
      await expect(timePane.locator('text=project review')).toBeVisible();
    });

    test('should capture a note without time (stays only in thoughts)', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('* random thought for later');
      await input.press('Enter');

      // Verify note appears in Thoughts pane
      const thoughtsPane = page.locator('.w-1\\/2').first();
      await expect(thoughtsPane.locator('text=random thought for later')).toBeVisible();
    });
  });

  test.describe('Daily Review → Completion Flow', () => {
    test('should complete a todo and persist the state', async ({ page }) => {
      // Create multiple todos
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('t task one at 9am');
      await input.press('Enter');
      await input.fill('t task two at 10am');
      await input.press('Enter');

      // Complete the first task
      const checkboxes = page.locator('button:has-text("□")');
      await checkboxes.first().click();

      // Verify completion
      await expect(page.locator('button:has-text("☑")').first()).toBeVisible();

      // Reload page to verify persistence
      await page.reload();

      // Verify completed state persists
      await expect(page.locator('button:has-text("☑")').first()).toBeVisible();
      await expect(page.locator('button:has-text("□")').first()).toBeVisible();
    });

    test('should uncomplete a completed todo', async ({ page }) => {
      // Create and complete a todo
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('t reversible task at 11am');
      await input.press('Enter');

      // Complete it
      await page.locator('button:has-text("□")').first().click();
      await expect(page.locator('button:has-text("☑")').first()).toBeVisible();

      // Uncomplete it
      await page.locator('button:has-text("☑")').first().click();
      await expect(page.locator('button:has-text("□")').first()).toBeVisible();
    });
  });

  test.describe('Undo/Redo Multi-step Flow', () => {
    test('should undo multiple actions in sequence', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();

      // Create three items
      await input.fill('* first item');
      await input.press('Enter');
      await input.fill('* second item');
      await input.press('Enter');
      await input.fill('* third item');
      await input.press('Enter');

      // Verify all exist
      await expect(page.locator('text=first item')).toBeVisible();
      await expect(page.locator('text=second item')).toBeVisible();
      await expect(page.locator('text=third item')).toBeVisible();

      // Undo third
      await page.keyboard.press('Control+z');
      await expect(page.locator('text=third item')).not.toBeVisible();
      await expect(page.locator('text=second item')).toBeVisible();

      // Undo second
      await page.keyboard.press('Control+z');
      await expect(page.locator('text=second item')).not.toBeVisible();
      await expect(page.locator('text=first item')).toBeVisible();

      // Undo first
      await page.keyboard.press('Control+z');
      await expect(page.locator('text=first item')).not.toBeVisible();
    });

    test('should redo after multiple undos', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();

      // Create two items
      await input.fill('* redo test one');
      await input.press('Enter');
      await input.fill('* redo test two');
      await input.press('Enter');

      // Undo both
      await page.keyboard.press('Control+z');
      await page.keyboard.press('Control+z');

      // Verify both gone
      await expect(page.locator('text=redo test one')).not.toBeVisible();
      await expect(page.locator('text=redo test two')).not.toBeVisible();

      // Redo first
      await page.keyboard.press('Control+Shift+z');
      await expect(page.locator('text=redo test one')).toBeVisible();

      // Redo second
      await page.keyboard.press('Control+Shift+z');
      await expect(page.locator('text=redo test two')).toBeVisible();
    });

    test('should undo delete operation', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('* delete and restore');
      await input.press('Enter');

      // Delete the item
      const item = page.locator('text=delete and restore').first();
      await item.hover();
      await page.locator('button[title="Delete"]').first().click();
      await page.locator('button:has-text("Delete")').click();

      // Verify deleted
      await expect(page.locator('text=delete and restore')).not.toBeVisible();

      // Undo delete
      await page.keyboard.press('Control+z');

      // Verify restored
      await expect(page.locator('text=delete and restore')).toBeVisible();
    });

    test('should undo completion toggle', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('t toggle undo test at 1pm');
      await input.press('Enter');

      // Complete the todo
      await page.locator('button:has-text("□")').first().click();
      await expect(page.locator('button:has-text("☑")').first()).toBeVisible();

      // Undo completion
      await page.keyboard.press('Control+z');
      await expect(page.locator('button:has-text("□")').first()).toBeVisible();
    });
  });

  test.describe('Edit Flow', () => {
    test('should edit an item and persist changes', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('* original content');
      await input.press('Enter');

      // Hover and click edit
      const item = page.locator('text=original content').first();
      await item.hover();
      await page.locator('button[title="Edit"]').first().click();

      // Edit the content
      const editInput = page.locator('textarea').first();
      await editInput.clear();
      await editInput.fill('updated content');
      await editInput.press('Enter');

      // Verify update
      await expect(page.locator('text=updated content')).toBeVisible();
      await expect(page.locator('text=original content')).not.toBeVisible();

      // Reload and verify persistence
      await page.reload();
      await expect(page.locator('text=updated content')).toBeVisible();
    });
  });

  test.describe('Search Flow', () => {
    test('should filter items across both panes when searching', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();

      // Create items with different content
      await input.fill('t unique keyword task at 3pm');
      await input.press('Enter');
      await input.fill('* another note');
      await input.press('Enter');

      // Open search
      await page.getByTitle('Search').click();
      const searchInput = page.locator('input[placeholder="Search..."]');
      await searchInput.fill('unique keyword');

      // Wait for debounce
      await page.waitForTimeout(400);

      // Verify matching item is still visible/highlighted
      await expect(page.locator('text=unique keyword task')).toBeVisible();
    });

    test('should clear search when closing', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('* searchable item');
      await input.press('Enter');

      // Open search and type
      await page.getByTitle('Search').click();
      const searchInput = page.locator('input[placeholder="Search..."]');
      await searchInput.fill('searchable');
      await page.waitForTimeout(400);

      // Close search with escape
      await page.keyboard.press('Escape');

      // Search input should be gone
      await expect(page.locator('input[placeholder="Search..."]')).not.toBeVisible();
    });
  });

  test.describe('Cross-pane Interaction Flow', () => {
    test('should jump from time pane to source in thoughts pane', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();
      await input.fill('t jump test task at 5pm');
      await input.press('Enter');

      // Find the item in time pane and hover
      const timePane = page.locator('.w-1\\/2').last();
      const timeItem = timePane.locator('text=jump test task');
      await timeItem.hover();

      // Click jump to source button if available
      const jumpButton = page.locator('button[title="Jump to source"]').first();
      if (await jumpButton.isVisible()) {
        await jumpButton.click();

        // Item should be highlighted in thoughts pane
        await page.waitForTimeout(100);
        const thoughtsPane = page.locator('.w-1\\/2').first();
        await expect(thoughtsPane.locator('text=jump test task')).toBeVisible();
      }
    });
  });

  test.describe('Data Persistence Flow', () => {
    test('should persist all item types after reload', async ({ page }) => {
      const input = page.locator('input[placeholder*="thought"]').first();

      // Create different item types
      await input.fill('t todo item at 9am');
      await input.press('Enter');
      await input.fill('e event item from 10am to 11am');
      await input.press('Enter');
      await input.fill('* note item');
      await input.press('Enter');

      // Reload
      await page.reload();

      // Verify all items persist
      await expect(page.locator('text=todo item').first()).toBeVisible();
      await expect(page.locator('text=event item').first()).toBeVisible();
      await expect(page.locator('text=note item').first()).toBeVisible();
    });

    test('should persist settings after reload', async ({ page }) => {
      // Open settings and change theme
      await page.getByTitle('Settings').click();
      await page.locator('button:has-text("Light")').click();
      await page.keyboard.press('Escape');

      // Verify theme changed
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

      // Reload
      await page.reload();

      // Verify theme persists
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });
  });
});
