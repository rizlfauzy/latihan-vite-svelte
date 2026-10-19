<script lang="ts">
  let {
    value = $bindable(''),
    id,
    name,
    placeholder = 'YYYY-MM-DD',
    disabled = false,
    dataTestId = 'date-picker',
    width = 'w-full',
    class: customClass = '',
    min,
    max,
  }: {
    value?: string;
    id?: string;
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    dataTestId?: string;
    width?: string;
    class?: string;
    min?: string;
    max?: string;
  } = $props();

  let isOpen = $state(false);
  let containerEl = $state<HTMLElement | null>(null);

  // Parse initial view year and month
  const today = new Date();
  let viewYear = $state(today.getFullYear());
  let viewMonth = $state(today.getMonth()); // 0-11

  $effect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        viewYear = parts[0];
        viewMonth = parts[1] - 1;
      }
    }
  });

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  let yearList = $derived.by(() => {
    const minYear = min && /^\d{4}/.test(min) ? parseInt(min.slice(0, 4), 10) : 1970;
    const maxYear = max && /^\d{4}/.test(max) ? parseInt(max.slice(0, 4), 10) : 2050;
    const fromY = Math.min(minYear, viewYear, today.getFullYear() - 10);
    const toY = Math.max(maxYear, viewYear, today.getFullYear() + 20);
    const list: number[] = [];
    for (let y = fromY; y <= toY; y++) {
      list.push(y);
    }
    return list;
  });

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  interface CalendarDay {
    date: Date;
    dayNum: number;
    dateString: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
  }

  function formatDateISO(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const todayStr = formatDateISO(today);

  let calendarDays = $derived.by(() => {
    const days: CalendarDay[] = [];
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Days from previous month
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(viewYear, viewMonth - 1, dayNum);
      const dateString = formatDateISO(d);
      days.push({
        date: d,
        dayNum,
        dateString,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        isSelected: dateString === value,
        isDisabled: isDateDisabled(dateString),
      });
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(viewYear, viewMonth, dayNum);
      const dateString = formatDateISO(d);
      days.push({
        date: d,
        dayNum,
        dateString,
        isCurrentMonth: true,
        isToday: dateString === todayStr,
        isSelected: dateString === value,
        isDisabled: isDateDisabled(dateString),
      });
    }

    // Days from next month to fill complete weeks
    const remaining = (7 - (days.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(viewYear, viewMonth + 1, dayNum);
      const dateString = formatDateISO(d);
      days.push({
        date: d,
        dayNum,
        dateString,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        isSelected: dateString === value,
        isDisabled: isDateDisabled(dateString),
      });
    }

    return days;
  });

  function isDateDisabled(dateStr: string): boolean {
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  }

  function prevMonth() {
    if (viewMonth === 0) {
      viewMonth = 11;
      viewYear -= 1;
    } else {
      viewMonth -= 1;
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      viewMonth = 0;
      viewYear += 1;
    } else {
      viewMonth += 1;
    }
  }

  function selectDate(dateStr: string) {
    if (isDateDisabled(dateStr)) return;
    value = dateStr;
    isOpen = false;
  }

  function selectToday() {
    const str = formatDateISO(new Date());
    if (!isDateDisabled(str)) {
      value = str;
      const parts = str.split('-').map(Number);
      viewYear = parts[0];
      viewMonth = parts[1] - 1;
    }
    isOpen = false;
  }

  function selectTomorrow() {
    const tom = new Date(Date.now() + 86400000);
    const str = formatDateISO(tom);
    if (!isDateDisabled(str)) {
      value = str;
      const parts = str.split('-').map(Number);
      viewYear = parts[0];
      viewMonth = parts[1] - 1;
    }
    isOpen = false;
  }

  function clearDate() {
    value = '';
    isOpen = false;
  }

  function toggleDropdown() {
    if (disabled) return;
    isOpen = !isOpen;
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
  }

  function handleWindowClick(e: MouseEvent) {
    if (isOpen && containerEl && !containerEl.contains(e.target as Node)) {
      isOpen = false;
    }
  }

  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
    }
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div
  bind:this={containerEl}
  class="relative inline-flex items-center {width} {isOpen ? 'z-50' : ''}"
  data-testid="{dataTestId}-container"
