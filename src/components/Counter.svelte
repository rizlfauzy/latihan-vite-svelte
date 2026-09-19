<script lang="ts">
  let count: number = $state(0)
  const increment = () => {
    count += 1
  }
</script>

<button type="button" class="nb-btn text-xs px-3 py-1.5" onclick={increment}>
  Count is {count}
</button>
