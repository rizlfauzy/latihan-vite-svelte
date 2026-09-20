<script lang="ts">
  export interface SelectOption {
    label: string;
    value: string;
    icon?: string;
  }

  let {
    options = [],
    value = $bindable(),
    multiple = false,
    placeholder = 'Pilih opsi...',
    searchPlaceholder = 'Cari opsi...',
    id,
    dataTestId = 'custom-select',
    disabled = false,
  }: {
    options: (SelectOption | string)[];
    value: string | string[];
    multiple?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    id?: string;
    dataTestId?: string;
    disabled?: boolean;
  } = $props();

  let isOpen = $state(false);
  let searchQuery = $state('');
  let highlightedIndex = $state(0);
  let containerEl = $state<HTMLElement | null>(null);
  let searchInputEl = $state<HTMLInputElement | null>(null);

  $effect(() => {
    // Reset index saat pencarian berubah
    searchQuery;
    highlightedIndex = 0;
  });

  let normalizedOptions = $derived<SelectOption[]>(
    options.map((opt) =>
      typeof opt === 'string' ? { label: opt, value: opt } : opt
    )
  );

  let filteredOptions = $derived<SelectOption[]>(
    normalizedOptions.filter((opt) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
      );
    })
  );

  let selectedValues = $derived<string[]>(
    multiple
      ? Array.isArray(value)
        ? value
        : []
      : typeof value === 'string' && value
        ? [value]
        : []
  );

  function isSelected(val: string): boolean {
    return selectedValues.includes(val);
  }

  function getOptionLabel(val: string): string {
    const found = normalizedOptions.find((o) => o.value === val);
    return found ? found.label : val;
  }

  function toggleDropdown() {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) {
      searchQuery = '';
      highlightedIndex = 0;
      setTimeout(() => {
        searchInputEl?.focus();
      }, 50);
    }
  }

  function handleSelect(val: string, closeAfter = false) {
    if (multiple) {
      const current = Array.isArray(value) ? [...value] : [];
      const idx = current.indexOf(val);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(val);
      }
      value = current;
      searchQuery = '';
      if (closeAfter) {
        isOpen = false;
      }
    } else {
      value = val;
      isOpen = false;
      searchQuery = '';
    }
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (filteredOptions.length > 0) {
        e.preventDefault();
        const targetOption = filteredOptions[highlightedIndex] || filteredOptions[0];
        const isTab = e.key === 'Tab';
        handleSelect(targetOption.value, isTab);
        if (!multiple || isTab) {
          containerEl?.querySelector<HTMLButtonElement>('button[data-testid$="-trigger"]')?.focus();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
      }
    } else if (e.key === 'ArrowDown') {
      if (filteredOptions.length > 0) {
        e.preventDefault();
        highlightedIndex = (highlightedIndex + 1) % filteredOptions.length;
      }
    } else if (e.key === 'ArrowUp') {
      if (filteredOptions.length > 0) {
        e.preventDefault();
        highlightedIndex = (highlightedIndex - 1 + filteredOptions.length) % filteredOptions.length;
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isOpen = false;
      containerEl?.querySelector<HTMLButtonElement>('button[data-testid$="-trigger"]')?.focus();
    }
  }

  function removeTag(val: string, e: MouseEvent) {
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      value = value.filter((v) => v !== val);
    }
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
  class="relative w-full"
  data-testid={dataTestId}
