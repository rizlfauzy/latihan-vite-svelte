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

// 1x1 PNG base64 fixture
const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Dummy SVG fixture
const dummySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>';

test.describe('Image Cropping & Frame Adjustment Feature', () => {
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
    await page.waitForFunction(
      () =>
        !(window as any).__appStore?.getState?.()?.isLoading &&
        !(window as any).__todoStore?.getState?.()?.isLoading &&
        !(window as any).__sectionStore?.getState?.()?.isLoading
    );
    await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());
    await expect(page.locator('[data-testid="apps-list"]').or(page.locator('[data-testid="apps-empty-state"]'))).toBeVisible();
  });

  test('1. Upload Hero Image di Tambah Aplikasi menampilkan modal crop dengan frame persegi panjang (banner)', async ({ page }) => {
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    // Upload PNG raster ke hero banner
    await page.locator('[data-testid="input-app-hero-image"]').setInputFiles({
      name: 'test-banner.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dummyPngBase64, 'base64'),
    });

    // Modal crop harus tampil
    const cropModal = page.locator('[data-testid="image-crop-modal"]');
    await expect(cropModal).toBeVisible();

    // Frame crop harus berasio banner (persegi panjang)
    const cropFrame = page.locator('[data-testid="crop-frame"]');
    await expect(cropFrame).toBeVisible();
    await expect(cropFrame).toHaveAttribute('data-ratio', 'banner');

    // Kontrol zoom dan tombol aksi harus tersedia
    await expect(page.locator('[data-testid="crop-zoom-slider"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-zoom-in"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-zoom-out"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-crop-reset"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-apply-crop"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-cancel-crop"]')).toBeVisible();

    // Tutup modal
    await page.locator('[data-testid="btn-close-crop-modal"]').click();
    await expect(cropModal).not.toBeVisible();
  });

  test('2. Upload Icon Aplikasi menampilkan modal crop dengan frame kotak (square)', async ({ page }) => {
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    // Upload PNG raster ke icon input
    await page.locator('[data-testid="input-app-image"]').setInputFiles({
      name: 'test-icon.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dummyPngBase64, 'base64'),
    });

    // Modal crop harus tampil dengan frame kotak
    const cropModal = page.locator('[data-testid="image-crop-modal"]');
    await expect(cropModal).toBeVisible();

    const cropFrame = page.locator('[data-testid="crop-frame"]');
    await expect(cropFrame).toBeVisible();
    await expect(cropFrame).toHaveAttribute('data-ratio', 'square');

    await page.locator('[data-testid="btn-cancel-crop"]').click();
    await expect(cropModal).not.toBeVisible();
  });

  test('3. Batal crop membatalkan upload dan tidak menampilkan preview', async ({ page }) => {
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    await page.locator('[data-testid="input-app-image"]').setInputFiles({
      name: 'test-cancel.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dummyPngBase64, 'base64'),
    });

    await expect(page.locator('[data-testid="image-crop-modal"]')).toBeVisible();

    // Klik tombol Batal
    await page.locator('[data-testid="btn-cancel-crop"]').click();
    await expect(page.locator('[data-testid="image-crop-modal"]')).not.toBeVisible();

    // Preview gambar icon tidak boleh muncul
    await expect(page.locator('[data-testid="preview-app-image"]')).not.toBeVisible();
  });

  test('4. Simpan crop memproses pemotongan gambar dan menampilkan preview yang terpasang', async ({ page }) => {
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    await page.locator('[data-testid="input-app-hero-image"]').setInputFiles({
      name: 'test-apply.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dummyPngBase64, 'base64'),
    });

    await expect(page.locator('[data-testid="image-crop-modal"]')).toBeVisible();

    // Uji tombol zoom dan reset
    await page.locator('[data-testid="btn-zoom-in"]').click();
    await page.locator('[data-testid="btn-crop-reset"]').click();

    // Klik Terapkan Crop
    await page.locator('[data-testid="btn-apply-crop"]').click();
    await expect(page.locator('[data-testid="image-crop-modal"]')).not.toBeVisible();

    // Preview hero banner harus muncul
    await expect(page.locator('[data-testid="preview-app-hero-image"]')).toBeVisible();
  });

  test('5. Alur crop juga berfungsi pada Edit Aplikasi', async ({ page }) => {
    // 1. Buat aplikasi baru terlebih dahulu
    const appName = `Crop Test App ${Date.now()}`;
    await page.evaluate(async (name) => {
      await (window as any).__appStore?.addApp?.({
        name,
        description: 'Test app for edit crop',
        url: 'https://croptest.internal',
        category: 'Productivity',
        icon: 'app-window',
        picName: 'PIC Test',
        picWhatsapp: '6281234567890',
      });
    }, appName);

    // Cari card aplikasi dan klik edit
    const card = page.locator('[data-testid^="app-card-"]', { hasText: appName });
    await expect(card).toBeVisible();
    await card.locator('[data-testid^="btn-edit-app-"]').click();

    const editModal = page.locator('[data-testid="edit-app-modal"]');
    await expect(editModal).toBeVisible();

    // Upload icon pada modal edit
    await page.locator('[data-testid="input-edit-app-image"]').setInputFiles({
      name: 'icon-edit.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dummyPngBase64, 'base64'),
    });

    // Modal crop muncul
    await expect(page.locator('[data-testid="image-crop-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="crop-frame"]')).toHaveAttribute('data-ratio', 'square');

    // Terapkan crop
    await page.locator('[data-testid="btn-apply-crop"]').click();
    await expect(page.locator('[data-testid="image-crop-modal"]')).not.toBeVisible();

    // Preview icon terpasang di modal edit
    await expect(page.locator('[data-testid="preview-edit-app-image"]')).toBeVisible();

    // Simpan perubahan edit
    await page.locator('[data-testid="btn-submit-edit-app"]').click();
    await expect(editModal).not.toBeVisible();

    // Cleanup: hapus aplikasi test
    await card.locator('[data-testid^="btn-delete-app-"]').click();
    await page.locator('[data-testid="modal-confirm-button"]').click();
    await expect(card).not.toBeVisible();
  });

  test('6. Alur crop berjalan di upload gambar To-Do (ImageUploadModal) dengan fitur ganti rasio', async ({ page }) => {
    // Buka modal upload gambar To-Do
    await page.locator('[data-testid="btn-open-image-modal"]').click();
    const todoImageModal = page.locator('[data-testid="image-upload-modal"]');
    await expect(todoImageModal).toBeVisible();

    // Upload gambar ke file input
    await page.locator('[data-testid="image-file-input"]').setInputFiles({
      name: 'todo-crop-test.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dummyPngBase64, 'base64'),
    });

    // Preview gambar muncul di ImageUploadModal
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

    // Klik tombol ATUR AREA (CROP)
    const cropBtn = page.locator('[data-testid="btn-crop-image-upload"]');
    await expect(cropBtn).toBeVisible();
    await cropBtn.click();

    // Modal crop terbuka dengan fitur pemilihan rasio (allowRatioToggle)
    const cropModal = page.locator('[data-testid="image-crop-modal"]');
    await expect(cropModal).toBeVisible();
    await expect(page.locator('[data-testid="crop-ratio-group"]')).toBeVisible();

    // Ganti rasio ke banner (persegi panjang)
    await page.locator('[data-testid="btn-ratio-banner"]').click();
    await expect(page.locator('[data-testid="crop-frame"]')).toHaveAttribute('data-ratio', 'banner');

    // Ganti rasio kembali ke kotak (1:1)
    await page.locator('[data-testid="btn-ratio-square"]').click();
    await expect(page.locator('[data-testid="crop-frame"]')).toHaveAttribute('data-ratio', 'square');

    // Terapkan crop
    await page.locator('[data-testid="btn-apply-crop"]').click();
    await expect(cropModal).not.toBeVisible();

    // Preview di modal tetap valid dan dapat digunakan
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    await page.locator('[data-testid="btn-save-image-upload"]').click();
    await expect(todoImageModal).not.toBeVisible();

    // Verifikasi badge gambar terlampir di form To-Do
    await expect(page.locator('[data-testid="new-todo-image-preview-badge"]')).toBeVisible();
  });

  test('7. Validasi format file dan batas ukuran tetap berjalan sebelum alur crop', async ({ page }) => {
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    // 1. Uji file tidak valid (.pdf)
    await page.locator('[data-testid="input-app-hero-image"]').setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('dummy content'),
    });

    // Modal crop TIDAK boleh muncul
    await expect(page.locator('[data-testid="image-crop-modal"]')).not.toBeVisible();
    // Toast error harus muncul
    const toast = page.locator('[data-testid="alert-toast"]').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/tidak didukung|ekstensi/i);
    await page.evaluate(() => (window as any).alertStore?.clearAlerts?.());

    // 2. Uji file melebihi batas ukuran 5 MB
    await page.locator('[data-testid="input-app-hero-image"]').setInputFiles({
      name: 'oversized.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 2048),
    });

    // Modal crop TIDAK boleh muncul
    await expect(page.locator('[data-testid="image-crop-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="alert-toast"]').first()).toContainText(/terlalu besar|melebihi|5 MB/i);
  });

  test('8. File SVG melewati alur crop (bypass) sehingga ketajaman vektor tetap terjaga', async ({ page }) => {
    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    // Upload SVG ke icon input
    await page.locator('[data-testid="input-app-image"]').setInputFiles({
      name: 'vector-icon.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(dummySvg),
    });

    // Modal crop TIDAK boleh muncul karena SVG adalah vektor
    await expect(page.locator('[data-testid="image-crop-modal"]')).not.toBeVisible();

    // Preview langsung terpasang
    await expect(page.locator('[data-testid="preview-app-image"]')).toBeVisible();
  });

  test('9. Pengguna dapat menggeser gambar hingga pojok/sisi kiri tepat menyentuh batas kiri frame', async ({ page }) => {
    // Buat gambar canvas 400x200
    const imageBase64 = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(200, 0, 200, 200);
      return canvas.toDataURL('image/png').split(',')[1];
    });

    await page.locator('[data-testid="btn-open-add-app"]').click();
    await expect(page.locator('[data-testid="add-app-modal-card"]')).toBeVisible();

    await page.locator('[data-testid="input-app-hero-image"]').setInputFiles({
      name: 'wide-test.png',
      mimeType: 'image/png',
      buffer: Buffer.from(imageBase64, 'base64'),
    });

    const cropModal = page.locator('[data-testid="image-crop-modal"]');
    await expect(cropModal).toBeVisible();

    const cropViewport = page.locator('[data-testid="crop-viewport"]');
    const cropFrame = page.locator('[data-testid="crop-frame"]');
    const cropImage = page.locator('[data-testid="crop-image"]');

    await expect(cropFrame).toBeVisible();
    await expect(cropImage).toBeVisible();

    // Dapatkan koordinat viewport
    const vpBox = await cropViewport.boundingBox();
    expect(vpBox).not.toBeNull();

    // Drag gambar ke kanan sejauh 300px agar sisi kiri gambar mentok di sisi kiri frame
    const startX = vpBox!.x + vpBox!.width / 2;
    const startY = vpBox!.y + vpBox!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 300, startY, { steps: 5 });
    await page.mouse.up();

    // Verifikasi posisi gambar vs frame
    const frameBox = await cropFrame.boundingBox();
    const imageBox = await cropImage.boundingBox();

    expect(frameBox).not.toBeNull();
    expect(imageBox).not.toBeNull();

    // Sisi kiri gambar harus sama persis dengan sisi kiri frame (toleransi <= 2px)
    expect(Math.abs(imageBox!.x - frameBox!.x)).toBeLessThanOrEqual(2);

    // Terapkan crop dan pastikan berhasil
    await page.locator('[data-testid="btn-apply-crop"]').click();
    await expect(cropModal).not.toBeVisible();
    await expect(page.locator('[data-testid="preview-app-hero-image"]')).toBeVisible();
  });
});
