<script lang="ts">
  import type { AppItem } from '../data/apps';

  let { app }: { app: AppItem } = $props();
</script>

<a
  href={app.url}
  target="_blank"
  rel="noopener noreferrer"
  class="app-card nb-card nb-card-interactive"
>
  <div class="card-top">
    <div class="icon-box" style="background: {app.color};">
      <span class="app-icon">{app.icon}</span>
    </div>
    <span class="nb-badge" style="background: {app.color};">
      {app.category}
    </span>
  </div>

  <div class="card-body">
    <h3 class="app-title">{app.name}</h3>
    <p class="app-desc">{app.description}</p>
  </div>

  <div class="card-footer">
    <span class="link-label">
      BUKA APLIKASI
      <span class="arrow">↗</span>
    </span>
  </div>
</a>

<style>
  .app-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    background: var(--nb-surface);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .icon-box {
    width: 48px;
    height: 48px;
    border: var(--nb-border-sm);
    border-radius: 6px;
    box-shadow: 2px 2px 0px var(--nb-black);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .app-icon {
    font-size: 24px;
    line-height: 1;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-grow: 1;
  }

  .app-title {
    font-size: 20px;
    font-weight: 800;
    margin: 0;
  }

  .app-desc {
    font-size: 14px;
    color: #555555;
    font-weight: 500;
    line-height: 1.4;
    margin: 0;
  }

  .card-footer {
    padding-top: 12px;
    border-top: 2px dashed #e0e0e0;
  }

  .link-label {
    font-size: 13px;
    font-weight: 800;
    font-family: var(--font-mono);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    letter-spacing: 0.5px;
  }

  .arrow {
    font-size: 16px;
    transition: transform 0.15s ease;
  }

  .app-card:hover .arrow {
    transform: translate(2px, -2px);
  }
</style>
