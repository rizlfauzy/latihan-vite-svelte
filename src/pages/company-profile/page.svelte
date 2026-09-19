<script lang="ts">
  import { env } from '../../lib/env';
</script>

<div class="flex flex-col gap-8 w-full">
  <!-- Header / Hero Section -->
  <section class="nb-card bg-nb-yellow p-6 sm:p-8 relative overflow-hidden">
    <div class="inline-flex items-center gap-2 bg-white px-3 py-1 border-2 border-nb-black shadow-nb-sm text-xs font-black uppercase mb-4">
      <span>🏢</span>
      <span>COMPANY PROFILE & ECOSYSTEM</span>
    </div>

    <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-nb-black mb-3">
      SVELTE HUB TECH LABS
    </h1>

    <p class="text-base sm:text-lg font-bold text-gray-800 max-w-2xl leading-relaxed mb-6">
      Pusat pengembangan ekosistem aplikasi mikro modern berbasis Svelte 5, Vite, dan Neo Brutalism design system. Kami membangun solusi digital cepat, tangguh, dan menyenangkan untuk digunakan.
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <a href="/" class="nb-btn bg-white text-sm px-5 py-2.5">
        ← KEMBALI KE DASHBOARD
      </a>
      <a
        href="https://wa.me/6281234567890?text=Halo%20PIC%20Svelte%20Hub,%20saya%20tertarik%20dengan%20solusi%20perusahaan%20Anda."
        target="_blank"
        rel="noopener noreferrer"
        class="nb-btn bg-nb-green text-sm px-5 py-2.5 flex items-center gap-2"
      >
        <span>💬</span>
        <span>HUBUNGI KAMI VIA WA</span>
      </a>
    </div>
  </section>

  <!-- Numbers / Highlights -->
  <section class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="nb-card bg-nb-pink p-4 text-center">
      <div class="text-3xl sm:text-4xl font-black text-nb-black">100%</div>
      <div class="text-xs sm:text-sm font-extrabold uppercase mt-1">NEO BRUTALISM</div>
    </div>
    <div class="nb-card bg-nb-blue p-4 text-center">
      <div class="text-3xl sm:text-4xl font-black text-nb-black">SVELTE 5</div>
      <div class="text-xs sm:text-sm font-extrabold uppercase mt-1">RUNES ARCHITECTURE</div>
    </div>
    <div class="nb-card bg-nb-green p-4 text-center">
      <div class="text-3xl sm:text-4xl font-black text-nb-black">&lt;100ms</div>
      <div class="text-xs sm:text-sm font-extrabold uppercase mt-1">LIGHTNING SPEED</div>
    </div>
    <div class="nb-card bg-nb-purple p-4 text-center">
      <div class="text-3xl sm:text-4xl font-black text-nb-black">24/7</div>
      <div class="text-xs sm:text-sm font-extrabold uppercase mt-1">DEV SUPPORT</div>
    </div>
  </section>

  <!-- Visi & Misi -->
  <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="nb-card bg-white p-6 flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🎯</span>
        <h2 class="text-xl font-black uppercase tracking-tight">VISI KAMI</h2>
      </div>
      <p class="text-sm font-bold text-gray-700 leading-relaxed">
        Menjadi platform sentralisasi dan agregasi aplikasi internal terbaik di kelasnya, memberikan pengalaman navigasi yang mulus, estetika visual yang berkarakter kuat, dan efisiensi kerja tanpa kompromi.
      </p>
    </div>

    <div class="nb-card bg-white p-6 flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🚀</span>
        <h2 class="text-xl font-black uppercase tracking-tight">MISI KAMI</h2>
      </div>
      <ul class="text-sm font-bold text-gray-700 space-y-2 list-disc list-inside">
        <li>Mendorong produktivitas melalui dashboard aplikasi mikro yang terintegrasi.</li>
        <li>Menerapkan standar kode mutakhir dengan Svelte 5, Tailwind CSS, & Playwright.</li>
        <li>Menyediakan saluran komunikasi langsung (WhatsApp PIC) di setiap lini aplikasi.</li>
      </ul>
    </div>
  </section>

  <!-- Core Services & Tech Stack -->
  <section class="nb-card bg-white p-6 sm:p-8">
    <div class="inline-flex items-center gap-2 bg-nb-blue text-nb-black px-3 py-1 border-2 border-nb-black shadow-nb-sm text-xs font-black uppercase mb-5">
      <span>🛠️</span>
      <span>LAYANAN & PILAR TEKNOLOGI</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div class="border-3 border-nb-black p-4 bg-nb-bg shadow-nb-sm">
        <div class="text-2xl mb-2">⚡</div>
        <h3 class="text-base font-black uppercase mb-1">Micro App Orchestration</h3>
        <p class="text-xs font-bold text-gray-700">Sentralisasi ragam utilitas internal, portal kerja, dan tracker dalam satu atap dashboard.</p>
      </div>

      <div class="border-3 border-nb-black p-4 bg-nb-bg shadow-nb-sm">
        <div class="text-2xl mb-2">🎨</div>
        <h3 class="text-base font-black uppercase mb-1">Neo Brutalism UI/UX</h3>
        <p class="text-xs font-bold text-gray-700">Desain tegas berani dengan kontras tinggi, border solid, dan elemen interaktif yang lugas.</p>
      </div>

      <div class="border-3 border-nb-black p-4 bg-nb-bg shadow-nb-sm">
        <div class="text-2xl mb-2">🛡️</div>
        <h3 class="text-base font-black uppercase mb-1">Automated QA & Testing</h3>
        <p class="text-xs font-bold text-gray-700">Validasi fungsional menyeluruh secara kontinyu menggunakan Playwright E2E testing suite.</p>
      </div>
    </div>
  </section>

  <!-- PIC & Leadership -->
  <section class="nb-card bg-nb-purple p-6 sm:p-8">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <div class="inline-flex items-center gap-2 bg-white px-3 py-1 border-2 border-nb-black shadow-nb-sm text-xs font-black uppercase mb-2">
          <span>👑</span>
          <span>LEADERSHIP & CONTACT</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-black uppercase text-nb-black">
          Rizal Fauzi
        </h2>
        <p class="text-sm font-extrabold text-gray-900 mt-1">
          Lead Systems Architect & Core Developer — Svelte Hub Labs
        </p>
        <p class="text-xs font-bold text-gray-800 mt-2 max-w-xl">
          Bertanggung jawab atas arsitektur performa tinggi, stabilitas integrasi mikro-aplikasi, dan standarisasi UI Neo Brutalism.
        </p>
      </div>

      <a
        href="https://wa.me/6281234567890?text=Halo%20Rizal%20Fauzi,%20saya%20ingin%20berdiskusi%20terkait%20Svelte%20Hub."
        target="_blank"
        rel="noopener noreferrer"
        class="nb-btn bg-nb-green text-sm px-5 py-3 whitespace-nowrap flex items-center gap-2"
      >
        <span>💬</span>
        <span>HUBUNGI VIA WHATSAPP</span>
      </a>
    </div>
  </section>
</div>
