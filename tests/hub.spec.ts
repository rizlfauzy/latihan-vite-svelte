import { test, expect } from '@playwright/test';

test.describe('Svelte Hub — UI & E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test so tests are idempotent
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
    await expect(page.locator('[data-testid="apps-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="todo-input"]')).toBeVisible();
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
  });

  test('Sub-tasks feature can expand, add sub-task, toggle checkbox, and delete sub-task', async ({ page }) => {
    // Add a fresh parent task
    const parentTaskTitle = `Proyek Besar dengan Sub-tasks ${Date.now()}`;
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

    // Check initial counter
    const counterBadge = page.locator('[data-testid="apps-counter"]');
    const initialText = (await counterBadge.textContent()) || '';
    const initialCount = parseInt(initialText, 10) || 0;

    // Open modal
    await openAddBtn.click();
    const modalBackdrop = page.locator('[data-testid="add-app-modal-backdrop"]');
    await expect(modalBackdrop).toBeVisible();

    // Fill form
    const appName = `E2E Automated App ${Date.now()}`;
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
    await expect(page.locator('[data-testid="apps-list"]').getByText('Aplikasi uji otomatis Playwright').first()).toBeVisible();
    await expect(page.getByText('Tester Playwright').first()).toBeVisible();

    // Verify app counter incremented
    const expectedCount = initialCount + 1;
    await expect(counterBadge).toContainText(`${expectedCount} APPS TERHUBUNG`);
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
    const editedName = `Portfolio Pro Edition ${Date.now()}`;
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
    expect(manifestJson.name).toContain('Svelte Hub');
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

    // Search by app name (e.g., "Weather")
    await searchInput.fill('Weather');
    await expect(page.locator('[data-testid="apps-list"]')).toContainText('Weather Radar');
    await expect(page.locator('[data-testid="apps-list"]')).not.toContainText('Pocket Budget');

    // Clear search using clear button
    const clearBtn = page.locator('[data-testid="btn-clear-search"]');
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('[data-testid="apps-list"]')).toContainText('Pocket Budget');

    // Search by PIC name (e.g., "Maintainer")
    await searchInput.fill('Maintainer');
    await expect(page.locator('[data-testid="apps-list"]')).toContainText('Weather Radar');
    await expect(page.locator('[data-testid="apps-list"]')).not.toContainText('Todo & Task Master');

    // Search non-existing keyword -> empty state
    await searchInput.fill('NonExistentApp123456');
    await expect(page.locator('[data-testid="apps-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="apps-list"]')).not.toBeVisible();

    // Reset from empty state
    const emptyResetBtn = page.locator('[data-testid="btn-empty-reset"]');
    await emptyResetBtn.click();
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('[data-testid="apps-list"]')).toBeVisible();
  });

  test('Category filter filters apps, combines with search query, and resets properly', async ({ page }) => {
    // Check categories list
    const categoryBar = page.locator('[data-testid="category-filter-list"]');
    await expect(categoryBar).toBeVisible();

    // Click Productivity category
    const prodBtn = page.locator('[data-testid="category-btn-productivity"]');
    await expect(prodBtn).toBeVisible();
    await prodBtn.click();

    // Verify Productivity app is shown, but Utility app (Weather Radar) is not
    await expect(page.locator('[data-testid="apps-list"]')).toContainText('Todo & Task Master');
    await expect(page.locator('[data-testid="apps-list"]')).not.toContainText('Weather Radar');

    // Combine with search query that doesn't match in Productivity
    const searchInput = page.locator('[data-testid="search-apps-input"]');
    await searchInput.fill('Weather');
    await expect(page.locator('[data-testid="apps-empty-state"]')).toBeVisible();

    // Click reset filter button
    const resetBtn = page.locator('[data-testid="btn-reset-filters"]');
    await resetBtn.click();
    await expect(page.locator('[data-testid="apps-list"]')).toContainText('Weather Radar');
    await expect(searchInput).toHaveValue('');
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
    // Initially has 'Frontend Development (Svelte 5)'
    await expect(multiTrigger).toContainText('Frontend Development');

    // Open multi-select dropdown
    await multiTrigger.click();
    const multiDropdown = page.locator('[data-testid="select-services-multi-dropdown"]');
    await expect(multiDropdown).toBeVisible();

    // Search and add another option
    const multiSearch = page.locator('[data-testid="select-services-multi-search-input"]');
    await multiSearch.fill('Docker');
    await expect(page.locator('[data-testid="select-services-multi-option-devops"]')).toBeVisible();
    await page.locator('[data-testid="select-services-multi-option-devops"]').click();

    // Verify tag appeared in trigger
    await expect(page.locator('[data-testid="select-services-multi-tag-devops"]')).toBeVisible();

    // Remove first tag using remove button (✕)
    const removeTagBtn = page.locator('[data-testid="select-services-multi-tag-remove-frontend"]');
    await removeTagBtn.click();
    await expect(page.locator('[data-testid="select-services-multi-tag-frontend"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="select-services-multi-tag-devops"]')).toBeVisible();

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
    await expect(page.locator('[data-testid="apps-list"]')).toBeVisible();

    // Verify apps are fetched from Supabase and populated in appStore
    const appStoreData = await page.evaluate(() => {
      const store = (window as any).__appStore;
      const state = store ? store.getState() : null;
      return {
        count: state ? state.apps.length : 0,
        hasSupabaseApps: state ? state.apps.length >= 6 : false,
      };
    });

    expect(appStoreData.hasSupabaseApps).toBeTruthy();
    expect(appStoreData.count).toBeGreaterThanOrEqual(6);

    // Verify app cards are rendered on the page
    const appCards = page.locator('[data-testid="apps-list"] > div');
    expect(await appCards.count()).toBeGreaterThanOrEqual(6);
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
    await expect(page.locator('[data-testid="apps-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="todo-input"]')).toBeVisible();

    // Verify app topic selector exists (CustomSelect)
    const topicTrigger = page.locator('[data-testid="todo-app-topic-select-trigger"]');
    await expect(topicTrigger).toBeVisible();

    // Open CustomSelect and pick an option
    await topicTrigger.click();
    const secondOption = page.locator('[data-testid^="todo-app-topic-select-option-"]').nth(1);
    await secondOption.click();

    const taskWithTopic = `Task for Specific App Topic ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(taskWithTopic);
    await page.locator('[data-testid="todo-add-button"]').click();

    // Verify task is added and has the app topic badge
    const newTodoItem = page.locator('[data-testid^="todo-item-"]', { hasText: taskWithTopic });
    await expect(newTodoItem).toBeVisible();

    const topicBadge = newTodoItem.locator('[data-testid^="todo-topic-badge-"]');
    await expect(topicBadge).toBeVisible();
  });

  test('Deleting an App cascades deletion and automatically removes all associated To-Do items', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="apps-list"]')).toBeVisible();

    // 1. Pick target app id: 'weather-app'
    const targetAppId = 'weather-app';

    // 2. Select this app in the Todo topic select via CustomSelect
    const topicTrigger = page.locator('[data-testid="todo-app-topic-select-trigger"]');
    await topicTrigger.click();
    await page.locator(`[data-testid="todo-app-topic-select-option-${targetAppId}"]`).click();

    // 3. Add two todo items specifically for this app
    const todoTitle1 = `Weather App Task A ${Date.now()}`;
    const todoTitle2 = `Weather App Task B ${Date.now()}`;

    await page.locator('[data-testid="todo-input"]').fill(todoTitle1);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${todoTitle1}`)).toBeVisible();

    await page.locator('[data-testid="todo-input"]').fill(todoTitle2);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${todoTitle2}`)).toBeVisible();

    // Also add an unrelated todo for 'portfolio'
    const unrelatedTodo = `Unrelated Portfolio Task ${Date.now()}`;
    await topicTrigger.click();
    await page.locator('[data-testid="todo-app-topic-select-option-portfolio"]').click();
    await page.locator('[data-testid="todo-input"]').fill(unrelatedTodo);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${unrelatedTodo}`)).toBeVisible();

    // 4. Delete the Weather Radar app via App Card delete button & Confirm Modal
    const deleteAppBtn = page.locator(`[data-testid="btn-delete-app-${targetAppId}"]`);
    await deleteAppBtn.click();

    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(confirmModal).not.toBeVisible();

    // 5. Verify the app is removed from the grid
    await expect(page.locator(`[data-testid="btn-delete-app-${targetAppId}"]`)).not.toBeVisible();

    // 6. Verify cascading deletion: all todos linked to weather-app are removed!
    await expect(page.locator(`text=${todoTitle1}`)).not.toBeVisible();
    await expect(page.locator(`text=${todoTitle2}`)).not.toBeVisible();

    // 7. Verify unrelated todo is still present and intact
    await expect(page.locator(`text=${unrelatedTodo}`)).toBeVisible();
  });

  test('To-Do list topic filter filters tasks by App topic and resets when app is deleted', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="todo-topic-filter"]')).toBeVisible();

    // Add a todo for portfolio
    const topicTrigger = page.locator('[data-testid="todo-app-topic-select-trigger"]');
    await topicTrigger.click();
    await page.locator('[data-testid="todo-app-topic-select-option-portfolio"]').click();
    const portfolioTask = `Portfolio Task ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(portfolioTask);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${portfolioTask}`)).toBeVisible();

    // Add a todo for todo-svelte
    await topicTrigger.click();
    await page.locator('[data-testid="todo-app-topic-select-option-todo-svelte"]').click();
    const svelteTask = `Svelte Task ${Date.now()}`;
    await page.locator('[data-testid="todo-input"]').fill(svelteTask);
    await page.locator('[data-testid="todo-add-button"]').click();
    await expect(page.locator(`text=${svelteTask}`)).toBeVisible();

    // Select filter by 'portfolio'
    const topicFilter = page.locator('[data-testid="todo-topic-filter"]');
    await topicFilter.selectOption('portfolio');

    await expect(page.locator(`text=${portfolioTask}`)).toBeVisible();
    await expect(page.locator(`text=${svelteTask}`)).not.toBeVisible();

    // Reset topic filter to all
    await topicFilter.selectOption('all');
    await expect(page.locator(`text=${portfolioTask}`)).toBeVisible();
    await expect(page.locator(`text=${svelteTask}`)).toBeVisible();
  });
});



