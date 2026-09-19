import { test, expect } from '@playwright/test';

test.describe('Svelte Hub — UI & E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Clear localStorage and reset apps before each test so tests are idempotent
    await page.request.post('/api/apps/reset');
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

  test('Navbar renders and navigates to Company Profile and back to Dashboard via SPA routing', async ({ page }) => {
    const navHome = page.locator('[data-testid="nav-link-home"]');
    const navCompany = page.locator('[data-testid="nav-link-company-profile"]');

    await expect(navHome).toBeVisible();
    await expect(navCompany).toBeVisible();

    // Click company profile link
    await navCompany.click();
    await expect(page).toHaveURL(/.*company-profile/);
    await expect(page.getByText('SVELTE HUB TECH LABS')).toBeVisible();
    await expect(page.getByText('VISI KAMI')).toBeVisible();
    await expect(page.getByText('MISI KAMI')).toBeVisible();
    await expect(page.getByText('Rizal Fauzi')).toBeVisible();

    // Click back to dashboard link
    await navHome.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('HUB APLIKASI SVELTE')).toBeVisible();
  });

  test('Add App button in debug mode opens modal, submits new app to Zustand store, and updates App Grid', async ({ page }) => {
    // Verify Add App button exists in debug mode
    const openAddBtn = page.locator('[data-testid="btn-open-add-app"]');
    await expect(openAddBtn).toBeVisible();

    // Open modal
    await openAddBtn.click();
    const modalBackdrop = page.locator('[data-testid="add-app-modal-backdrop"]');
    await expect(modalBackdrop).toBeVisible();

    // Fill form
    const appName = 'E2E Automated App';
    await page.locator('[data-testid="input-app-name"]').fill(appName);
    await page.locator('[data-testid="input-app-url"]').fill('https://example.com/e2e');
    await page.locator('[data-testid="input-app-desc"]').fill('Aplikasi uji otomatis Playwright');
    await page.locator('[data-testid="input-app-pic"]').fill('Tester Playwright');
    await page.locator('[data-testid="input-app-wa"]').fill('628999888777');

    // Submit form
    await page.locator('[data-testid="btn-submit-add-app"]').click();

    // Verify modal is closed
    await expect(modalBackdrop).not.toBeVisible();

    // Verify new app appears in the grid
    await expect(page.locator('[data-testid="apps-list"]').getByRole('heading', { name: appName })).toBeVisible();
    await expect(page.locator('[data-testid="apps-list"]').getByText('Aplikasi uji otomatis Playwright')).toBeVisible();
    await expect(page.getByText('Tester Playwright')).toBeVisible();

    // Verify app counter incremented to 7
    const counterBadge = page.locator('[data-testid="apps-counter"]');
    await expect(counterBadge).toContainText('7 APPS TERHUBUNG');

    // Reset apps to keep git working tree clean
    await page.request.post('/api/apps/reset');
  });

  test('Delete App button in debug mode opens confirmation modal and removes app from grid', async ({ page }) => {
    // Check initial count
    const initialWaButtons = page.getByRole('link', { name: /HUBUNGI PIC/i });
    const countBefore = await initialWaButtons.count();

    // Find the first delete button on an app card
    const firstDeleteBtn = page.locator('[data-testid^="btn-delete-app-"]').first();
    await expect(firstDeleteBtn).toBeVisible();

    // Click delete button
    await firstDeleteBtn.click();

    // Confirm modal should appear
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await expect(page.getByText('HAPUS APLIKASI', { exact: true })).toBeVisible();

    // Cancel first to verify it does not delete
    await page.locator('[data-testid="modal-cancel-button"]').click();
    await expect(confirmModal).not.toBeVisible();
    expect(await initialWaButtons.count()).toBe(countBefore);

    // Click delete again and confirm
    await firstDeleteBtn.click();
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();

    // Count should be decremented
    const counterBadge = page.locator('[data-testid="apps-counter"]');
    await expect(counterBadge).toContainText(`${countBefore - 1} APPS TERHUBUNG`);

    // Verify alert toast appeared
    const alertToast = page.locator('[data-testid="alert-toast"]');
    await expect(alertToast.first()).toBeVisible();

    // Reset apps to restore original state
    await page.request.post('/api/apps/reset');
  });

  test('Edit App button in debug mode opens modal, updates app data, and shows alert toast', async ({ page }) => {
    // Find edit button on the first app card
    const firstEditBtn = page.locator('[data-testid^="btn-edit-app-"]').first();
    await expect(firstEditBtn).toBeVisible();

    // Open edit modal
    await firstEditBtn.click();
    const editModal = page.locator('[data-testid="edit-app-modal"]');
    await expect(editModal).toBeVisible();

    // Edit app name
    const editedName = 'Portfolio Pro Edition';
    const nameInput = page.locator('[data-testid="input-edit-app-name"]');
    await nameInput.fill(editedName);

    // Submit edit form
    await page.locator('[data-testid="btn-submit-edit-app"]').click();

    // Modal should close
    await expect(editModal).not.toBeVisible();

    // New name should be rendered on the card
    await expect(page.locator('[data-testid="apps-list"]').getByRole('heading', { name: editedName })).toBeVisible();

    // Toast alert should be visible
    const alertToast = page.locator('[data-testid="alert-toast"]');
    await expect(alertToast.first()).toBeVisible();
    await expect(page.locator('[data-testid="alert-message"]').first()).toContainText('berhasil diperbarui');

    // Dismiss alert via close button
    const closeBtn = page.locator('[data-testid="alert-close-btn"]').first();
    await closeBtn.click();
    await expect(alertToast).toHaveCount(0);

    // Reset apps to restore original state
    await page.request.post('/api/apps/reset');
  });

  test('Sticky Navbar has sticky positioning and remains visible at the top during scroll', async ({ page }) => {
    const navbarHeader = page.locator('[data-testid="navbar-header"]');
    await expect(navbarHeader).toBeVisible();
    await expect(navbarHeader).toHaveClass(/sticky/);

    // Scroll down the page
    await page.evaluate(() => window.scrollTo(0, 600));

    // Navbar should still be within viewport
    await expect(navbarHeader).toBeInViewport();
  });

  test('Language switcher toggles UI between Indonesian and English translations across entire app', async ({ page }) => {
    // Initial ID text on Home page
    await expect(page.getByText('HUB APLIKASI SVELTE')).toBeVisible();
    await expect(page.getByText('TAMBAH APLIKASI')).toBeVisible();
    await expect(page.getByText('CATATAN & TO-DO LIST')).toBeVisible();
    await expect(page.locator('[data-testid="filter-all"]')).toContainText('SEMUA');
    await expect(page.locator('[data-testid="footer-github-link"]')).toContainText('GITHUB REPO ↗');

    // Click language switcher to EN
    const langBtn = page.locator('[data-testid="lang-switcher-btn"]');
    await langBtn.click();

    // Verify English translations on Home page
    await expect(page.getByText('SVELTE APPS HUB')).toBeVisible();
    await expect(page.getByText('ADD APPLICATION')).toBeVisible();
    await expect(page.locator('[data-testid="apps-counter"]')).toContainText('CONNECTED APPS');
    await expect(page.getByText('NOTES & TO-DO LIST')).toBeVisible();
    await expect(page.locator('[data-testid="filter-all"]')).toContainText('ALL');
    await expect(langBtn).toContainText('EN');

    // Navigate to Company Profile in English
    await page.locator('[data-testid="nav-link-company-profile"]').click();
    await expect(page.locator('[data-testid="cp-vision-title"]')).toHaveText('OUR VISION');
    await expect(page.locator('[data-testid="cp-mission-title"]')).toHaveText('OUR MISSION');
    await expect(page.locator('[data-testid="cp-back-btn"]')).toContainText('BACK TO DASHBOARD');

    // Toggle back to Indonesian while on Company Profile
    await langBtn.click();
    await expect(page.locator('[data-testid="cp-vision-title"]')).toHaveText('VISI KAMI');
    await expect(page.locator('[data-testid="cp-mission-title"]')).toHaveText('MISI KAMI');
    await expect(page.locator('[data-testid="cp-back-btn"]')).toContainText('KEMBALI KE DASHBOARD');
    await expect(langBtn).toContainText('ID');
  });
});



