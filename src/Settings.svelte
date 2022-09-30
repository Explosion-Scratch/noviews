<script>
  import Select from "./Select.svelte";
  import languages from "./languages.js";
  export let opts = {};
  import { onMount, createEventDispatcher } from "svelte";
  let publishedAfter, publishedBefore;

  let dispatch = createEventDispatcher();

  onMount(() => {
    opts = {
      publishedAfter: new Date("January 1, 2000"),
      publishedBefore: new Date(),
      language: "en",
      maxViews: 1,
      searchPattern: "[random_prefix][random_whitespace][random_number]",
      videoDuration: "any",
      safeSearch: "moderate",
      ...opts,
    };
    publishedAfter.valueAsDate = new Date(opts.publishedAfter);
    publishedBefore.valueAsDate = new Date(opts.publishedBefore);
  });

  function change() {
    opts.publishedAfter = publishedAfter.valueAsDate;
    opts.publishedBefore = publishedBefore.valueAsDate;
  }
</script>

<div class="settings_wrapper">
  <div class="settings">
    <button class="close" on:click={() => dispatch("close")}>
      <svg width="32" height="32" viewBox="0 0 512 512"
        ><path
          fill="currentColor"
          d="M340.2 160l-84.4 84.3-84-83.9-11.8 11.8 84 83.8-84 83.9 11.8 11.7 84-83.8 84.4 84.2 11.8-11.7-84.4-84.3 84.4-84.2z"
        /></svg
      >
    </button>
    <h2>Settings</h2>
    <span class="desc" style="text-align: center; width: 100%;">Filter search results</span>
    <!-- MaxViews -->
    <label for="maxViews">Maximum views:</label>
    <input type="number" bind:value={opts.maxViews}/>
    <!-- Search pattern -->
    <label for="searchPattern">Search pattern:</label>
    <span class="desc">Use "[random_number]", "[random_prefix]" and "[random_whitespace]" to randomize</span>
    <input type="text" bind:value={opts.searchPattern}/>
    <!-- Length -->
    <label for="videoDuration" class="length_label">Length:</label>
    <Select
      bind:value={opts.videoDuration}
      id="videoDuration"
      options={["any", "short", "medium", "long"]}
    />
    <!-- Published after -->
    <label for="publishedAfter" class="publishedAfter">Published after:</label>
    <input bind:this={publishedAfter} on:change={change} on:keyup={change} id="publishedAfter" type="date" />
    <!-- Published before -->
    <label for="publishedBefore" class="publishedBefore"
      >Published before:</label
    >
    <input bind:this={publishedBefore} on:change={change} on:keyup={change} id="publishedBefore" type="date" />
    <!-- Language -->
    <label for="language" class="language">Language for search results:</label>
    <Select
      bind:value={opts.language}
      id="language"
      options={Object.entries(languages).map((i) => ({
        value: i[0],
        label: i[1],
      }))}
    />
    <!-- Safesarch -->
    <label for="safeSearch">Safesearch</label>
    <Select
      bind:value={opts.safeSearch}
      options={["none", "moderate", "strict"]}
    />
  </div>
</div>

<style>
  .settings_wrapper {
    width: 100vw;
    height: 100vh;
    backdrop-filter: blur(3px);
    background: #0001;
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
  }
  .settings {
    position: relative;
    background: white;
    padding: 20px 40px;
    border-radius: 10px;
    border: 1px solid #eee;
    display: flex;
    align-items: center;
    flex-direction: column;
    min-width: 300px;
    min-height: 200px;
  }
  .settings :global(:is(label, select, h2, span, input)) {
    width: 100%;
  }
  h2 {
    text-align: center;
  }
  :global(input, select) {
    background: transparent;
    border-radius: 3px;
  }
  :global(:is(input, select):focus) {
    outline: none;
    box-shadow: 0 0 0 2px #0001;
  }
  label {
    margin-bottom: 8px;
    font-style: italic;
    color: #666;
  }
  .close {
    position: absolute;
    top: 4px;
    right: 3px;
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 3px;
    border-radius: 3px;
    display: grid;
    place-items: center;
  }
  .close:hover {
    background: #0001;
  }
</style>
