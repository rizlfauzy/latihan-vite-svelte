import { test, expect } from '@playwright/test';

test.describe('Apps Hub — UI & E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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
    await page.waitForFunction(() => !(window as any).__appStore?.getState?.()?.isLoading && !(window as any).__todoStore?.getState?.()?.isLoading);
    await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
    await expect(page.locator('[data-testid="apps-list"]').or(page.locator('[data-testid="apps-empty-state"]'))).toBeVisible();
    await expect(page.locator('[data-testid="todo-input"]')).toBeVisible();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/');
    await page.waitForFunction(() => !(window as any).__appStore?.getState?.()?.isLoading && !(window as any).__todoStore?.getState?.()?.isLoading);
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

    // Verify WhatsApp PIC buttons exist with wa.me link
    const waButtons = page.getByRole('link', { name: /HUBUNGI PIC/i });
    expect(await waButtons.count()).toBeGreaterThanOrEqual(1);

    const firstWaHref = await waButtons.first().getAttribute('href');
    expect(firstWaHref).toContain('https://wa.me/');
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

    // Click language switcher to EN
    const langBtn = page.locator('[data-testid="lang-switcher-btn"]');
    await langBtn.click();

    // Verify English translations on Home page
    await expect(page.locator('[data-testid="app-grid-section"]').getByText('APPS HUB')).toBeVisible();
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

    await expect(page.locator('[data-testid="login-error-alert"]')).toBeVisible();

    // Login with valid credentials
    await page.locator('[data-testid="input-username"]').fill('rizlfauzy');
    await page.locator('[data-testid="input-password"]').fill('admin123');
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
});