>
  <!-- Trigger Button -->
  <button
    type="button"
    {id}
    class="nb-input w-full p-2.5 bg-white text-nb-black min-h-10.5 flex items-center justify-between gap-2 text-left cursor-pointer transition-all {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
    onclick={toggleDropdown}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    {disabled}
    data-testid="{dataTestId}-trigger"
  >
    <!-- Value representation -->
    <div class="flex items-center gap-1.5 flex-wrap grow overflow-hidden">
      {#if multiple}
        {#if selectedValues.length > 0}
          {#each selectedValues as v (v)}
            <span
              class="inline-flex items-center gap-1 bg-nb-yellow px-2 py-0.5 border-2 border-nb-black text-xs font-black text-black shadow-nb-xs"
              data-testid="{dataTestId}-tag-{v.toLowerCase().replace(/\s+/g, '-')}"
            >
              <span>{getOptionLabel(v)}</span>
              <span
                role="button"
                tabindex="0"
                class="hover:text-red-600 font-extrabold cursor-pointer ml-0.5"
                onclick={(e) => removeTag(v, e)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    removeTag(v, e as any);
                  }
                }}
                aria-label="Hapus {getOptionLabel(v)}"
                data-testid="{dataTestId}-tag-remove-{v.toLowerCase().replace(/\s+/g, '-')}"
              >
                ✕
              </span>
            </span>
          {/each}
        {:else}
          <span class="text-gray-400 font-semibold text-xs select-none">
            {placeholder}
          </span>
        {/if}
      {:else}
        {#if selectedValues.length > 0}
          <span class="font-bold text-xs text-nb-black truncate">
            {getOptionLabel(selectedValues[0])}
          </span>
        {:else}
          <span class="text-gray-400 font-semibold text-xs select-none">
            {placeholder}
          </span>
        {/if}
      {/if}
    </div>

    <!-- Arrow icon -->
    <span
      class="text-xs font-black transition-transform duration-150 select-none {isOpen ? 'rotate-180' : ''}"
      data-testid="{dataTestId}-arrow"
    >
      ▼
    </span>
  </button>

  <!-- Dropdown Menu -->
  {#if isOpen}
    <div
      class="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border-3 border-nb-black shadow-nb flex flex-col gap-2 p-2 max-h-64 overflow-hidden animate-in fade-in"
      role="listbox"
      aria-multiselectable={multiple}
      data-testid="{dataTestId}-dropdown"
    >
      <!-- Search Box inside dropdown -->
      <div class="relative">
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs select-none text-gray-500 z-10 pointer-events-none">
          🔍
        </span>
        <input
          bind:this={searchInputEl}
          type="text"
          bind:value={searchQuery}
          onkeydown={handleSearchKeydown}
          placeholder={searchPlaceholder}
          class="nb-input pl-8 pr-7 py-1.5 text-xs font-bold w-full bg-gray-50 text-nb-black"
          data-testid="{dataTestId}-search-input"
        />
        {#if searchQuery}
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-200 hover:bg-nb-pink text-[10px] font-black flex items-center justify-center cursor-pointer text-black"
            onclick={() => (searchQuery = '')}
            title="Reset"
            data-testid="{dataTestId}-search-clear"
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- Options List -->
      <div
        class="overflow-y-auto flex flex-col gap-1 max-h-44 pr-1 text-black"
        data-testid="{dataTestId}-options-list"
      >
        {#if filteredOptions.length === 0}
          <div
            class="p-3 text-center text-xs font-bold text-gray-500 italic"
            data-testid="{dataTestId}-empty"
          >
            Tidak ada opsi yang cocok
          </div>
        {:else}
          {#each filteredOptions as opt, idx (opt.value)}
            {@const selected = isSelected(opt.value)}
            {@const isHighlighted = idx === highlightedIndex}
            <div
              role="option"
              aria-selected={selected}
              tabindex="0"
              class="p-2 text-xs font-bold flex items-center justify-between cursor-pointer border-2 transition-all {selected ? 'bg-nb-yellow border-nb-black shadow-nb-xs font-black' : isHighlighted ? 'bg-gray-100 border-nb-black text-nb-black' : 'border-transparent hover:bg-gray-100 hover:border-gray-300 text-nb-black'}"
              onclick={() => handleSelect(opt.value)}
              onmouseenter={() => (highlightedIndex = idx)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(opt.value);
                }
              }}
              data-testid="{dataTestId}-option-{opt.value.toLowerCase().replace(/\s+/g, '-')}"
            >
              <div class="flex items-center gap-2">
                {#if opt.icon}
                  <span>{opt.icon}</span>
                {/if}
                <span>{opt.label}</span>
              </div>

              {#if selected}
                <span class="text-xs font-black">✓</span>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
