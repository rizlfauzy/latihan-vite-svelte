<script lang="ts">
  import {
    Rocket,
    Zap,
    Briefcase,
    Wrench,
    Lock,
    Users,
    Lightbulb,
    FileText,
    Globe,
    AppWindow,
    Box,
    Activity,
    Code,
    Database,
    Gamepad2,
    LayoutGrid,
    Sparkles,
    Folder,
    Terminal,
    Cpu,
  } from '@lucide/svelte';

  let {
    name = 'app-window',
    size = 24,
    class: className = '',
  }: {
    name?: string;
    size?: number;
    class?: string;
  } = $props();

  const iconComponentMap: Record<string, any> = {
    'rocket': Rocket,
    '🚀': Rocket,
    'zap': Zap,
    '⚡': Zap,
    'briefcase': Briefcase,
    '💼': Briefcase,
    'wrench': Wrench,
    '🛠️': Wrench,
    'lock': Lock,
    '🔒': Lock,
    'users': Users,
    '👥': Users,
    'lightbulb': Lightbulb,
    '💡': Lightbulb,
    'file-text': FileText,
    '📝': FileText,
    'globe': Globe,
    '🌐': Globe,
    'activity': Activity,
    '📊': Activity,
    'app-window': AppWindow,
    'box': Box,
    'code': Code,
    'database': Database,
    'gamepad': Gamepad2,
    'gamepad-2': Gamepad2,
    '🎮': Gamepad2,
    'layout-grid': LayoutGrid,
    'sparkles': Sparkles,
    'folder': Folder,
    'terminal': Terminal,
    'cpu': Cpu,
  };

  let cleanKey = $derived(name ? name.trim().toLowerCase() : '');
  let IconComponent = $derived(iconComponentMap[cleanKey] || iconComponentMap[name] || AppWindow);
</script>

<IconComponent {size} class={className} />
