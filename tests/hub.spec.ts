import { test, expect } from '@playwright/test';

test.describe('Svelte Hub — UI & E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test so tests are idempotent
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('Hero section renders branding, logo, and tech badges', async ({ page }) => {
    // Check main title
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toBeVisible();

    // Check logo image
    const heroLogo = page.locator('img[alt*="Logo"]');
    await expect(heroLogo).toBeVisible();

    // Check badges
    await expect(page.getByText('⚡ SVELTE 5')).toBeVisible();
    await expect(page.getByText('🚀 VITE')).toBeVisible();
    await expect(page.getByText('🐳 DOCKER READY')).toBeVisible();
  });

  test('App Grid displays apps collection with external links and WhatsApp PIC buttons', async ({ page }) => {
    // Check section title
    await expect(page.getByText('HUB APLIKASI SVELTE')).toBeVisible();

    // Verify app cards exist
    const openAppButtons = page.getByRole('link', { name: /BUKA APLIKASI/i });
    expect(await openAppButtons.count()).toBeGreaterThanOrEqual(6);

    // Verify WhatsApp PIC buttons exist with wa.me link
    const waButtons = page.getByRole('link', { name: /HUBUNGI PIC/i });
    expect(await waButtons.count()).toBeGreaterThanOrEqual(6);

    const firstWaHref = await waButtons.first().getAttribute('href');
    expect(firstWaHref).toContain('https://wa.me/');
  });

  test('To-Do List can add, toggle, filter, and delete tasks', async ({ page }) => {
    // Check section title
    await expect(page.getByText('CATATAN & TO-DO LIST')).toBeVisible();

    const initialTodosCount = await page.locator('[data-testid^="todo-item-"]').count();
    expect(initialTodosCount).toBe(3);

    // Add a new todo item
    const testTodoTitle = 'Playwright Automated Test Task';
    await page.locator('[data-testid="todo-input"]').fill(testTodoTitle);
    await page.locator('[data-testid="todo-add-button"]').click();

    // Verify new todo is added
    await expect(page.getByText(testTodoTitle)).toBeVisible();

    // Toggle the newly added item
    const newCheckbox = page.locator('input[type="checkbox"]').first();
    await newCheckbox.check();

    // Test filters
    await page.locator('[data-testid="filter-done"]').click();
    await expect(page.getByText(testTodoTitle)).toBeVisible();

    await page.locator('[data-testid="filter-active"]').click();
    await expect(page.getByText(testTodoTitle)).not.toBeVisible();

    await page.locator('[data-testid="filter-all"]').click();
    await expect(page.getByText(testTodoTitle)).toBeVisible();
  });

  test('Sub-tasks feature can expand, add sub-task, toggle checkbox, and delete sub-task', async ({ page }) => {
    // Add a fresh parent task
    const parentTaskTitle = 'Proyek Besar dengan Sub-tasks';
    await page.locator('[data-testid="todo-input"]').fill(parentTaskTitle);
    await page.locator('[data-testid="todo-add-button"]').click();

    // The newly created todo is the first one in the list
    const firstTodo = page.locator('[data-testid^="todo-item-"]').first();
    await expect(firstTodo).toContainText(parentTaskTitle);

    // Add a subtask under this parent task
    const subTaskInput = firstTodo.locator('[data-testid^="input-subtask-"]');
    await subTaskInput.fill('Langkah 1: Setup database');
    const addSubButton = firstTodo.locator('button', { hasText: '+ SUB' });
    await addSubButton.click();

    // Verify sub-task text is rendered
    await expect(firstTodo.getByText('Langkah 1: Setup database')).toBeVisible();

    // Verify subtask progress badge is displayed
    await expect(firstTodo.getByText('0/1 SUB-TASKS')).toBeVisible();

    // Toggle sub-task checkbox
    const subCheckbox = firstTodo.locator('[data-testid^="checkbox-subtask-"]').first();
    await subCheckbox.check();

    // Progress badge should update to 1/1
    await expect(firstTodo.getByText('1/1 SUB-TASKS')).toBeVisible();

    // Delete the sub-task (triggers confirmation modal)
    const deleteSubBtn = firstTodo.locator('[data-testid^="delete-subtask-"]').first();
    await deleteSubBtn.click();

    // Verify confirmation modal appears
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();

    // Verify subtask is removed
    await expect(firstTodo.getByText('Langkah 1: Setup database')).not.toBeVisible();
  });

  test('Confirmation modal prevents accidental deletion and supports cancel, backdrop click, and Escape key', async ({ page }) => {
    const firstTodo = page.locator('[data-testid^="todo-item-"]').first();
    const todoText = await firstTodo.locator('label span').first().innerText();

    // Click delete on parent todo
    const deleteBtn = firstTodo.locator('[data-testid^="delete-todo-"]').first();
    await deleteBtn.click();

    // Verify modal is open
    const modal = page.locator('[data-testid="confirm-modal"]');
    await expect(modal).toBeVisible();
    await expect(page.getByText('HAPUS CATATAN', { exact: true })).toBeVisible();

    // Test Cancel button: click Batal, modal closes, todo remains
    await page.locator('[data-testid="modal-cancel-button"]').click();
    await expect(modal).not.toBeVisible();
    await expect(page.getByText(todoText)).toBeVisible();

    // Reopen modal and test Escape key
    await deleteBtn.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    await expect(page.getByText(todoText)).toBeVisible();

    // Reopen modal and test confirming deletion
    await deleteBtn.click();
    await expect(modal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(modal).not.toBeVisible();
    await expect(page.getByText(todoText)).not.toBeVisible();
  });

  test('Multiline input with Shift+Enter creates a task with line breaks and Enter submits', async ({ page }) => {
    // Verify keyboard shortcut info is displayed
    await expect(page.getByText(/Tekan Enter untuk menyimpan, Shift \+ Enter untuk baris baru/i)).toBeVisible();

    const todoInput = page.locator('[data-testid="todo-input"]');
    await todoInput.focus();
    await page.keyboard.type('Catatan Baris 1');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Catatan Baris 2');

    // Press Enter without Shift to submit
    await page.keyboard.press('Enter');

    // Verify task is added and contains both lines
    const firstTodo = page.locator('[data-testid^="todo-item-"]').first();
    await expect(firstTodo).toContainText('Catatan Baris 1\nCatatan Baris 2');

    // Verify input is cleared
    await expect(todoInput).toHaveValue('');
  });

  test('Dev Mode indicator badge is visible in development environment', async ({ page }) => {
    const devBadge = page.getByText(/DEV MODE/i);
    await expect(devBadge).toBeVisible();
  });
});
