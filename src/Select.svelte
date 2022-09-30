<script>
  export let options = [];
  export let value = "";
  let selectedIdx = 2;

  import { onMount, createEventDispatcher } from "svelte";

  let dispatch = createEventDispatcher();

  onMount(() => {
    options = options.map((i) => {
      if (typeof i === "string") {
        return {
          label: i[0].toUpperCase() + i.slice(1),
          value: i,
        };
      }
      return i;
    });
    if (!value) {
      value = options[0].value;
    }
  });
</script>

<select bind:value on:blur={(e) => dispatch("change", e)} {...$$props}>
  {#each options as option}
    <option selected={option.value === value} value={option.value}
      >{option.label}</option
    >
  {/each}
</select>
