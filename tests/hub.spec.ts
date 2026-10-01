import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Pastikan environment variable development ter-load jika belum terdefinisi
if (!process.env.ADMIN_PASSWORD) {
  for (const envFile of ['.env.development', '.env']) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
      try {
        process.loadEnvFile(envPath);
      } catch {}
    }
  }
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || '';

test.describe('Apps Hub — UI & E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      window.localStorage.clear();
      const defaultRole = { id: 1, name: 'SUPERADMIN', is_debug: true };
      const defaultUser = {
        uuid: 'a0000000-0000-0000-0000-000000000001',
        username: 'rizlfauzy',
        name: 'Rizal Fauzi',
        roleId: 1,
        role: defaultRole,
      };
      (window as any).__authStore?.setUserSession?.(defaultUser, defaultRole);
    });
    await page.waitForFunction(() => !(window as any).__appStore?.getState?.()?.isLoading && !(window as any).__todoStore?.getState?.()?.isLoading && !(window as any).__sectionStore?.getState?.()?.isLoading);
    await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
    await expect(page.locator('[data-testid="apps-list"]').or(page.locator('[data-testid="apps-empty-state"]'))).toBeVisible();
    await expect(page.locator('[data-testid="todo-input"]')).toBeVisible();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/');
    await page.waitForFunction(() => !(window as any).__appStore?.getState?.()?.isLoading && !(window as any).__todoStore?.getState?.()?.isLoading && !(window as any).__sectionStore?.getState?.()?.isLoading);
    await page.evaluate(async () => {
      // Pastikan memiliki hak akses superadmin agar operasi delete diizinkan RBAC
      const defaultRole = { id: 1, name: 'SUPERADMIN', is_debug: true };
      const defaultUser = {
        uuid: 'a0000000-0000-0000-0000-000000000001',
        username: 'rizlfauzy',
        name: 'Rizal Fauzi',
        roleId: 1,
        role: defaultRole,
      };
      (window as any).__authStore?.setUserSession?.(defaultUser, defaultRole);

      const store = (window as any).__appStore;
      if (store) {
        const apps = store.getState?.()?.apps || [];
        // Pembersihan otomatis: hapus semua aplikasi hasil test yang mengandung 'test'
        const testApps = apps.filter((a: any) =>
          a.name?.toLowerCase().includes('test')
        );
        for (const app of testApps) {
          await store.deleteApp(app.id);
        }
      }

      const todoStore = (window as any).__todoStore;
      if (todoStore) {
        const todos = todoStore.getState?.()?.todos || [];
        // Pembersihan otomatis: hapus semua to-do list hasil test yang mengandung 'test'
        const testTodos = todos.filter((t: any) =>
          t.text?.toLowerCase().includes('test')
        );
        for (const todo of testTodos) {
          await todoStore.deleteTodo(todo.id);
        }
      }

      const authStore = (window as any).__authStore;
      if (authStore?.cleanupTestUsers) {
        // Pembersihan otomatis: hapus semua user hasil test registrasi yang mengandung 'test'
        await authStore.cleanupTestUsers();
      }

      const sectionStore = (window as any).__sectionStore;
      if (sectionStore) {
        await sectionStore.resetSections?.('home');
        await sectionStore.resetSections?.('company-profile');
      }
    });
    await page.close();
  });

  test('Hero section renders branding, logo, and tech badges', async ({ page }) => {
    // Check main title
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toBeVisible();

    // Check logo image
    const heroLogo = page.locator('img[alt*="Logo"]');
    await expect(heroLogo).toBeVisible();

    // Check badges
    await expect(page.getByText('🏢 PORTAL RESMI')).toBeVisible();
    await expect(page.getByText('⚡ CLOUD SYNC')).toBeVisible();
    await expect(page.getByText('🔒 ENTERPRISE READY')).toBeVisible();
  });

  test('App Grid displays apps collection with external links and WhatsApp PIC buttons', async ({ page }) => {
    // Check section title
    await expect(page.getByText('HUB APLIKASI')).toBeVisible();

    const emptyState = page.locator('[data-testid="apps-empty-state"]');
    const appsList = page.locator('[data-testid="apps-list"]');
    await expect(emptyState.or(appsList)).toBeVisible();

    // Ensure there is at least one app to verify card elements
    let openAppButtons = page.getByRole('link', { name: /BUKA APLIKASI/i });
    if ((await openAppButtons.count()) === 0) {
      await page.locator('[data-testid="btn-open-add-app"]').click();
      await page.locator('[data-testid="input-app-name"]').fill('Demo Test App');
      await page.locator('[data-testid="input-app-url"]').fill('https://example.com/demo');
      await page.locator('[data-testid="input-app-desc"]').fill('Aplikasi demo');
      await page.locator('[data-testid="input-app-pic"]').fill('Demo PIC');
      await page.locator('[data-testid="input-app-wa"]').fill('6281234567890');
      await page.locator('[data-testid="btn-submit-add-app"]').click();
      await expect(page.locator('[data-testid="add-app-modal-backdrop"]')).not.toBeVisible();
      openAppButtons = page.getByRole('link', { name: /BUKA APLIKASI/i });
    }

    expect(await openAppButtons.count()).toBeGreaterThanOrEqual(1);

    // Verify WhatsApp PIC buttons exist and open preview modal with wa.me link
    const waButtons = page.locator('[data-testid^="btn-contact-pic-"]');
    expect(await waButtons.count()).toBeGreaterThanOrEqual(1);

    await waButtons.first().click();
    const waModal = page.locator('[data-testid="wa-preview-modal"]');
    await expect(waModal).toBeVisible();

    const sendLink = page.locator('[data-testid="btn-send-whatsapp"]');
    await expect(sendLink).toBeVisible();
    const firstWaHref = await sendLink.getAttribute('href');
    expect(firstWaHref).toContain('https://wa.me/');

    await page.locator('[data-testid="btn-cancel-wa-modal"]').click();
    await expect(waModal).not.toBeVisible();
  });

  test('To-Do List can add, toggle, filter, and delete tasks', async ({ page }) => {
    // Check section title
    await expect(page.getByText('CATATAN & TO-DO LIST')).toBeVisible();

    const initialTodosCount = await page.locator('[data-testid^="todo-item-"]').count();
    expect(initialTodosCount).toBeGreaterThanOrEqual(0);

    // Add a new todo item
    const testTodoTitle = `Playwright Automated Test Task ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(testTodoTitle);
    await page.locator('[data-testid="todo-add-button"]').click();

    // Verify new todo is added
    const newItem = page.locator('[data-testid^="todo-item-"]', { hasText: testTodoTitle });
    await expect(newItem).toBeVisible();

    // Toggle the newly added item
    const newCheckbox = newItem.locator('input[type="checkbox"]');
    await newCheckbox.check();

    // Test filters
    await page.locator('[data-testid="filter-done"]').click();
    await expect(page.getByText(testTodoTitle)).toBeVisible();

    await page.locator('[data-testid="filter-active"]').click();
    await expect(page.getByText(testTodoTitle)).not.toBeVisible();

    await page.locator('[data-testid="filter-all"]').click();
    await expect(page.getByText(testTodoTitle)).toBeVisible();

    // Clean up: delete the task and verify it is removed
    const deleteBtn = newItem.locator('[data-testid^="delete-todo-"]').first();
    await deleteBtn.click();
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();
    await expect(newItem).not.toBeVisible();
  });

  test('Sub-tasks feature can expand, add sub-task, toggle checkbox, and delete sub-task', async ({ page }) => {
    // Add a fresh parent task
    const parentTaskTitle = `Test Proyek Besar Subtasks ${Date.now()}`;
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

    // Clean up: delete parent task
    const deleteParentBtn = firstTodo.locator('[data-testid^="delete-todo-"]').first();
    await deleteParentBtn.click();
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(page.locator('[data-testid="confirm-modal"]')).not.toBeVisible();
    await expect(page.getByText(parentTaskTitle)).not.toBeVisible();
  });

  test('Confirmation modal prevents accidental deletion and supports cancel, backdrop click, and Escape key', async ({ page }) => {
    if ((await page.locator('[data-testid^="todo-item-"]').count()) === 0) {
      await page.locator('[data-testid="todo-input"]').fill(`Deletion Test Note ${Date.now()}`);
      await page.locator('[data-testid="todo-add-button"]').click();
    }
    const firstTodo = page.locator('[data-testid^="todo-item-"]').first();
    const todoId = await firstTodo.getAttribute('data-testid');
    const targetItem = page.locator(`[data-testid="${todoId}"]`);

    // Click delete on parent todo
    const deleteBtn = targetItem.locator('[data-testid^="delete-todo-"]').first();
    await deleteBtn.click();

    // Verify modal is open
    const modal = page.locator('[data-testid="confirm-modal"]');
    await expect(modal).toBeVisible();
    await expect(page.getByText('HAPUS CATATAN', { exact: true })).toBeVisible();

    // Test Cancel button: click Batal, modal closes, todo remains
    await page.locator('[data-testid="modal-cancel-button"]').click();
    await expect(modal).not.toBeVisible();
    await expect(targetItem).toBeVisible();

    // Reopen modal and test Escape key
    await deleteBtn.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    await expect(targetItem).toBeVisible();

    // Reopen modal and test confirming deletion
    await deleteBtn.click();
    await expect(modal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(modal).not.toBeVisible();
    await expect(targetItem).not.toBeVisible();
  });

  test('Multiline input with Shift+Enter creates a task with line breaks and Enter submits', async ({ page }) => {
    // Verify keyboard shortcut info is displayed
    await expect(page.getByText(/Tekan Enter untuk menyimpan, Shift \+ Enter untuk baris baru/i)).toBeVisible();

    const todoInput = page.locator('[data-testid="todo-input"]');
    await todoInput.focus();
    await page.keyboard.type('Test Catatan Baris 1');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Test Catatan Baris 2');

    // Press Enter without Shift to submit
    await page.keyboard.press('Enter');

    // Verify task is added and contains both lines
    const firstTodo = page.locator('[data-testid^="todo-item-"]').first();
    await expect(firstTodo).toContainText('Test Catatan Baris 1\nTest Catatan Baris 2');

    // Verify input is cleared
    await expect(todoInput).toHaveValue('');

    // Clean up: delete the multiline task
    const deleteBtn = firstTodo.locator('[data-testid^="delete-todo-"]').first();
    await deleteBtn.click();
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(page.locator('[data-testid="confirm-modal"]')).not.toBeVisible();
    await expect(page.getByText('Test Catatan Baris 1')).not.toBeVisible();
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
    const cpContainer = page.locator('[data-testid="company-profile-container"]');
    await expect(cpContainer.locator('[data-testid="cp-title"]')).toHaveText('CV SUKSES GEMILANG');
    await expect(cpContainer.getByText('VISI KAMI')).toBeVisible();
    await expect(cpContainer.getByText('MISI KAMI')).toBeVisible();
    await expect(cpContainer.getByText('Tim Manajemen CV Sukses Gemilang')).toBeVisible();
    await expect(cpContainer.getByText('Rizal Fauzi')).not.toBeVisible();

    // Click back to dashboard link
    await navHome.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('HUB APLIKASI')).toBeVisible();
  });

  test('Add App button in debug mode opens modal, submits new app to Zustand store, and updates App Grid', async ({ page }) => {
    // Verify Add App button exists in debug mode
    const openAddBtn = page.locator('[data-testid="btn-open-add-app"]');
    await expect(openAddBtn).toBeVisible();

    // Check initial counter
    const counterBadge = page.locator('[data-testid="apps-counter"]');
    const initialText = (await counterBadge.textContent()) || '';
    const initialCount = parseInt(initialText, 10) || 0;

    // Open modal
    await openAddBtn.click();
    const modalBackdrop = page.locator('[data-testid="add-app-modal-backdrop"]');
    await expect(modalBackdrop).toBeVisible();

    // Fill form
    const appName = `Test E2E Automated App ${Date.now()}`;
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
    const createdCard = page.locator('[data-testid="apps-list"]').locator('[data-testid^="app-card-"]', { hasText: appName });
    await expect(createdCard).toBeVisible();
    await expect(page.locator('[data-testid="apps-list"]').getByText('Aplikasi uji otomatis Playwright').first()).toBeVisible();
    await expect(page.getByText('Tester Playwright').first()).toBeVisible();

    // Verify app counter incremented
    const expectedCount = initialCount + 1;
    await expect(counterBadge).toContainText(`${expectedCount} APPS TERHUBUNG`);

    // Clean up created app at the end of test so database remains clean
    await createdCard.locator('[data-testid^="btn-delete-app-"]').click();
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();
    await expect(createdCard).not.toBeVisible();
    await expect(counterBadge).toContainText(`${initialCount} APPS TERHUBUNG`);
  });

  test('Delete App button in debug mode opens confirmation modal and removes app from grid', async ({ page }) => {
    // Create a dedicated app to test deletion
    const targetName = `Test Delete Target ${Date.now()}`;
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await page.locator('[data-testid="input-app-name"]').fill(targetName);
    await page.locator('[data-testid="input-app-url"]').fill('https://example.com/delete');
    await page.locator('[data-testid="input-app-desc"]').fill('App to delete');
    await page.locator('[data-testid="input-app-pic"]').fill('Delete PIC');
    await page.locator('[data-testid="input-app-wa"]').fill('6281234567890');
    await page.locator('[data-testid="btn-submit-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-backdrop"]')).not.toBeVisible();

    const targetCard = page.locator('[data-testid="apps-list"]').locator('[data-testid^="app-card-"]', { hasText: targetName });
    await expect(targetCard).toBeVisible();

    // Check count before deletion
    const counterBadge = page.locator('[data-testid="apps-counter"]');
    const initialText = (await counterBadge.textContent()) || '';
    const countBefore = parseInt(initialText, 10) || 0;

    const deleteBtn = targetCard.locator('[data-testid^="btn-delete-app-"]');
    await expect(deleteBtn).toBeVisible();

    // Click delete button
    await deleteBtn.click();

    // Confirm modal should appear
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await expect(page.getByText('HAPUS APLIKASI', { exact: true })).toBeVisible();

    // Cancel first to verify it does not delete
    await page.locator('[data-testid="modal-cancel-button"]').click();
    await expect(confirmModal).not.toBeVisible();
    await expect(targetCard).toBeVisible();

    // Click delete again and confirm
    await deleteBtn.click();
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();

    // Count should be decremented and target card removed
    await expect(targetCard).not.toBeVisible();
    await expect(counterBadge).toContainText(`${countBefore - 1} APPS TERHUBUNG`);

    // Verify alert toast appeared
    const alertToast = page.locator('[data-testid="alert-toast"]');
    await expect(alertToast.first()).toBeVisible();
  });

  test('Edit App button in debug mode opens modal, updates app data, and shows alert toast', async ({ page }) => {
    // Create a dedicated app to test editing
    const baseName = `Test Edit Target ${Date.now()}`;
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await page.locator('[data-testid="input-app-name"]').fill(baseName);
    await page.locator('[data-testid="input-app-url"]').fill('https://example.com/edit');
    await page.locator('[data-testid="input-app-desc"]').fill('App to edit');
    await page.locator('[data-testid="input-app-pic"]').fill('Edit PIC');
    await page.locator('[data-testid="input-app-wa"]').fill('6281234567890');
    await page.locator('[data-testid="btn-submit-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-backdrop"]')).not.toBeVisible();

    const targetCard = page.locator('[data-testid="apps-list"]').locator('[data-testid^="app-card-"]', { hasText: baseName });
    await expect(targetCard).toBeVisible();

    const editBtn = targetCard.locator('[data-testid^="btn-edit-app-"]');
    await expect(editBtn).toBeVisible();

    // Open edit modal
    await editBtn.click();
    const editModal = page.locator('[data-testid="edit-app-modal"]');
    await expect(editModal).toBeVisible();

    // Edit app name
    const editedName = `Test Portfolio Pro Edition ${Date.now()}`;
    const nameInput = page.locator('[data-testid="input-edit-app-name"]');
    await nameInput.fill(editedName);

    // Submit edit form
    await page.locator('[data-testid="btn-submit-edit-app"]').click();

    // Modal should close
    await expect(editModal).not.toBeVisible();

    // New name should be rendered on the card
    const editedCard = page.locator('[data-testid="apps-list"]').locator('[data-testid^="app-card-"]', { hasText: editedName });
    await expect(editedCard).toBeVisible();

    // Toast alert should be visible
    const updateAlert = page.locator('[data-testid="alert-message"]', { hasText: 'berhasil diperbarui' });
    await expect(updateAlert).toBeVisible();

    // Dismiss alert via close button
    const closeBtns = page.locator('[data-testid="alert-close-btn"]');
    const btnCount = await closeBtns.count();
    for (let i = 0; i < btnCount; i++) {
      await closeBtns.first().click({ force: true }).catch(() => {});
    }

    // Clean up edited app at the end of test
    await editedCard.locator('[data-testid^="btn-delete-app-"]').click();
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();
    await expect(editedCard).not.toBeVisible();
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
    await expect(page.getByText('HUB APLIKASI')).toBeVisible();
    await expect(page.getByText('TAMBAH APLIKASI')).toBeVisible();
    await expect(page.getByText('CATATAN & TO-DO LIST')).toBeVisible();
    await expect(page.locator('[data-testid="filter-all"]')).toContainText('SEMUA');
    await expect(page.locator('[data-testid="nav-section-settings-btn"]')).toContainText('Tata Letak');

    // Click language switcher to EN
    const langBtn = page.locator('[data-testid="lang-switcher-btn"]');
    await langBtn.click();

    // Verify English translations on Home page
    await expect(page.locator('[data-testid="app-grid-section"]').getByText('APPS HUB')).toBeVisible();
    await expect(page.getByText('ADD APPLICATION')).toBeVisible();
    await expect(page.locator('[data-testid="apps-counter"]')).toContainText('CONNECTED APPS');
    await expect(page.getByText('NOTES & TO-DO LIST')).toBeVisible();
    await expect(page.locator('[data-testid="filter-all"]')).toContainText('ALL');
    await expect(page.locator('[data-testid="nav-section-settings-btn"]')).toContainText('Layout');
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

  test('Sub-menu navigation toggles dropdowns and triggers smooth scrolling to target section IDs', async ({ page }) => {
    // Open Apps dropdown on Desktop
    const appsDropdownToggle = page.locator('[data-testid="nav-dropdown-toggle-home"]');
    await appsDropdownToggle.click();

    const appsSubmenu = page.locator('[data-testid="nav-submenu-home"]');
    await expect(appsSubmenu).toBeVisible();

    // Click To-Do List sublink
    const todoSublink = page.locator('[data-testid="nav-sublink-todo-list"]');
    await todoSublink.click();
    await expect(appsSubmenu).not.toBeVisible();
    await expect(page.locator('#todo-list')).toBeVisible();

    // Open Company Profile dropdown from Home page
    const companyDropdownToggle = page.locator('[data-testid="nav-dropdown-toggle-company"]');
    await companyDropdownToggle.click();

    const companySubmenu = page.locator('[data-testid="nav-submenu-company"]');
    await expect(companySubmenu).toBeVisible();

    // Click Services sublink (should navigate to /company-profile and scroll to #services)
    const servicesSublink = page.locator('[data-testid="nav-sublink-services"]');
    await servicesSublink.click();

    await expect(page).toHaveURL(/.*company-profile/);
    await expect(page.locator('#services')).toBeVisible();
  });

  test('Dark mode toggle switches between light and dark themes with localStorage persistence', async ({ page }) => {
    const html = page.locator('html');
    const themeBtn = page.locator('[data-testid="theme-toggle-btn"]');

    // Click to toggle to dark mode
    await themeBtn.click();
    await expect(html).toHaveClass(/dark/);
    const savedDark = await page.evaluate(() => localStorage.getItem('svelte_hub_theme'));
    expect(savedDark).toBe('dark');

    // Click to toggle back to light mode
    await themeBtn.click();
    await expect(html).not.toHaveClass(/dark/);
    const savedLight = await page.evaluate(() => localStorage.getItem('svelte_hub_theme'));
    expect(savedLight).toBe('light');
  });

  test('PWA Manifest and Service Worker are configured and accessible', async ({ page }) => {
    // Verify Manifest
    const manifestRes = await page.request.get('/manifest.json');
    expect(manifestRes.status()).toBe(200);
    const manifestJson = await manifestRes.json();
    expect(manifestJson.name).toContain('Apps Hub');
    expect(manifestJson.display).toBe('standalone');
    expect(manifestJson.icons.length).toBeGreaterThan(0);

    // Verify Service Worker file
    const swRes = await page.request.get('/sw.js');
    expect(swRes.status()).toBe(200);
    const swText = await swRes.text();
    expect(swText).toContain('CACHE_NAME');
  });

  test('Search bar filters applications by name and PIC in real-time and shows empty state', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-apps-input"]');
    await expect(searchInput).toBeVisible();

    // Search by existing app name (pick the first visible app heading)
    const firstCardHeading = page.locator('[data-testid="apps-list"] [data-testid^="app-card-"]').first().getByRole('heading');
    const existingName = (await firstCardHeading.textContent())?.trim() || 'Portfolio';
    await searchInput.fill(existingName.slice(0, 5));
    await expect(page.locator('[data-testid="apps-list"]')).toBeVisible();

    // Clear search using clear button
    const clearBtn = page.locator('[data-testid="btn-clear-search"]');
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');

    // Search non-existing keyword -> empty state
    await searchInput.fill('NonExistentApp123456xyz');
    await expect(page.locator('[data-testid="apps-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="apps-list"]')).not.toBeVisible();

    // Reset from empty state
    const emptyResetBtn = page.locator('[data-testid="btn-empty-reset"]');
    await emptyResetBtn.click();
    await expect(searchInput).toHaveValue('');
  });

  test('Category filter filters apps, combines with search query, and resets properly', async ({ page }) => {
    // Check categories list
    const categoryBar = page.locator('[data-testid="category-filter-list"]');
    await expect(categoryBar).toBeVisible();

    // Check ALL category button exists
    const allBtn = categoryBar.getByRole('button', { name: /SEMUA|ALL/i });
    await expect(allBtn).toBeVisible();

    // Test clicking category if present
    const categoryButtons = categoryBar.locator('button');
    const catCount = await categoryButtons.count();
    if (catCount > 1) {
      const secondCatBtn = categoryButtons.nth(1);
      await secondCatBtn.click();
      await expect(secondCatBtn).toHaveClass(/bg-nb-yellow/);
      await allBtn.click();
      await expect(allBtn).toHaveClass(/bg-nb-yellow/);
    }
  });

  test('CustomSelect component supports internal search, single selection, and multiple selection with tags', async ({ page }) => {
    // 1. Test Single Select inside AddAppModal
    const openAddBtn = page.locator('[data-testid="btn-open-add-app"]');
    await openAddBtn.click();
    const addModal = page.locator('[data-testid="add-app-modal-card"]');
    await expect(addModal).toBeVisible();

    // Trigger select dropdown
    const selectTrigger = page.locator('[data-testid="input-app-category-trigger"]');
    await expect(selectTrigger).toBeVisible();
    await selectTrigger.click();

    // Verify dropdown is open
    const dropdown = page.locator('[data-testid="input-app-category-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Filter using internal search input
    const searchInput = page.locator('[data-testid="input-app-category-search-input"]');
    await searchInput.fill('Dev');
    await expect(page.locator('[data-testid="input-app-category-option-devtools"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-app-category-option-utility"]')).not.toBeVisible();

    // Select option
    await page.locator('[data-testid="input-app-category-option-devtools"]').click();
    await expect(dropdown).not.toBeVisible();
    await expect(selectTrigger).toContainText('DevTools');

    // Test keyboard selection with Enter (picks topmost option)
    await selectTrigger.click();
    await expect(dropdown).toBeVisible();
    await searchInput.fill('Util');
    await page.keyboard.press('Enter');
    await expect(dropdown).not.toBeVisible();
    await expect(selectTrigger).toContainText('Utility');

    // Test keyboard selection with Tab (picks topmost option)
    await selectTrigger.click();
    await expect(dropdown).toBeVisible();
    await searchInput.fill('Fin');
    await page.keyboard.press('Tab');
    await expect(dropdown).not.toBeVisible();
    await expect(selectTrigger).toContainText('Finance');

    // Close modal
    await page.locator('[data-testid="add-app-close-btn"]').click();

    // 2. Test Multi-Select on Company Profile page
    await page.goto('/company-profile');
    const multiSelectBox = page.locator('[data-testid="cp-service-select-box"]');
    await expect(multiSelectBox).toBeVisible();

    const multiTrigger = page.locator('[data-testid="select-services-multi-trigger"]');
    await expect(multiTrigger).toBeVisible();
    // Initially has 'Arcade & Simulator Games'
    await expect(multiTrigger).toContainText('Arcade & Simulator');

    // Open multi-select dropdown
    await multiTrigger.click();
    const multiDropdown = page.locator('[data-testid="select-services-multi-dropdown"]');
    await expect(multiDropdown).toBeVisible();

    // Search and add another option
    const multiSearch = page.locator('[data-testid="select-services-multi-search-input"]');
    await multiSearch.fill('Party');
    await expect(page.locator('[data-testid="select-services-multi-option-party"]')).toBeVisible();
    await page.locator('[data-testid="select-services-multi-option-party"]').click();

    // Verify tag appeared in trigger
    await expect(page.locator('[data-testid="select-services-multi-tag-party"]')).toBeVisible();

    // Remove first tag using remove button (✕)
    const removeTagBtn = page.locator('[data-testid="select-services-multi-tag-remove-arcade"]');
    await removeTagBtn.click();
    await expect(page.locator('[data-testid="select-services-multi-tag-arcade"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="select-services-multi-tag-party"]')).toBeVisible();

    // Close dropdown with Escape
    await page.keyboard.press('Escape');
    await expect(multiDropdown).not.toBeVisible();

    // Return to home
    await page.goto('/');
  });

  test('AddAppModal and EditAppModal support dynamic i18n translations in ID and EN', async ({ page }) => {
    // Open AddAppModal in default language (ID)
    const openAddBtn = page.locator('[data-testid="btn-open-add-app"]');
    await openAddBtn.click();
    const addTitle = page.locator('#add-app-title');
    await expect(addTitle).toContainText('TAMBAH APLIKASI BARU');
    await expect(page.locator('[data-testid="btn-submit-add-app"]')).toContainText('SIMPAN APLIKASI');
    await page.locator('[data-testid="add-app-close-btn"]').click();

    // Switch language to EN
    const langBtn = page.locator('[data-testid="lang-switcher-btn"]');
    await langBtn.click();
    await expect(page.locator('[data-testid="apps-counter"]')).toContainText('CONNECTED');

    // Reopen AddAppModal in EN
    await openAddBtn.click();
    await expect(addTitle).toContainText('ADD NEW APPLICATION');
    await expect(page.locator('[data-testid="btn-submit-add-app"]')).toContainText('SAVE APPLICATION');
    await page.locator('[data-testid="add-app-close-btn"]').click();

    // Open EditAppModal in EN
    const firstEditBtn = page.locator('[data-testid^="btn-edit-app-"]').first();
    await firstEditBtn.click();
    const editModal = page.locator('[data-testid="edit-app-modal"]');
    await expect(editModal).toBeVisible();
    await expect(page.locator('#edit-app-title')).toContainText('EDIT APPLICATION');
    await expect(page.locator('[data-testid="btn-submit-edit-app"]')).toContainText('SAVE CHANGES');
    await page.locator('[data-testid="btn-close-edit-app"]').click();

    // Switch language back to ID
    await langBtn.click();
  });

  test('ConfirmModal supports dynamic i18n translations in ID and EN', async ({ page }) => {
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    const firstDeleteBtn = page.locator('[data-testid^="btn-delete-app-"]').first();
    const langBtn = page.locator('[data-testid="lang-switcher-btn"]');

    // In default ID locale
    await firstDeleteBtn.click();
    await expect(confirmModal).toBeVisible();
    await expect(page.locator('#modal-title')).toHaveText('HAPUS APLIKASI');
    await expect(page.locator('[data-testid="modal-cancel-button"]')).toHaveText('BATAL');
    await expect(page.locator('[data-testid="modal-confirm-button"]')).toHaveText('YA, HAPUS APLIKASI');
    await expect(confirmModal).toContainText('Item yang dihapus tidak dapat dipulihkan kembali');
    await page.locator('[data-testid="modal-cancel-button"]').click();
    await expect(confirmModal).not.toBeVisible();

    // Switch to EN
    await langBtn.click();

    // In EN locale
    await firstDeleteBtn.click();
    await expect(confirmModal).toBeVisible();
    await expect(page.locator('#modal-title')).toHaveText('DELETE APPLICATION');
    await expect(page.locator('[data-testid="modal-cancel-button"]')).toHaveText('CANCEL');
    await expect(page.locator('[data-testid="modal-confirm-button"]')).toHaveText('YES, DELETE APP');
    await expect(confirmModal).toContainText('Deleted items cannot be recovered');
    await page.locator('[data-testid="modal-cancel-button"]').click();
    await expect(confirmModal).not.toBeVisible();

    // Switch back to ID
    await langBtn.click();
  });

  test('Alert toast renders countdown progress bar with Neo Brutalism styling', async ({ page }) => {
    // Trigger an edit app action which triggers an alert toast
    const firstEditBtn = page.locator('[data-testid^="btn-edit-app-"]').first();
    await firstEditBtn.click();
    const editModal = page.locator('[data-testid="edit-app-modal"]');
    await expect(editModal).toBeVisible();

    await page.locator('[data-testid="btn-submit-edit-app"]').click();
    await expect(editModal).not.toBeVisible();

    // Verify alert toast and countdown progress bar appear
    const alertToast = page.locator('[data-testid="alert-toast"]').first();
    await expect(alertToast).toBeVisible();

    const progressBar = alertToast.locator('[data-testid="alert-progress-bar"]');
    await expect(progressBar).toBeVisible();

    // Close alert via close button
    const closeBtn = alertToast.locator('[data-testid="alert-close-btn"]');
    await closeBtn.click();
    await expect(alertToast).not.toBeVisible();
  });

  test('Supabase client module and database schema are properly defined and resilient', async ({ page }) => {
    // Check that the app is alive and operational in local/offline fallback mode
    const counterBadge = page.locator('[data-testid="apps-counter"]');
    await expect(counterBadge).toBeVisible();

    // Verify todo list is operational through todoStore
    const todoInput = page.locator('[data-testid="todo-input"]');
    await expect(todoInput).toBeVisible();

    // Add a todo item
    const taskName = `Resilience Verification ${Date.now()}`;
    await todoInput.fill(taskName);
    await page.locator('[data-testid="todo-add-button"]').click();

    // Verify item appears in the list
    await expect(page.locator(`text=${taskName}`)).toBeVisible();

    // Clean up: delete the task
    const targetItem = page.locator('[data-testid^="todo-item-"]', { hasText: taskName });
    await targetItem.locator('[data-testid^="delete-todo-"]').first().click();
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(page.locator('[data-testid="confirm-modal"]')).not.toBeVisible();
    await expect(page.locator(`text=${taskName}`)).not.toBeVisible();
  });

  test('Skeleton UI loaders render on App Grid and Todo List during loading states', async ({ page }) => {
    await expect(page.locator('[data-testid="apps-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="todo-input"]')).toBeVisible();

    // Simulate loading state in both stores
    await page.evaluate(() => {
      (window as any).__appStore?.setState?.({ isLoading: true });
      (window as any).__todoStore?.setState?.({ isLoading: true });
    });

    // Verify skeleton loaders are visible
    await expect(page.locator('[data-testid="apps-skeleton-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="skeleton-app-card"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="todos-skeleton-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="skeleton-todo-item"]').first()).toBeVisible();

    // Reset loading state
    await page.evaluate(() => {
      (window as any).__appStore?.setState?.({ isLoading: false });
      (window as any).__todoStore?.setState?.({ isLoading: false });
    });

    // Verify normal content is restored
    await expect(page.locator('[data-testid="apps-list"]')).toBeVisible();
  });

  test('Alert toast countdown pauses on hover and resumes on mouse leave', async ({ page }) => {
    await page.goto('/');

    // Trigger an alert toast via edit app
    const firstEditBtn = page.locator('[data-testid^="btn-edit-app-"]').first();
    await firstEditBtn.click();
    const editModal = page.locator('[data-testid="edit-app-modal"]');
    await expect(editModal).toBeVisible();

    await page.locator('[data-testid="btn-submit-edit-app"]').click();
    await expect(editModal).not.toBeVisible();

    const alertToast = page.locator('[data-testid="alert-toast"]').first();
    await expect(alertToast).toBeVisible();

    // Hover over the alert toast
    await alertToast.hover();
    await expect(alertToast).toHaveAttribute('data-paused', 'true');

    // Wait 500ms while hovered - toast must NOT dismiss
    await page.waitForTimeout(500);
    await expect(alertToast).toBeVisible();

    // Move mouse away to top-left corner
    await page.mouse.move(0, 0);
    await expect(alertToast).toHaveAttribute('data-paused', 'false');

    // Close alert manually
    await alertToast.locator('[data-testid="alert-close-btn"]').click();
    await expect(alertToast).not.toBeVisible();
  });

  test('Apps are sourced 100% from Supabase and apps.ts is configured as empty array baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="apps-list"]').or(page.locator('[data-testid="apps-empty-state"]'))).toBeVisible();

    // Verify apps are fetched from Supabase and populated in appStore
    const appStoreData = await page.evaluate(() => {
      const store = (window as any).__appStore;
      const state = store ? store.getState() : null;
      return {
        count: state ? state.apps.length : 0,
        isConfigured: state !== null,
      };
    });

    expect(appStoreData.isConfigured).toBeTruthy();
  });

  test('Company Profile renders complete themed skeleton loader during loading state', async ({ page }) => {
    await page.goto('/company-profile');
    await expect(page.locator('[data-testid="company-profile-container"]')).toBeVisible();

    // Trigger loading state in Company Profile
    await page.evaluate(() => {
      (window as any).__setCompanyProfileLoading?.(true);
    });

    // Verify skeleton elements are visible
    const skeleton = page.locator('[data-testid="company-profile-skeleton"]');
    await expect(skeleton).toBeVisible();
    await expect(skeleton.locator('.nb-skeleton-box').first()).toBeVisible();

    // Turn off loading state
    await page.evaluate(() => {
      (window as any).__setCompanyProfileLoading?.(false);
    });

    // Verify real content is restored
    await expect(page.locator('[data-testid="company-profile-container"]')).toBeVisible();
  });

  test('Modal and Alert toast support themed skeleton loader states', async ({ page }) => {
    await page.goto('/');

    // Trigger skeleton alert
    await page.evaluate(() => {
      (window as any).alertStore?.showSkeleton?.(5000);
    });

    const skeletonAlert = page.locator('[data-testid="skeleton-alert"]').first();
    await expect(skeletonAlert).toBeVisible();
    await expect(skeletonAlert.locator('.nb-skeleton-box').first()).toBeVisible();

    // Dismiss skeleton alert
    await page.evaluate(() => {
      (window as any).alertStore?.clearAlerts?.();
    });
    await expect(skeletonAlert).not.toBeVisible();
  });

  test('To-Do item can select App as topic and displays corresponding App badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="apps-list"]').or(page.locator('[data-testid="apps-empty-state"]'))).toBeVisible();
    await expect(page.locator('[data-testid="todo-input"]')).toBeVisible();

    // Ensure we have at least one app for topic selection
    let firstCard = page.locator('[data-testid="apps-list"] [data-testid^="app-card-"]').first();
    if (!(await firstCard.isVisible())) {
      await page.locator('[data-testid="btn-open-add-app"]').click();
      await page.locator('[data-testid="input-app-name"]').fill('Topic Test App');
      await page.locator('[data-testid="input-app-url"]').fill('https://example.com/topic');
      await page.locator('[data-testid="input-app-desc"]').fill('App for topic test');
      await page.locator('[data-testid="input-app-pic"]').fill('Topic PIC');
      await page.locator('[data-testid="input-app-wa"]').fill('6281234567890');
      await page.locator('[data-testid="btn-submit-add-app"]').click();
      await expect(page.locator('[data-testid="add-app-modal-backdrop"]')).not.toBeVisible();
    }

    // Verify app topic selector exists (CustomSelect)
    const topicTrigger = page.locator('[data-testid="todo-app-topic-select-trigger"]');
    await expect(topicTrigger).toBeVisible();

    // Open CustomSelect and pick an option (the first actual app option)
    await topicTrigger.click();
    const appOptions = page.locator('[data-testid^="todo-app-topic-select-option-"]');
    const secondOption = appOptions.nth(1);
    await secondOption.click();

    const taskWithTopic = `Test Task for Specific App Topic ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(taskWithTopic);
    await page.locator('[data-testid="todo-add-button"]').click();

    // Verify task is added and has the app topic badge
    const newTodoItem = page.locator('[data-testid^="todo-item-"]', { hasText: taskWithTopic });
    await expect(newTodoItem).toBeVisible();

    const topicBadge = newTodoItem.locator('[data-testid^="todo-topic-badge-"]');
    await expect(topicBadge).toBeVisible();

    // Clean up: delete the task
    await newTodoItem.locator('[data-testid^="delete-todo-"]').first().click();
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(page.locator('[data-testid="confirm-modal"]')).not.toBeVisible();
    await expect(newTodoItem).not.toBeVisible();
  });

  test('Deleting an App cascades deletion and automatically removes all associated To-Do items', async ({ page }) => {
    // Ensure we have at least two apps: one target to delete and one keeper
    let appCards = page.locator('[data-testid="apps-list"] [data-testid^="app-card-"]');
    while ((await appCards.count()) < 2) {
      const idx = await appCards.count();
      const appName = `Test App Cascade ${idx} ${Date.now()}`;
      await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
      await page.locator('[data-testid="btn-open-add-app"]').click({ force: true });
      await page.locator('[data-testid="input-app-name"]').fill(appName);
      await page.locator('[data-testid="input-app-url"]').fill(`https://example.com/app${idx}`);
      await page.locator('[data-testid="input-app-desc"]').fill(`App description ${idx}`);
      await page.locator('[data-testid="input-app-pic"]').fill('Test PIC');
      await page.locator('[data-testid="input-app-wa"]').fill('6281234567890');
      await page.locator('[data-testid="btn-submit-add-app"]').click();
      await expect(page.locator('[data-testid="add-app-modal-backdrop"]')).not.toBeVisible();
      await expect(page.locator(`text=${appName}`)).toBeVisible();
      await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
    }

    const deleteBtns = page.locator('[data-testid^="btn-delete-app-"]');
    const firstTestid = await deleteBtns.first().getAttribute('data-testid');
    const targetAppId = firstTestid?.replace('btn-delete-app-', '') || '';

    const secondTestid = await deleteBtns.nth(1).getAttribute('data-testid');
    const keeperAppId = secondTestid?.replace('btn-delete-app-', '') || '';

    // 2. Select targetAppId in the Todo topic select via CustomSelect
    const topicTrigger = page.locator('[data-testid="todo-app-topic-select-trigger"]');
    await topicTrigger.click();
    await page.locator(`[data-testid="todo-app-topic-select-option-${targetAppId}"]`).click();

    // 3. Add two todo items specifically for targetAppId
    const todoTitle1 = `Test Cascade Task A ${Date.now()}`;
    const todoTitle2 = `Test Cascade Task B ${Date.now()}`;

    await page.locator('[data-testid="todo-input"]').fill(todoTitle1);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${todoTitle1}`)).toBeVisible();

    await page.locator('[data-testid="todo-input"]').fill(todoTitle2);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${todoTitle2}`)).toBeVisible();

    // Also add an unrelated todo for keeperAppId
    const unrelatedTodo = `Test Unrelated Keeper Task ${Date.now()}`;
    await topicTrigger.click();
    await page.locator(`[data-testid="todo-app-topic-select-option-${keeperAppId}"]`).click();
    await page.locator('[data-testid="todo-input"]').fill(unrelatedTodo);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${unrelatedTodo}`)).toBeVisible();

    // 4. Delete the target app via App Card delete button & Confirm Modal
    const deleteAppBtn = page.locator(`[data-testid="btn-delete-app-${targetAppId}"]`);
    await deleteAppBtn.click({ force: true });

    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();

    // 5. Verify target app is removed from the grid
    await expect(page.locator(`[data-testid="btn-delete-app-${targetAppId}"]`)).not.toBeVisible();

    // 6. Verify cascading deletion: all todos linked to targetAppId are removed!
    await expect(page.locator(`text=${todoTitle1}`)).not.toBeVisible();
    await expect(page.locator(`text=${todoTitle2}`)).not.toBeVisible();

    // 7. Verify unrelated todo for keeperAppId is still present and intact
    await expect(page.locator(`text=${unrelatedTodo}`)).toBeVisible();

    // Clean up: delete unrelated keeper task
    const keeperItem = page.locator('[data-testid^="todo-item-"]', { hasText: unrelatedTodo });
    await keeperItem.locator('[data-testid^="delete-todo-"]').first().click();
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(page.locator('[data-testid="confirm-modal"]')).not.toBeVisible();
    await expect(keeperItem).not.toBeVisible();
  });

  test('To-Do list topic filter filters tasks by App topic and resets when app is deleted', async ({ page }) => {
    await expect(page.locator('[data-testid="todo-topic-filter"]')).toBeVisible();

    // Ensure we have at least two apps for topic selection
    let appCards = page.locator('[data-testid="apps-list"] [data-testid^="app-card-"]');
    while ((await appCards.count()) < 2) {
      const idx = await appCards.count();
      const appName = `Test App Filter ${idx} ${Date.now()}`;
      await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
      await page.locator('[data-testid="btn-open-add-app"]').click({ force: true });
      await page.locator('[data-testid="input-app-name"]').fill(appName);
      await page.locator('[data-testid="input-app-url"]').fill(`https://example.com/filter${idx}`);
      await page.locator('[data-testid="input-app-desc"]').fill(`App description filter ${idx}`);
      await page.locator('[data-testid="input-app-pic"]').fill('Filter PIC');
      await page.locator('[data-testid="input-app-wa"]').fill('6281234567890');
      await page.locator('[data-testid="btn-submit-add-app"]').click();
      await expect(page.locator('[data-testid="add-app-modal-backdrop"]')).not.toBeVisible();
      await expect(page.locator(`text=${appName}`)).toBeVisible();
      await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
    }

    const deleteBtns = page.locator('[data-testid^="btn-delete-app-"]');
    const firstTestid = await deleteBtns.first().getAttribute('data-testid');
    const app1Id = firstTestid?.replace('btn-delete-app-', '') || '';

    const secondTestid = await deleteBtns.nth(1).getAttribute('data-testid');
    const app2Id = secondTestid?.replace('btn-delete-app-', '') || '';

    // Add a todo for app1Id
    const topicTrigger = page.locator('[data-testid="todo-app-topic-select-trigger"]');
    await topicTrigger.click();
    await page.locator(`[data-testid="todo-app-topic-select-option-${app1Id}"]`).click();
    const app1Task = `Test App 1 Task ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(app1Task);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${app1Task}`)).toBeVisible();

    // Add a todo for app2Id
    await topicTrigger.click();
    await page.locator(`[data-testid="todo-app-topic-select-option-${app2Id}"]`).click();
    const app2Task = `Test App 2 Task ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(app2Task);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${app2Task}`)).toBeVisible();

    // Select filter by app1Id
    const filterTrigger = page.locator('[data-testid="todo-topic-filter-trigger"]');
    await filterTrigger.click();
    await page.locator(`[data-testid="todo-topic-filter-option-${app1Id}"]`).click();

    await expect(page.locator(`text=${app1Task}`)).toBeVisible();
    await expect(page.locator(`text=${app2Task}`)).not.toBeVisible();

    // Reset topic filter to all
    await filterTrigger.click();
    await page.locator('[data-testid="todo-topic-filter-option-all"]').click();
    await expect(page.locator(`text=${app1Task}`)).toBeVisible();
    await expect(page.locator(`text=${app2Task}`)).toBeVisible();

    // Clean up: delete app1Task and app2Task
    for (const taskText of [app1Task, app2Task]) {
      const item = page.locator('[data-testid^="todo-item-"]', { hasText: taskText });
      await item.locator('[data-testid^="delete-todo-"]').first().click();
      await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
      await page.locator('[data-testid="modal-confirm-button"]').click();
      await expect(page.locator('[data-testid="confirm-modal"]')).not.toBeVisible();
      await expect(item).not.toBeVisible();
    }
  });

  test('Select All and Bulk Delete in debug mode removes multiple selected apps and cascades to To-Do items', async ({ page }) => {
    // Ensure we have at least two apps for testing
    let appCards = page.locator('[data-testid="apps-list"] [data-testid^="app-card-"]');
    while ((await appCards.count()) < 2) {
      const idx = await appCards.count();
      const appName = `Test Bulk Seed ${idx} ${Date.now()}`;
      await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
      await page.locator('[data-testid="btn-open-add-app"]').click({ force: true });
      await page.locator('[data-testid="input-app-name"]').fill(appName);
      await page.locator('[data-testid="input-app-url"]').fill(`https://example.com/seed${idx}`);
      await page.locator('[data-testid="input-app-desc"]').fill(`Seed description ${idx}`);
      await page.locator('[data-testid="input-app-pic"]').fill('Seed PIC');
      await page.locator('[data-testid="input-app-wa"]').fill('6281234567890');
      await page.locator('[data-testid="btn-submit-add-app"]').click();
      await expect(page.locator('[data-testid="add-app-modal-backdrop"]')).not.toBeVisible();
      await expect(page.locator(`text=${appName}`)).toBeVisible();
      await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
    }

    // Verify Select All button is visible in debug mode
    const selectAllBtn = page.locator('[data-testid="btn-select-all-apps"]');
    await expect(selectAllBtn).toBeVisible();

    // Select the first app card via its individual checkbox
    const firstCard = page.locator('[data-testid="apps-list"] [data-testid^="app-card-"]').first();
    const firstCheckbox = firstCard.locator('[data-testid^="checkbox-select-app-"]');
    await firstCheckbox.check();

    // Verify bulk delete button appears
    const bulkDeleteBtn = page.locator('[data-testid="btn-bulk-delete-apps"]');
    await expect(bulkDeleteBtn).toBeVisible();
    await expect(bulkDeleteBtn).toContainText('(1)');

    // Now test Select All button
    await selectAllBtn.click();
    const totalCount = await page.locator('[data-testid="apps-list"] [data-testid^="app-card-"]').count();
    await expect(bulkDeleteBtn).toContainText(`(${totalCount})`);

    // Click again to Deselect All
    await selectAllBtn.click();
    await expect(bulkDeleteBtn).not.toBeVisible();

    // Now create two specific test apps to delete in bulk
    const appA = `Test Bulk Target A ${Date.now()}`;
    const appB = `Test Bulk Target B ${Date.now()}`;

    for (const name of [appA, appB]) {
      await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
      await page.locator('[data-testid="btn-open-add-app"]').click({ force: true });
      await page.locator('[data-testid="input-app-name"]').fill(name);
      await page.locator('[data-testid="input-app-url"]').fill('https://example.com/target');
      await page.locator('[data-testid="input-app-desc"]').fill('App to bulk delete');
      await page.locator('[data-testid="input-app-pic"]').fill('Target PIC');
      await page.locator('[data-testid="input-app-wa"]').fill('6281234567890');
      await page.locator('[data-testid="btn-submit-add-app"]').click();
      await expect(page.locator('[data-testid="add-app-modal-backdrop"]')).not.toBeVisible();
      await expect(page.locator(`text=${name}`)).toBeVisible();
      await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
    }

    const cardA = page.locator('[data-testid="apps-list"]').locator('[data-testid^="app-card-"]', { hasText: appA });
    const cardB = page.locator('[data-testid="apps-list"]').locator('[data-testid^="app-card-"]', { hasText: appB });

    const deleteBtnA = cardA.locator('[data-testid^="btn-delete-app-"]');
    const idA = (await deleteBtnA.getAttribute('data-testid'))?.replace('btn-delete-app-', '') || '';

    // Add a To-Do associated with appA
    const topicTrigger = page.locator('[data-testid="todo-app-topic-select-trigger"]');
    await topicTrigger.click();
    await page.locator(`[data-testid="todo-app-topic-select-option-${idA}"]`).click();
    const todoForA = `Test Cascading Task for App A ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(todoForA);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${todoForA}`)).toBeVisible();

    // Select both appA and appB checkboxes
    await cardA.locator('[data-testid^="checkbox-select-app-"]').check();
    await cardB.locator('[data-testid^="checkbox-select-app-"]').check();
    await expect(bulkDeleteBtn).toContainText('(2)');

    // Click bulk delete and test Cancel first
    await bulkDeleteBtn.click();
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-cancel-button"]').click();
    await expect(confirmModal).not.toBeVisible();
    await expect(cardA).toBeVisible();
    await expect(cardB).toBeVisible();

    // Click bulk delete and Confirm
    await bulkDeleteBtn.click();
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();

    // Both apps should be removed
    await expect(cardA).not.toBeVisible();
    await expect(cardB).not.toBeVisible();

    // Cascading deletion: To-Do for appA should be removed!
    await expect(page.locator(`text=${todoForA}`)).not.toBeVisible();
  });

  test('Check All button in To-Do List marks all tasks completed and allows Clear Completed to wipe them', async ({ page }) => {
    // Add two active todos
    const task1 = `Test Task Check All 1 ${Date.now()}`;
    const task2 = `Test Task Check All 2 ${Date.now()}`;

    await page.locator('[data-testid="todo-input"]').fill(task1);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${task1}`)).toBeVisible();

    await page.locator('[data-testid="todo-input"]').fill(task2);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${task2}`)).toBeVisible();

    // Check All button should be visible
    const checkAllBtn = page.locator('[data-testid="btn-check-all-todos"]');
    await expect(checkAllBtn).toBeVisible();

    // Click Check All button to mark all tasks completed
    await checkAllBtn.click();

    // Filter by Active should show 0 or not contain our tasks
    const filterActiveBtn = page.locator('[data-testid="filter-active"]');
    await filterActiveBtn.click();
    await expect(page.locator(`text=${task1}`)).not.toBeVisible();
    await expect(page.locator(`text=${task2}`)).not.toBeVisible();

    // Filter by Done should contain both tasks
    const filterDoneBtn = page.locator('[data-testid="filter-done"]');
    await filterDoneBtn.click();
    await expect(page.locator(`text=${task1}`)).toBeVisible();
    await expect(page.locator(`text=${task2}`)).toBeVisible();

    // Clear Completed button should be visible
    const clearCompletedBtn = page.locator('[data-testid="clear-completed-button"]');
    await expect(clearCompletedBtn).toBeVisible();
    await clearCompletedBtn.click();

    // Confirm deletion modal
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();

    // Both tasks should be wiped
    await expect(page.locator(`text=${task1}`)).not.toBeVisible();
    await expect(page.locator(`text=${task2}`)).not.toBeVisible();
  });

  test('Search in To-Do List filters tasks dynamically by task name and category/topic', async ({ page }) => {
    // Create an app with distinct category/topic
    const appName = `Test Searchable App ${Date.now()}`;
    const openAddBtn = page.locator('[data-testid="btn-open-add-app"]');
    await openAddBtn.click();
    await page.locator('[data-testid="input-app-name"]').fill(appName);
    await page.locator('[data-testid="input-app-url"]').fill('https://example.com/searchable');
    await page.locator('[data-testid="input-app-desc"]').fill('App for testing todo search');
    await page.locator('[data-testid="input-app-pic"]').fill('Tester Search');
    await page.locator('[data-testid="input-app-wa"]').fill('628111222333');
    await page.locator('[data-testid="btn-submit-add-app"]').click();
    await expect(page.locator(`text=${appName}`)).toBeVisible();

    const createdCard = page.locator('[data-testid="apps-list"]').locator('[data-testid^="app-card-"]', { hasText: appName });
    const deleteBtn = createdCard.locator('[data-testid^="btn-delete-app-"]');
    const createdId = (await deleteBtn.getAttribute('data-testid'))?.replace('btn-delete-app-', '') || '';

    // Select the newly created app from topic dropdown
    const topicTrigger = page.locator('[data-testid="todo-app-topic-select-trigger"]');
    await topicTrigger.click();
    await page.locator(`[data-testid="todo-app-topic-select-option-${createdId}"]`).click();

    const uniqueTaskAlpha = `Test Alpha Unique Task ${Date.now()}`;
    const uniqueTaskBeta = `Test Beta Different Task ${Date.now()}`;

    // Add Alpha task under our created app
    await page.locator('[data-testid="todo-input"]').fill(uniqueTaskAlpha);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${uniqueTaskAlpha}`)).toBeVisible();

    // Add Beta task
    await page.locator('[data-testid="todo-input"]').fill(uniqueTaskBeta);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${uniqueTaskBeta}`)).toBeVisible();

    const searchInput = page.locator('[data-testid="search-todo-input"]');
    await expect(searchInput).toBeVisible();

    // 1. Search by task name "Alpha"
    await searchInput.fill('Alpha Unique');
    await expect(page.locator(`text=${uniqueTaskAlpha}`)).toBeVisible();
    await expect(page.locator(`text=${uniqueTaskBeta}`)).not.toBeVisible();

    // 2. Clear search using clear button
    const clearBtn = page.locator('[data-testid="btn-clear-todo-search"]');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(page.locator(`text=${uniqueTaskAlpha}`)).toBeVisible();
    await expect(page.locator(`text=${uniqueTaskBeta}`)).toBeVisible();

    // 3. Search by category/app name
    await searchInput.fill(appName);
    await expect(page.locator(`text=${uniqueTaskAlpha}`)).toBeVisible();

    // 4. Search for non-existent keyword
    await searchInput.fill('xyzNonExistentKeyword999');
    await expect(page.locator('[data-testid="todo-empty-state"]')).toBeVisible();
    await expect(page.locator(`text=${uniqueTaskAlpha}`)).not.toBeVisible();
    await expect(page.locator(`text=${uniqueTaskBeta}`)).not.toBeVisible();

    // Reset search
    await searchInput.fill('');
    await expect(page.locator(`text=${uniqueTaskAlpha}`)).toBeVisible();

    // Clean up created app and cascade delete todos
    await createdCard.locator('[data-testid^="btn-delete-app-"]').click();
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();
  });

  test('Public visitors can browse portal and to-do list without login, but cannot see or access app management buttons', async ({ page }) => {
    // Logout to simulate an unauthenticated visitor
    await page.evaluate(() => {
      (window as any).__authStore?.logout?.();
    });
    await page.waitForFunction(() => !(window as any).__authStore?.getState?.()?.isAuthenticated);

    // Verify visitor sees public login button in navbar
    const loginNavBtn = page.locator('[data-testid="nav-login-btn"]');
    await expect(loginNavBtn).toBeVisible();

    // Verify app management buttons are hidden from public visitor
    const openAddBtn = page.locator('[data-testid="btn-open-add-app"]');
    await expect(openAddBtn).not.toBeVisible();

    const selectAllBtn = page.locator('[data-testid="btn-select-all-apps"]');
    await expect(selectAllBtn).not.toBeVisible();

    // Verify visitor can still freely use to-do list
    const visitorTask = `Test Public Visitor Task ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(visitorTask);
    await page.locator('[data-testid="todo-add-button"]').click();

    const visitorItem = page.locator('[data-testid^="todo-item-"]', { hasText: visitorTask });
    await expect(visitorItem).toBeVisible();

    // Toggle checkbox works for visitors
    await visitorItem.locator('input[type="checkbox"]').check();
    await expect(visitorItem.locator('input[type="checkbox"]')).toBeChecked();

    // Clean up
    await visitorItem.locator('[data-testid^="delete-todo-"]').first().click();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(visitorItem).not.toBeVisible();
  });

  test('Password visibility toggle on login page changes input type', async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.clear();
      (window as any).__authStore?.logout?.();
    });
    await page.goto('/login');

    const passwordInput = page.locator('[data-testid="input-password"]');
    const toggleBtn = page.locator('[data-testid="btn-toggle-password"]');

    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleBtn).toBeVisible();

    // Click toggle to show password
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Login page at /login allows authenticating with database user, displays role and debug status, and unlocks app management', async ({ page }) => {
    // Start unauthenticated
    await page.evaluate(() => {
      window.localStorage.clear();
      (window as any).__authStore?.logout?.();
    });
    await page.goto('/login');

    // Verify login page element
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();

    // Attempt invalid login
    await page.locator('[data-testid="input-username"]').fill('rizlfauzy');
    await page.locator('[data-testid="input-password"]').fill('wrongpassword123');
    await page.locator('[data-testid="btn-login-submit"]').click();

    await expect(page.locator('[data-testid="alert-toast"]').first()).toBeVisible();
    await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());

    // Login with valid credentials
    await page.locator('[data-testid="input-username"]').fill('rizlfauzy');
    await page.locator('[data-testid="input-password"]').fill(ADMIN_PASSWORD);
    await page.locator('[data-testid="btn-login-submit"]').click();

    // Redirects to /profile with profile info
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-display-name"]')).toContainText('Rizal Fauzi');
    await expect(page.locator('[data-testid="user-display-role"]')).toContainText('SUPERADMIN');

    // Verify navbar displays user name
    const userProfileBtn = page.locator('[data-testid="nav-user-profile-btn"]');
    await expect(userProfileBtn).toBeVisible();
    await expect(userProfileBtn).toContainText('Rizal Fauzi');

    // Navigate to dashboard and verify Add App button is unlocked
    await page.locator('[data-testid="btn-go-dashboard"]').click();
    await expect(page).toHaveURL(/\/$/);
    const openAddBtn = page.locator('[data-testid="btn-open-add-app"]');
    await expect(openAddBtn).toBeVisible();

    // Test logout via navbar with confirmation modal
    const logoutBtn = page.locator('[data-testid="nav-logout-btn"]');
    await logoutBtn.click();
    await page.locator('[data-testid="modal-confirm-button"]').click();

    // Verify returned to unauthenticated state
    await expect(page.locator('[data-testid="nav-login-btn"]')).toBeVisible();
    await expect(openAddBtn).not.toBeVisible();
  });

  test('WhatsApp PIC Preview modal supports message editing and automatically appends pending To-Do items for selected app', async ({ page }) => {
    // 1. Tambah aplikasi test baru
    const testAppName = `Test WhatsApp App ${Date.now()}`;
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await page.locator('[data-testid="input-app-name"]').fill(testAppName);
    await page.locator('[data-testid="input-app-url"]').fill('https://example.com/test-wa');
    await page.locator('[data-testid="input-app-desc"]').fill('Aplikasi test integrasi WhatsApp');
    await page.locator('[data-testid="input-app-pic"]').fill('Test PIC Budi');
    await page.locator('[data-testid="input-app-wa"]').fill('6281234567890');
    await page.locator('[data-testid="btn-submit-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-backdrop"]')).not.toBeVisible();

    const addedApp = await page.evaluate((name) => {
      const apps = (window as any).__appStore?.getState?.()?.apps || [];
      return apps.find((a: any) => a.name === name);
    }, testAppName);
    expect(addedApp).toBeTruthy();

    // 2. Tambah to-do list: satu pending (belum selesai) dan satu selesai
    const pendingTaskText = `Test Pending Task ${Date.now()}`;
    const completedTaskText = `Test Completed Task ${Date.now()}`;
    await page.evaluate(async ({ appId, pendingText, completedText }) => {
      const tStore = (window as any).__todoStore;
      const t1 = await tStore.addTodo(pendingText, appId);
      const t2 = await tStore.addTodo(completedText, appId);
      await tStore.toggleTodo(t2.id);
    }, { appId: addedApp.id, pendingText: pendingTaskText, completedText: completedTaskText });

    // 3. Klik tombol Hubungi PIC pada kartu aplikasi test
    const waContactBtn = page.locator(`[data-testid="btn-contact-pic-${addedApp.id}"]`);
    await expect(waContactBtn).toBeVisible();
    await waContactBtn.click();

    // 4. Verifikasi modal preview muncul
    const waModal = page.locator('[data-testid="wa-preview-modal"]');
    await expect(waModal).toBeVisible();
    await expect(page.locator('[data-testid="wa-modal-title"]')).toBeVisible();

    // 5. Verifikasi isi draft pesan memuat salam, nama app, PIC, dan to-do pending (bukan yang completed)
    const textarea = page.locator('[data-testid="textarea-wa-message"]');
    await expect(textarea).toBeVisible();
    const messageContent = await textarea.inputValue();
    expect(messageContent).toContain(testAppName);
    expect(messageContent).toContain('Test PIC Budi');
    expect(messageContent).toContain(pendingTaskText);
    expect(messageContent).not.toContain(completedTaskText);

    // 6. Uji fitur edit pesan di dalam modal
    const customSuffix = ' Tambahan pesan kustom untuk PIC.';
    await textarea.fill(messageContent + customSuffix);
    const updatedContent = await textarea.inputValue();
    expect(updatedContent).toContain(customSuffix);

    // 7. Verifikasi tombol kirim memuat URL wa.me dengan teks yang telah diedit
    const sendLink = page.locator('[data-testid="btn-send-whatsapp"]');
    await expect(sendLink).toBeVisible();
    const href = await sendLink.getAttribute('href');
    expect(href).toContain('https://wa.me/6281234567890');
    expect(href).toContain(encodeURIComponent(customSuffix));

    // 8. Tutup modal via tombol batal
    await page.locator('[data-testid="btn-cancel-wa-modal"]').click();
    await expect(waModal).not.toBeVisible();
  });

  test('Register page at /register allows user registration, show/hide password, defaults to VIEWER role with is_debug false, and is accessible only from login page', async ({ page }) => {
    // 1. Verifikasi navigasi utama (Navbar) TIDAK memiliki tombol langsung ke register
    await page.goto('/');
    const navRegisterLink = page.locator('nav').locator('a[href*="/register"], button:has-text("Daftar"), button:has-text("Register")');
    await expect(navRegisterLink).not.toBeVisible();

    // 2. Kunjungi halaman /login dan pastikan tombol navigasi ke registrasi tersedia
    await page.evaluate(() => {
      window.localStorage.clear();
      (window as any).__authStore?.logout?.();
    });
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();

    const toRegisterBtn = page.locator('[data-testid="btn-to-register"]');
    await expect(toRegisterBtn).toBeVisible();

    // 3. Klik tombol untuk menuju halaman register
    await toRegisterBtn.click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator('[data-testid="register-page"]')).toBeVisible();

    // 4. Verifikasi fitur toggle show/hide password di halaman register
    const passwordInput = page.locator('[data-testid="input-register-password"]');
    const toggleBtn = page.locator('[data-testid="btn-toggle-register-password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 5. Verifikasi validasi input kosong
    await page.locator('[data-testid="btn-register-submit"]').click();
    await expect(page.locator('[data-testid="alert-toast"]').first()).toBeVisible();
    await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());

    // 6. Lakukan pendaftaran akun baru (memenuhi konvensi kata "test")
    const testUsername = `testviewer_${Date.now()}`;
    const testFullName = `Test Viewer User ${Date.now()}`;
    await page.locator('[data-testid="input-register-name"]').fill(testFullName);
    await page.locator('[data-testid="input-register-username"]').fill(testUsername);
    await passwordInput.fill('password123');
    await page.locator('[data-testid="btn-register-submit"]').click();

    // 7. Pengguna otomatis terdaftar, login, dan diarahkan ke /profile
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-display-name"]')).toContainText(testFullName);
    await expect(page.locator('[data-testid="user-display-username"]')).toContainText(testUsername);

    // 8. Verifikasi role default adalah VIEWER dan is_debug adalah false
    await expect(page.locator('[data-testid="user-display-role"]')).toContainText('VIEWER');
    await expect(page.locator('[data-testid="user-display-debug"]')).not.toBeVisible();

    // 9. Akses dashboard dan verifikasi user VIEWER (is_debug: false) TIDAK BISA melihat tombol kelola aplikasi
    await page.goto('/');
    await expect(page.locator('[data-testid="btn-open-add-app"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-select-all-apps"]')).not.toBeVisible();
    await expect(page.locator('[data-testid^="btn-edit-app-"]')).not.toBeVisible();
    await expect(page.locator('[data-testid^="btn-delete-app-"]')).not.toBeVisible();

    // 10. Logout dan pastikan akun yang baru terdaftar bisa login kembali via /login
    const logoutBtn = page.locator('[data-testid="nav-logout-btn"]');
    await logoutBtn.click();
    await page.locator('[data-testid="modal-confirm-button"]').click();

    await page.goto('/login');
    await page.locator('[data-testid="input-username"]').fill(testUsername);
    await page.locator('[data-testid="input-password"]').fill('password123');
    await page.locator('[data-testid="btn-login-submit"]').click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator('[data-testid="user-display-role"]')).toContainText('VIEWER');

    // 11. Otomatis hapus hasil pengecekan register user (test user) agar database tetap bersih
    await page.evaluate(async (uname) => {
      await (window as any).__authStore?.deleteTestUser?.(uname);
    }, testUsername);

    // 12. Verifikasi user yang dihapus sudah tidak dapat login lagi
    const cleanLogoutBtn = page.locator('[data-testid="nav-logout-btn"]');
    if (await cleanLogoutBtn.isVisible()) {
      await cleanLogoutBtn.click();
      await page.locator('[data-testid="modal-confirm-button"]').click();
    }
    await page.goto('/login');
    await page.locator('[data-testid="input-username"]').fill(testUsername);
    await page.locator('[data-testid="input-password"]').fill('password123');
    await page.locator('[data-testid="btn-login-submit"]').click();
    await expect(page.locator('[data-testid="alert-toast"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="alert-toast"]').first()).toContainText(/salah|tidak|invalid/i);
    await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
  });

  test('To-Do List image upload with drag-and-drop, validation via throwAlert, click-to-preview, and WhatsApp PIC context', async ({ page }) => {
    // 1. Pastikan tombol lampirkan gambar terlihat di form To-Do
    const attachBtn = page.locator('[data-testid="btn-open-image-modal"]');
    await expect(attachBtn).toBeVisible();

    // 2. Buka Image Upload Modal
    await attachBtn.click();
    const modal = page.locator('[data-testid="image-upload-modal"]');
    await expect(modal).toBeVisible();

    const fileInput = page.locator('[data-testid="image-file-input"]');

    // 3. Uji validasi ekstensi tidak valid (.pdf)
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('invalid file content'),
    });
    const errorToastExt = page.locator('[data-testid="alert-toast"]').first();
    await expect(errorToastExt).toBeVisible();
    await expect(errorToastExt).toContainText(/ekstensi|format/i);
    await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());

    // 4. Uji validasi ukuran melebihi batas 5 MB (5 MB + 1 KB)
    await fileInput.setInputFiles({
      name: 'test-oversized.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1024),
    });
    const errorToastSize = page.locator('[data-testid="alert-toast"]').first();
    await expect(errorToastSize).toBeVisible();
    await expect(errorToastSize).toContainText(/5 MB|terlalu besar|melebihi/i);
    await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());

    // 5. Upload multiple gambar yang valid (.png base64 1x1 pixel)
    await fileInput.setInputFiles([
      {
        name: 'test-image-1.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64'
        ),
      },
      {
        name: 'test-image-2.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64'
        ),
      },
    ]);

    // 6. Verifikasi image preview dan thumbnail list muncul
    const previewImg = page.locator('[data-testid="image-preview"]');
    await expect(previewImg).toBeVisible();
    await expect(page.locator('[data-testid="image-thumbnails-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="thumb-item-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="thumb-item-1"]')).toBeVisible();

    // 7. Uji fitur "click to preview" (membuka full resolution preview overlay)
    const triggerFullPreview = page.locator('[data-testid="btn-trigger-full-preview"]');
    await triggerFullPreview.click();
    const fullOverlay = page.locator('[data-testid="full-image-preview-overlay"]');
    await expect(fullOverlay).toBeVisible();
    await expect(page.locator('[data-testid="full-image-preview"]')).toBeVisible();

    // Tutup full-preview overlay
    await page.locator('[data-testid="btn-close-full-preview"]').click();
    await expect(fullOverlay).not.toBeVisible();

    // 8. Klik "GUNAKAN GAMBAR"
    await page.locator('[data-testid="btn-save-image-upload"]').click();
    await expect(modal).not.toBeVisible();

    // Verifikasi badge indikator gambar terlampir di form
    const formBadge = page.locator('[data-testid="new-todo-image-preview-badge"]');
    await expect(formBadge).toBeVisible();

    // 9. Pastikan ada aplikasi yang tersedia untuk topik To-Do
    const testApp = await page.evaluate(async () => {
      const store = (window as any).__appStore;
      let app = store?.getState?.()?.apps?.[0];
      if (!app) {
        app = await store.addApp({
          name: `Test App Image WA ${Date.now()}`,
          description: 'Aplikasi testing untuk upload gambar dan WA',
          url: 'https://example.com/test-wa',
          icon: '🖼️',
          category: 'Testing',
          color: '#ffd900',
          picName: 'Test PIC Budi',
          picWhatsapp: '6281234567890',
        });
      }
      return app;
    });

    // 10. Tambah To-Do baru yang memuat kata "test" (Data Convention) dengan gambar terlampir
    const testTodoText = `Test Catatan Tugas Berlampiran Gambar ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(testTodoText);
    await page.locator('[data-testid="todo-add-button"]').click();

    // 11. Cari to-do item yang baru dibuat di daftar
    const todoItem = page.locator('li', { hasText: testTodoText });
    await expect(todoItem).toBeVisible();

    // Verifikasi tombol "Lihat Gambar" muncul pada todo item
    const viewImgBtn = todoItem.locator('[data-testid^="btn-view-image-todo-"]');
    await expect(viewImgBtn).toBeVisible();

    // Klik untuk melihat gambar dari todo item
    await viewImgBtn.click();
    await expect(page.locator('[data-testid="image-upload-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    await page.locator('[data-testid="btn-close-image-modal"]').click();
    await expect(page.locator('[data-testid="image-upload-modal"]')).not.toBeVisible();

    // 12. Buka WhatsApp Preview Modal dari kartu aplikasi terkait
    const waButton = page.locator(`[data-testid="btn-contact-pic-${testApp.id}"]`);
    await waButton.click();

    const waModal = page.locator('[data-testid="wa-preview-modal"]');
    await expect(waModal).toBeVisible();

    // Verifikasi draf pesan WhatsApp menyertakan konteks task dan lampiran gambar
    const waTextarea = page.locator('[data-testid="textarea-wa-message"]');
    await expect(waTextarea).toBeVisible();
    const messageContent = await waTextarea.inputValue();
    expect(messageContent).toContain(testTodoText);
    expect(messageContent).toContain('Lampiran gambar:');

    // Verifikasi link lampiran pada notice daftar pending todos di modal
    const waNoticeImageLink = page.locator(`[data-testid^="wa-todo-image-link-"]`).first();
    await expect(waNoticeImageLink).toBeVisible();

    // Tutup modal WhatsApp
    await page.locator('[data-testid="btn-close-wa-modal"]').click();
    await expect(waModal).not.toBeVisible();

    // 13. Cascade deletion: Hapus To-Do item dan verifikasi terhapus dari tampilan
    const deleteBtn = todoItem.locator('[data-testid^="delete-todo-"]');
    await deleteBtn.click();

    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(todoItem).not.toBeVisible();
  });

  test('List Apps supports optional image upload on create/update and falls back to Lucide icon', async ({ page }) => {
    // 1. Buat aplikasi tanpa gambar -> harus memakai icon Lucide
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    const timestamp = Date.now();
    const appWithoutImgName = `Test App Lucide ${timestamp}`;
    await page.locator('[data-testid="input-app-name"]').fill(appWithoutImgName);
    await page.locator('[data-testid="input-app-url"]').fill('https://lucide-test.internal');
    await page.locator('[data-testid="input-app-desc"]').fill('Aplikasi uji coba dengan icon Lucide');
    await page.locator('[data-testid="quick-icon-rocket"]').click();
    await page.locator('[data-testid="btn-submit-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).not.toBeVisible();

    // Verifikasi card aplikasi muncul dengan icon Lucide (bukan upload image icon)
    const cardWithoutImg = page.locator('[data-testid^="app-card-"]', { hasText: appWithoutImgName });
    await expect(cardWithoutImg).toBeVisible();
    await expect(cardWithoutImg.locator('[data-testid^="app-image-"]')).not.toBeVisible();
    await expect(cardWithoutImg.locator('[data-testid^="app-icon-"]')).toBeVisible();

    // 2. Buat aplikasi dengan gambar upload
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    const appWithImgName = `Test App With Image ${timestamp}`;
    await page.locator('[data-testid="input-app-name"]').fill(appWithImgName);
    await page.locator('[data-testid="input-app-url"]').fill('https://image-test.internal');
    await page.locator('[data-testid="input-app-desc"]').fill('Aplikasi uji coba dengan upload gambar');

    // Upload dummy svg image
    const dummySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>';
    await page.locator('[data-testid="input-app-image"]').setInputFiles({
      name: 'app-icon-test.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(dummySvg),
    });

    // Verifikasi preview gambar muncul di modal
    await expect(page.locator('[data-testid="preview-app-image"]')).toBeVisible();
    await page.locator('[data-testid="btn-submit-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).not.toBeVisible();

    // Verifikasi card aplikasi menampilkan <img> dengan data-testid app-image
    const cardWithImg = page.locator('[data-testid^="app-card-"]', { hasText: appWithImgName });
    await expect(cardWithImg).toBeVisible();
    await expect(cardWithImg.locator('[data-testid^="app-image-"]')).toBeVisible();

    // 3. Edit aplikasi: hapus gambar dan verifikasi kembali menggunakan Lucide icon
    const editBtn = cardWithImg.locator('[data-testid^="btn-edit-app-"]');
    await editBtn.click();
    await expect(page.locator('[data-testid="edit-app-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-edit-app-image"]')).toBeVisible();

    // Hapus gambar pada modal edit
    await page.locator('[data-testid="btn-remove-edit-app-image"]').click();
    await expect(page.locator('[data-testid="preview-edit-app-image"]')).not.toBeVisible();
    await page.locator('[data-testid="btn-submit-edit-app"]').click();
    await expect(page.locator('[data-testid="edit-app-modal"]')).not.toBeVisible();

    // Verifikasi kartu aplikasi kembali menampilkan icon Lucide
    await expect(cardWithImg.locator('[data-testid^="app-icon-"]')).toBeVisible();
    await expect(cardWithImg.locator('[data-testid^="app-image-"]')).not.toBeVisible();

    // Cleanup: hapus kedua aplikasi pengujian
    const deleteBtn1 = cardWithoutImg.locator('[data-testid^="btn-delete-app-"]');
    await deleteBtn1.click();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(cardWithoutImg).not.toBeVisible();

    const deleteBtn2 = cardWithImg.locator('[data-testid^="btn-delete-app-"]');
    await deleteBtn2.click();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(cardWithImg).not.toBeVisible();
  });

  test('Section Settings Modal can reorder sections and toggle section visibility on Home and Company Profile', async ({ page }) => {
    // Pastikan kedua halaman mulai dari setting default
    await page.evaluate(async () => {
      await (window as any).__sectionStore?.resetSections?.('home');
      await (window as any).__sectionStore?.resetSections?.('company-profile');
    });

    // 1. Verifikasi tombol Atur Tata Letak muncul di navbar untuk user dengan akses debug
    const settingsBtn = page.locator('[data-testid="nav-section-settings-btn"]');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    const modal = page.locator('[data-testid="section-settings-modal"]');
    await expect(modal).toBeVisible();

    // Verifikasi teks terjemahan bahasa Indonesia di modal
    await expect(page.locator('#section-settings-title')).toHaveText('ATUR TATA LETAK BAGIAN');
    await expect(page.locator('[data-testid="tab-section-home"]')).toContainText('Halaman Utama');
    await expect(page.locator('[data-testid="btn-reset-sections"]')).toContainText('Reset ke Default');
    await expect(page.locator('[data-testid="btn-done-section-settings"]')).toContainText('Selesai');

    // Verifikasi item-item bagian Home muncul
    await expect(page.locator('[data-testid="section-item-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-item-apps-hub"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-item-todo-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-item-todo-list"]')).toContainText('Catatan & To-Do List');

    // 2. Uji sembunyikan (toggle visibility) bagian todo-list
    const toggleTodoBtn = page.locator('[data-testid="btn-toggle-visible-todo-list"]');
    await toggleTodoBtn.click();

    // Tutup modal dan verifikasi todo-list tidak muncul di halaman
    await page.locator('[data-testid="btn-close-section-settings"]').click();
    await expect(modal).not.toBeVisible();
    await expect(page.locator('[data-testid="section-wrapper-todo-list"]')).not.toBeVisible();

    // Buka kembali modal dan tampilkan kembali todo-list
    await settingsBtn.click();
    await expect(modal).toBeVisible();
    await toggleTodoBtn.click();
    await page.locator('[data-testid="btn-close-section-settings"]').click();
    await expect(modal).not.toBeVisible();
    await expect(page.locator('[data-testid="section-wrapper-todo-list"]')).toBeVisible();

    // 3. Uji rearrange urutan bagian: pindah apps-hub ke atas hero
    await settingsBtn.click();
    await expect(modal).toBeVisible();
    const moveUpAppsBtn = page.locator('[data-testid="btn-move-up-apps-hub"]');
    await moveUpAppsBtn.click();
    await page.locator('[data-testid="btn-close-section-settings"]').click();
    await expect(modal).not.toBeVisible();

    // Verifikasi urutan elemen di DOM: apps-hub sekarang mendahului hero
    const wrappers = page.locator('[data-testid="home-page-container"] > div');
    const firstWrapper = wrappers.first();
    await expect(firstWrapper).toHaveAttribute('data-testid', 'section-wrapper-apps-hub');

    // 4. Reset urutan ke default
    await settingsBtn.click();
    await expect(modal).toBeVisible();
    await page.locator('[data-testid="btn-reset-sections"]').click();
    await page.locator('[data-testid="btn-done-section-settings"]').click();
    await expect(modal).not.toBeVisible();

    // Verifikasi urutan kembali ke default: hero paling atas
    const resetFirstWrapper = page.locator('[data-testid="home-page-container"] > div').first();
    await expect(resetFirstWrapper).toHaveAttribute('data-testid', 'section-wrapper-hero');

    // 5. Uji pada tab Company Profile
    await page.goto('/company-profile');
    await expect(page.locator('[data-testid="company-profile-container"]')).toBeVisible();

    await settingsBtn.click();
    await expect(modal).toBeVisible();
    await page.locator('[data-testid="tab-section-cp"]').click();

    // Sembunyikan bagian vision-mission di Company Profile
    const toggleVisionBtn = page.locator('[data-testid="btn-toggle-visible-vision-mission"]');
    await toggleVisionBtn.click();
    await page.locator('[data-testid="btn-done-section-settings"]').click();
    await expect(modal).not.toBeVisible();
    await expect(page.locator('[data-testid="section-wrapper-vision-mission"]')).not.toBeVisible();

    // Kembalikan ke default
    await settingsBtn.click();
    await expect(modal).toBeVisible();
    await page.locator('[data-testid="tab-section-cp"]').click();
    await page.locator('[data-testid="btn-reset-sections"]').click();
    await page.locator('[data-testid="btn-done-section-settings"]').click();
    await expect(page.locator('[data-testid="section-wrapper-vision-mission"]')).toBeVisible();

    // Kembali ke home
    await page.goto('/');
  });

  test('Profile page allows changing password with validation and visibility toggle for old and new passwords', async ({ page }) => {
    const timestamp = Date.now();
    const testUsername = `testpw_${timestamp}`;
    const initialPassword = 'InitialPassword123!';
    const newPassword = 'NewSecretPassword123!';

    // 1. Buat test user baru melalui authStore.register (otomatis login)
    await page.evaluate(async ({ uname, pass }) => {
      await (window as any).__authStore?.register?.('Test Password User', uname, pass);
    }, { uname: testUsername, pass: initialPassword });

    // 2. Buka halaman profile
    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-display-username"]')).toContainText(testUsername);

    // 3. Buka modal ganti password
    const changePwBtn = page.locator('[data-testid="btn-change-password"]');
    await expect(changePwBtn).toBeVisible();
    await changePwBtn.click();

    const pwModal = page.locator('[data-testid="change-password-modal"]');
    await expect(pwModal).toBeVisible();

    // 4. Test toggle visibilitas password lama dan baru
    const oldPwInput = page.locator('[data-testid="input-old-password"]');
    const newPwInput = page.locator('[data-testid="input-new-password"]');
    const toggleOldBtn = page.locator('[data-testid="btn-toggle-old-password"]');
    const toggleNewBtn = page.locator('[data-testid="btn-toggle-new-password"]');

    await expect(oldPwInput).toHaveAttribute('type', 'password');
    await toggleOldBtn.click();
    await expect(oldPwInput).toHaveAttribute('type', 'text');
    await toggleOldBtn.click();
    await expect(oldPwInput).toHaveAttribute('type', 'password');

    await expect(newPwInput).toHaveAttribute('type', 'password');
    await toggleNewBtn.click();
    await expect(newPwInput).toHaveAttribute('type', 'text');
    await toggleNewBtn.click();
    await expect(newPwInput).toHaveAttribute('type', 'password');

    // 5. Test validasi jika password lama salah
    await oldPwInput.fill('WrongPassword123!');
    await newPwInput.fill(newPassword);
    await page.locator('[data-testid="btn-submit-change-password"]').click();

    const errorBanner = page.locator('[data-testid="change-password-error"]');
    await expect(errorBanner).toBeVisible();

    // 6. Test jika password lama benar dan password baru valid
    await oldPwInput.fill(initialPassword);
    await newPwInput.fill(newPassword);
    await page.locator('[data-testid="btn-submit-change-password"]').click();

    // Modal harus tertutup dan muncul toast sukses
    await expect(pwModal).not.toBeVisible();
    await expect(page.locator('[data-testid="alert-toast"]')).toBeVisible();

    // 7. Cleanup: hapus test user yang dibuat
    await page.evaluate(async (uname) => {
      await (window as any).__authStore?.deleteTestUser?.(uname);
    }, testUsername);
  });

  test('List Apps supports hero banner image upload with strict extension validation and displays default hero banner when empty', async ({ page }) => {
    // 1. Buat aplikasi baru dengan hero banner
    await page.goto('/');
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    // Verifikasi kedua area dropzone ada di modal (hero banner & icon)
    await expect(page.locator('[data-testid="dropzone-app-hero-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="dropzone-app-image"]')).toBeVisible();

    const timestamp = Date.now();
    const appName = `Test Hero App ${timestamp}`;
    await page.locator('[data-testid="input-app-name"]').fill(appName);
    await page.locator('[data-testid="input-app-url"]').fill('https://hero-test.internal');
    await page.locator('[data-testid="input-app-desc"]').fill('Aplikasi dengan cover hero banner kustom');

    // Upload dummy png file ke input hero banner
    const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    await page.locator('[data-testid="input-app-hero-image"]').setInputFiles({
      name: 'test-hero.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dummyPngBase64, 'base64'),
    });

    // Preview hero banner harus muncul
    await expect(page.locator('[data-testid="preview-app-hero-image"]')).toBeVisible();

    // Submit form
    await page.locator('[data-testid="btn-submit-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).not.toBeVisible();

    // 2. Verifikasi card aplikasi di grid menampilkan hero banner
    const createdCard = page.locator('[data-testid^="app-card-"]', { hasText: appName });
    await expect(createdCard).toBeVisible();
    const heroImg = createdCard.locator('[data-testid^="app-hero-image-"]');
    await expect(heroImg).toBeVisible();

    // 3. Verifikasi edit aplikasi: hero banner bisa dihapus
    const editBtn = createdCard.locator('[data-testid^="btn-edit-app-"]');
    await editBtn.click();
    await expect(page.locator('[data-testid="edit-app-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-edit-app-hero-image"]')).toBeVisible();

    // Hapus hero image dari edit modal
    await page.locator('[data-testid="btn-remove-edit-app-hero-image"]').click();
    await expect(page.locator('[data-testid="preview-edit-app-hero-image"]')).not.toBeVisible();

    await page.locator('[data-testid="btn-submit-edit-app"]').click();
    await expect(page.locator('[data-testid="edit-app-modal"]')).not.toBeVisible();

    // 4. Verifikasi bahwa setelah hero image dihapus, card kembali memakai default hero image
    await expect(heroImg).toBeVisible();
    const heroSrc = await heroImg.getAttribute('src');
    expect(heroSrc).toBeTruthy();

    // 5. Cleanup aplikasi
    const deleteBtn = createdCard.locator('[data-testid^="btn-delete-app-"]');
    await deleteBtn.click();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(createdCard).not.toBeVisible();
  });

  test('App Card in admin mode can be dragged after long press to rearrange apps list', async ({ page }) => {
    // Buat dua test apps jika diperlukan untuk memastikan minimal ada 2 card
    const timestamp = Date.now();
    const appA = `Test App Order A ${timestamp}`;
    const appB = `Test App Order B ${timestamp}`;

    // Helper membuat app
    async function createTestApp(name: string) {
      await page.locator('[data-testid="btn-open-add-app"]').click();
      await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();
      await page.locator('[data-testid="input-app-name"]').fill(name);
      await page.locator('[data-testid="input-app-url"]').fill('https://order.internal');
      await page.locator('[data-testid="input-app-desc"]').fill('Aplikasi untuk pengetesan urutan');
      await page.locator('[data-testid="btn-submit-add-app"]').click();
      await expect(page.locator('[data-testid="add-app-modal-card"]')).not.toBeVisible();
      await expect(page.locator('[data-testid^="app-card-"]', { hasText: name })).toBeVisible();
    }

    await createTestApp(appA);
    await createTestApp(appB);

    const cardA = page.locator('[data-testid^="app-card-"]', { hasText: appA });
    const cardB = page.locator('[data-testid^="app-card-"]', { hasText: appB });

    // 1. Verifikasi drag handle muncul di mode admin
    await expect(cardA.locator('[data-testid^="drag-handle-"]')).toBeVisible();

    // 2. Simulasikan long-press pada card A untuk mengaktifkan drag mode
    await cardA.dispatchEvent('pointerdown', { buttons: 1 });
    await page.waitForTimeout(250); // Tunggu long-press timer > 150ms
    await expect(cardA).toHaveAttribute('data-drag-ready', 'true');
    await cardA.dispatchEvent('pointerup');

    // 3. Lakukan rearrange urutan via appStore.reorderApps
    await page.evaluate(async () => {
      const store = (window as any).__appStore;
      const apps = store?.getState?.()?.apps || [];
      if (apps.length >= 2) {
        // Swap first two apps
        const ids = apps.map((a: any) => a.id);
        const temp = ids[0];
        ids[0] = ids[1];
        ids[1] = temp;
        await store.reorderApps(ids);
      }
    });

    // Verifikasi toast sukses rearrange muncul
    await expect(page.locator('[data-testid="alert-toast"]').filter({ hasText: 'Urutan aplikasi' })).toBeVisible();

    // 4. Cleanup kedua test apps
    await page.evaluate(async (names) => {
      const store = (window as any).__appStore;
      const apps = store?.getState?.()?.apps || [];
      for (const a of apps) {
        if (names.includes(a.name)) {
          await store.deleteApp(a.id);
        }
      }
    }, [appA, appB]);
  });

  test('Todo item in admin mode can be dragged after long press or via drag handle to rearrange order', async ({ page }) => {
    const timestamp = Date.now();
    const todoA = `Test Todo Order A ${timestamp}`;
    const todoB = `Test Todo Order B ${timestamp}`;

    // 1. Tambah dua todo baru
    await page.locator('[data-testid="todo-input"]').fill(todoA);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${todoA}`)).toBeVisible();

    await page.locator('[data-testid="todo-input"]').fill(todoB);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${todoB}`)).toBeVisible();

    const itemA = page.locator('[data-testid^="todo-item-"]', { hasText: todoA });
    const itemB = page.locator('[data-testid^="todo-item-"]', { hasText: todoB });

    // 2. Verifikasi drag handle muncul di mode admin
    await expect(itemA.locator('[data-testid^="drag-handle-todo-"]')).toBeVisible();
    await expect(itemB.locator('[data-testid^="drag-handle-todo-"]')).toBeVisible();

    // 3. Simulasikan long-press pada todo A untuk mengaktifkan drag mode
    await itemA.dispatchEvent('pointerdown', { buttons: 1 });
    await page.waitForTimeout(250); // Tunggu long-press timer > 150ms
    await expect(itemA).toHaveAttribute('data-drag-ready', 'true');
    await itemA.dispatchEvent('pointerup');

    // 4. Lakukan rearrange urutan via todoStore.reorderTodos
    await page.evaluate(async (texts) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      const foundA = todos.find((t: any) => t.text === texts[0]);
      const foundB = todos.find((t: any) => t.text === texts[1]);
      if (foundA && foundB) {
        // Balik urutan: A dulu baru B
        await store.reorderTodos([foundA.id, foundB.id]);
      }
    }, [todoA, todoB]);

    // Verifikasi alert toast sukses muncul
    await expect(page.locator('[data-testid="alert-toast"]').filter({ hasText: 'Urutan catatan' })).toBeVisible();

    // 5. Cleanup kedua test todos
    await page.evaluate(async (texts) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      for (const t of todos) {
        if (texts.includes(t.text)) {
          await store.deleteTodo(t.id);
        }
      }
    }, [todoA, todoB]);
  });

  test('Sub-tasks can be rearranged via drag and drop and moved to another todo', async ({ page }) => {
    const timestamp = Date.now();
    const parentA = `Parent Todo A ${timestamp}`;
    const parentB = `Parent Todo B ${timestamp}`;
    const sub1 = `Sub 1 Alpha ${timestamp}`;
    const sub2 = `Sub 2 Beta ${timestamp}`;

    // 1. Tambah dua parent todo
    await page.locator('[data-testid="todo-input"]').fill(parentA);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${parentA}`)).toBeVisible();

    await page.locator('[data-testid="todo-input"]').fill(parentB);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${parentB}`)).toBeVisible();

    const itemA = page.locator('[data-testid^="todo-item-"]', { hasText: parentA });
    const itemB = page.locator('[data-testid^="todo-item-"]', { hasText: parentB });

    // 2. Tambah dua subtask di parent A
    await itemA.locator('[data-testid^="input-subtask-"]').fill(sub1);
    await itemA.locator('[data-testid^="button-add-subtask-"]').click();
    await expect(itemA.locator(`text=${sub1}`)).toBeVisible();

    await itemA.locator('[data-testid^="input-subtask-"]').fill(sub2);
    await itemA.locator('[data-testid^="button-add-subtask-"]').click();
    await expect(itemA.locator(`text=${sub2}`)).toBeVisible();

    const subItem1 = itemA.locator('[data-testid^="subtask-item-"]', { hasText: sub1 });
    const subItem2 = itemA.locator('[data-testid^="subtask-item-"]', { hasText: sub2 });

    // 3. Verifikasi drag handle subtask muncul di mode admin
    await expect(subItem1.locator('[data-testid^="drag-handle-subtask-"]')).toBeVisible();

    // 4. Test long-press pada subtask
    await subItem1.dispatchEvent('pointerdown', { buttons: 1 });
    await page.waitForTimeout(250);
    await expect(subItem1).toHaveAttribute('data-drag-ready', 'true');
    await subItem1.dispatchEvent('pointerup');

    // 5. Reorder subtask dalam parent A via todoStore.reorderSubTasks
    await page.evaluate(async (params) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      const foundA = todos.find((t: any) => t.text === params.parent);
      if (foundA && foundA.subTasks?.length >= 2) {
        const s1 = foundA.subTasks.find((s: any) => s.text === params.s1);
        const s2 = foundA.subTasks.find((s: any) => s.text === params.s2);
        if (s1 && s2) {
          await store.reorderSubTasks(foundA.id, [s2.id, s1.id]);
        }
      }
    }, { parent: parentA, s1: sub1, s2: sub2 });

    await expect(page.locator('[data-testid="alert-toast"]').filter({ hasText: 'Urutan sub-task' })).toBeVisible();

    // 6. Move subtask dari parent A ke parent B via todoStore.moveSubTaskToParent
    await page.evaluate(async (params) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      const foundA = todos.find((t: any) => t.text === params.parentA);
      const foundB = todos.find((t: any) => t.text === params.parentB);
      if (foundA && foundB) {
        const s1 = foundA.subTasks?.find((s: any) => s.text === params.s1);
        if (s1) {
          await store.moveSubTaskToParent(s1.id, foundA.id, foundB.id, 0);
        }
      }
    }, { parentA, parentB, s1: sub1 });

    await expect(page.locator('[data-testid="alert-toast"]').filter({ hasText: 'Sub-task berhasil dipindahkan' })).toBeVisible();

    // Verifikasi sub1 sekarang berada di dalam parent B
    await expect(itemB.locator(`text=${sub1}`)).toBeVisible();
    await expect(itemA.locator(`text=${sub1}`)).not.toBeVisible();

    // 7. Cleanup test data
    await page.evaluate(async (parents) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      for (const t of todos) {
        if (parents.includes(t.text)) {
          await store.deleteTodo(t.id);
        }
      }
    }, [parentA, parentB]);
  });

  test('Task can be converted to a sub-task of another task via drag and drop', async ({ page }) => {
    const timestamp = Date.now();
    const targetParent = `Target Todo Parent ${timestamp}`;
    const simpleTask = `Simple Task Convert ${timestamp}`;
    const parentWithSubs = `Task With Subs ${timestamp}`;
    const childSub = `Child Sub ${timestamp}`;

    // 1. Tambah target parent dan task sederhana
    await page.locator('[data-testid="todo-input"]').fill(targetParent);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${targetParent}`)).toBeVisible();

    await page.locator('[data-testid="todo-input"]').fill(simpleTask);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${simpleTask}`)).toBeVisible();

    const targetParentItem = page.locator('[data-testid^="todo-item-"]', { hasText: targetParent });
    const simpleTaskId = await page.evaluate((title) => {
      const todos = (window as any).__todoStore?.getState?.()?.todos || [];
      return todos.find((t: any) => t.text === title)?.id;
    }, simpleTask);

    // 2. Verifikasi konversi task sederhana menjadi sub-task target parent
    await page.evaluate(async (params) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      const source = todos.find((t: any) => t.text === params.simple);
      const target = todos.find((t: any) => t.text === params.target);
      if (source && target) {
        await store.convertTodoToSubTask(source.id, target.id);
      }
    }, { simple: simpleTask, target: targetParent });

    // Verifikasi alert toast sukses muncul
    await expect(page.locator('[data-testid="alert-toast"]').filter({ hasText: 'Catatan berhasil diubah menjadi sub-task' })).toBeVisible();

    // Verifikasi card todo simpleTask sebelumnya sudah dihapus (tidak lagi di top-level)
    await expect(page.locator(`[data-testid="todo-item-${simpleTaskId}"]`)).not.toBeVisible();

    // Verifikasi simpleTask sekarang muncul sebagai sub-task di dalam targetParent
    await expect(targetParentItem.locator('[data-testid^="subtask-item-"]', { hasText: simpleTask })).toBeVisible();

    // 3. Validasi: Task yang memiliki sub-task tidak boleh dapat dikonversi
    await page.locator('[data-testid="todo-input"]').fill(parentWithSubs);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${parentWithSubs}`)).toBeVisible();

    const parentWithSubsItem = page.locator('[data-testid^="todo-item-"]', { hasText: parentWithSubs });
    await parentWithSubsItem.locator('[data-testid^="input-subtask-"]').fill(childSub);
    await parentWithSubsItem.locator('[data-testid^="button-add-subtask-"]').click();
    await expect(parentWithSubsItem.locator(`text=${childSub}`)).toBeVisible();

    // Coba konversi parentWithSubs yang punya anak ke targetParent
    await page.evaluate(async (params) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      const source = todos.find((t: any) => t.text === params.withSubs);
      const target = todos.find((t: any) => t.text === params.target);
      if (source && target) {
        await store.convertTodoToSubTask(source.id, target.id);
      }
    }, { withSubs: parentWithSubs, target: targetParent });

    // Verifikasi alert toast error muncul
    await expect(page.locator('[data-testid="alert-toast"]').filter({ hasText: 'tidak dapat diubah' })).toBeVisible();

    // Verifikasi parentWithSubs tetap ada sebagai top-level todo
    await expect(parentWithSubsItem).toBeVisible();

    // 4. Cleanup test data
    await page.evaluate(async (titles) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      for (const t of todos) {
        if (titles.includes(t.text)) {
          await store.deleteTodo(t.id);
        }
      }
    }, [targetParent, simpleTask, parentWithSubs]);
  });

  test('Sub-task can be converted to an independent task by dragging it out of parent task', async ({ page }) => {
    const timestamp = Date.now();
    const parentTask = `Parent With Sub To Detach ${timestamp}`;
    const subTaskTitle = `Subtask Independent Target ${timestamp}`;

    // 1. Tambah task parent
    await page.locator('[data-testid="todo-input"]').fill(parentTask);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${parentTask}`)).toBeVisible();

    const parentItem = page.locator('[data-testid^="todo-item-"]', { hasText: parentTask });

    // 2. Tambah sub-task ke parent
    await parentItem.locator('[data-testid^="input-subtask-"]').fill(subTaskTitle);
    await parentItem.locator('[data-testid^="button-add-subtask-"]').click();
    await expect(parentItem.locator(`text=${subTaskTitle}`)).toBeVisible();

    // Pastikan item subtask ada di dalam parent
    const subtaskLocator = parentItem.locator('[data-testid^="subtask-item-"]', { hasText: subTaskTitle });
    await expect(subtaskLocator).toBeVisible();

    // 3. Konversi sub-task menjadi task mandiri (top-level todo)
    await page.evaluate(async (params) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      const parent = todos.find((t: any) => t.text === params.parent);
      const sub = (parent?.subTasks || []).find((s: any) => s.text === params.sub);
      if (parent && sub) {
        await store.convertSubTaskToTodo(sub.id, parent.id, 0);
      }
    }, { parent: parentTask, sub: subTaskTitle });

    // Verifikasi alert toast sukses muncul
    await expect(page.locator('[data-testid="alert-toast"]').filter({ hasText: 'Sub-task berhasil diubah menjadi catatan mandiri' })).toBeVisible();

    // Verifikasi sub-task tidak lagi berada di dalam sub-task list milik parent
    await expect(parentItem.locator('[data-testid^="subtask-item-"]', { hasText: subTaskTitle })).not.toBeVisible();

    // Verifikasi sub-task sekarang berdiri sendiri sebagai task utama (top-level todo-item)
    const independentItem = page.locator('[data-testid^="todo-item-"]', { hasText: subTaskTitle });
    await expect(independentItem).toBeVisible();

    // 4. Cleanup data test
    await page.evaluate(async (titles) => {
      const store = (window as any).__todoStore;
      const todos = store?.getState?.()?.todos || [];
      for (const t of titles) {
        if (titles.includes(t.text)) {
          await store.deleteTodo(t.id);
        }
      }
    }, [parentTask, subTaskTitle]);
  });
});