>
  <div class="relative w-full flex items-center">
    <input
      {id}
      {name}
      type="text"
      value={value}
      oninput={handleInput}
      {placeholder}
      {disabled}
      class="nb-input py-1 pl-2 pr-14 text-xs font-bold bg-white text-nb-black w-full {customClass} {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
      data-testid={dataTestId}
    />

    <div class="absolute right-1.5 flex items-center gap-1">
      {#if value && !disabled}
        <button
          type="button"
          onclick={clearDate}
          class="text-[10px] font-black text-gray-400 hover:text-red-500 p-0.5 rounded cursor-pointer leading-none"
          title="Hapus tanggal"
          aria-label="Hapus tanggal"
          data-testid="{dataTestId}-clear"
        >
          ✕
        </button>
      {/if}

      <button
        type="button"
        onclick={toggleDropdown}
        {disabled}
        class="text-xs p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer select-none leading-none {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
        title="Pilih tanggal dari kalender"
        aria-label="Pilih tanggal dari kalender"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        data-testid="{dataTestId}-trigger"
      >
        📅
      </button>
    </div>
  </div>

  {#if isOpen}
    <div
      class="absolute left-0 top-full mt-1.5 z-50 bg-white border-3 border-nb-black shadow-nb p-3 min-w-72 select-none animate-in fade-in"
      data-testid="{dataTestId}-calendar"
      role="dialog"
      aria-label="Kalender pemilih tanggal"
    >
      <!-- Calendar Header: Month & Year Controls -->
      <div class="flex items-center justify-between mb-2 gap-1.5">
        <button
          type="button"
          onclick={prevMonth}
          class="w-7 h-7 shrink-0 flex items-center justify-center border-2 border-nb-black bg-gray-100 hover:bg-nb-yellow font-black text-xs shadow-nb-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5 text-nb-black"
          aria-label="Bulan sebelumnya"
          data-testid="{dataTestId}-prev-month"
        >
          ◀
        </button>

        <div class="flex items-center gap-1.5 grow justify-center" data-testid="{dataTestId}-month-label">
          <select
            value={viewMonth}
            onchange={(e) => (viewMonth = Number((e.target as HTMLSelectElement).value))}
            class="nb-input py-0.5 px-1.5 text-xs font-black bg-white text-nb-black border-2 border-nb-black shadow-nb-xs cursor-pointer focus:outline-none"
            data-testid="{dataTestId}-select-month"
            aria-label="Pilih Bulan"
          >
            {#each monthNames as mName, idx}
              <option value={idx}>{mName}</option>
            {/each}
          </select>

          <select
            value={viewYear}
            onchange={(e) => (viewYear = Number((e.target as HTMLSelectElement).value))}
            class="nb-input py-0.5 px-1.5 text-xs font-black bg-white text-nb-black border-2 border-nb-black shadow-nb-xs cursor-pointer focus:outline-none"
            data-testid="{dataTestId}-select-year"
            aria-label="Pilih Tahun"
          >
            {#each yearList as y}
              <option value={y}>{y}</option>
            {/each}
          </select>
        </div>

        <button
          type="button"
          onclick={nextMonth}
          class="w-7 h-7 shrink-0 flex items-center justify-center border-2 border-nb-black bg-gray-100 hover:bg-nb-yellow font-black text-xs shadow-nb-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5 text-nb-black"
          aria-label="Bulan berikutnya"
          data-testid="{dataTestId}-next-month"
        >
          ▶
        </button>
      </div>

      <!-- Day of week names -->
      <div class="grid grid-cols-7 gap-1 text-center mb-1">
        {#each dayNames as dayName, idx (dayName)}
          <span class="text-[10px] font-black {idx === 0 ? 'text-red-500' : 'text-gray-500'}">
            {dayName}
          </span>
        {/each}
      </div>

      <!-- Days Grid -->
      <div class="grid grid-cols-7 gap-1 text-center" data-testid="{dataTestId}-grid">
        {#each calendarDays as day (day.dateString)}
          <button
            type="button"
            disabled={day.isDisabled}
            onclick={() => selectDate(day.dateString)}
            class="h-7 w-7 text-xs flex items-center justify-center rounded-none font-bold transition-all cursor-pointer
              {day.isSelected
                ? 'bg-nb-yellow border-2 border-nb-black shadow-nb-xs font-black text-black'
                : day.isToday
                  ? 'border-2 border-dashed border-nb-black font-black text-nb-black hover:bg-gray-100'
                  : day.isCurrentMonth
                    ? 'text-nb-black hover:bg-gray-100 border border-transparent hover:border-gray-300'
                    : 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 border border-transparent'}
              {day.isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}"
            data-testid="{dataTestId}-day-{day.dateString}"
            aria-label={day.dateString}
          >
            {day.dayNum}
          </button>
        {/each}
      </div>

      <!-- Quick Action Presets -->
      <div class="mt-3 pt-2 border-t-2 border-gray-200 dark:border-gray-700 flex items-center justify-between gap-1 text-[11px]">
        <button
          type="button"
          onclick={selectToday}
          class="px-2 py-1 bg-gray-100 hover:bg-nb-yellow border-2 border-nb-black font-bold text-black shadow-nb-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          data-testid="{dataTestId}-btn-today"
        >
          Hari Ini
        </button>
        <button
          type="button"
          onclick={selectTomorrow}
          class="px-2 py-1 bg-gray-100 hover:bg-nb-yellow border-2 border-nb-black font-bold text-black shadow-nb-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          data-testid="{dataTestId}-btn-tomorrow"
        >
          Besok
        </button>
        <button
          type="button"
          onclick={clearDate}
          class="px-2 py-1 bg-gray-100 hover:bg-red-100 text-red-600 border-2 border-nb-black font-bold shadow-nb-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          data-testid="{dataTestId}-btn-clear"
        >
          Kosongkan
        </button>
      </div>
    </div>
  {/if}
</div>
