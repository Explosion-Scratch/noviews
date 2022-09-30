<script>
  import { createEventDispatcher } from "svelte";
  export let queryParams = {};
  let error = false;
  let dispatch = createEventDispatcher();
  export let fetchOpts = {};
  let value = "";
  let loading = false;
  export let searchPattern =
    "[random_prefix][random_whitespace][random_number]";
  let video;
  export let maxViews = 1;
  $: videoInfo = video?.snippet;
  let THRESHOLD = 1;
  import { onMount } from "svelte";

  onMount(() => (THRESHOLD = parseInt(maxViews, 10)));

  async function findVid(iterations = 5, curr = []) {
    if (iterations <= 0) {
      console.log("Couldn't find");
      video = curr.sort(
        (a, b) => a.statistics.viewCount - b.statistics.viewCount
      )[0];
      console.log(video);
      return video;
    }

    const prefixes = `IMG,IMG_,IMG-,DSC`.split(",");
    const whitespaces = ["-", "_", " "];

    let pattern = searchPattern
      .replace(/\[random[ _-]number\]/g, () =>
        Math.round(Math.random() * 9999)
      )
      .replace(
        /\[random[ _-]prefix\]/g,
        () => prefixes[Math.floor(Math.random() * prefixes.length)]
      )
      .replace(
        /\[random[ _-]whitespace\]/g,
        () => whitespaces[Math.floor(Math.random() * whitespaces.length)]
      );
    let json = await fetch(
      `https://www.googleapis.com/youtube/v3/search?q=${pattern}&part=snippet&${new URLSearchParams(
        queryParams
      ).toString()}&type=video&videoEmbeddable=true`,
      fetchOpts
    ).then((r) => r.json());
    console.log(json);
    if (json.error) {
      console.error(json);
      throw new Error("There was an error");
    }
    let vids = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${json.items
        .map((i) => i.id.videoId)
        .join(",")}&part=statistics,snippet&${new URLSearchParams(
        queryParams
      ).toString()}&type=video&videoEmbeddable=true`,
      fetchOpts
    )
      .then((r) => r.json())
      .then((a) => a.items);
    const found = vids.find((i) => i.statistics.viewCount <= THRESHOLD);
    if (found) {
      console.log("Found: ", found);
      return (video = found);
    } else {
      return findVid(iterations - 1, [...curr, ...vids]);
    }
  }
  async function clicked() {
    loading = true;
    error = false;
    try {
      await findVid(5);
    } catch (e) {
      error = true;
      video = null;
      loading = false;
    }
    loading = false;
  }
  function niceslice(str, len) {
    return str?.length > len ? str?.slice(0, -3) + "..." : str;
  }
  function fromNow(n, o) {
    var a = 6e4,
      r = 60 * a,
      e = 24 * r,
      t = 365 * e,
      f = 30 * e;
    o = o || {};
    var u = new Date(n).getTime() - Date.now(),
      h = Math.abs(u);
    if (h < a) return "just now";
    var i,
      m,
      s = {
        year: h / t,
        month: (h % t) / f,
        day: (h % f) / e,
        hour: (h % e) / r,
        minute: (h % r) / a,
      },
      w = [],
      g = o.max || a;
    for (i in s)
      w.length < g &&
        ((m = Math.floor(s[i])) || o.zero) &&
        w.push(m + " " + (1 == m ? i : i + "s"));
    return (
      (g = ", "),
      (i = w.length) > 1 &&
        o.and &&
        (2 == i && (g = " "), (w[--i] = "and " + w[i])),
      (m = w.join(g)),
      o.suffix && (m += u < 0 ? " ago" : " from now"),
      m
    );
  }
</script>

{#if video}
  <iframe
    src="https://www.youtube.com/embed/{video.id}"
    allow="encrypted-media"
    title={video.title}
    frameborder="0"
    allowfullscreen
  />
{:else if !loading}
  <h2>That's just sad bro</h2>
  {#if error}<span class="error">There was an error</span>{/if}
  <span class="desc">Find a random YouTube video with 1 or less views</span>
{/if}
{#if videoInfo}
  <div class="info">
    <div class="heading">
      <a class="title" href="https://youtube.com/watch?v={video.id}">
        {videoInfo.title}
      </a>
      <div class="views">
        <svg width="32" height="32" viewBox="0 0 24 24"
          ><g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            ><circle cx="12" cy="12" r="2" /><path
              d="M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7"
            /></g
          ></svg
        >
        {video.statistics.viewCount}
      </div>
    </div>
    <a class="channel" href="https://youtube.com/channel/{videoInfo.channelId}">
      <svg width="32" height="32" viewBox="0 0 32 32"
        ><path
          fill="currentColor"
          d="M16 8a5 5 0 1 0 5 5a5 5 0 0 0-5-5Zm0 8a3 3 0 1 1 3-3a3.003 3.003 0 0 1-3 3Z"
        /><path
          fill="currentColor"
          d="M16 2a14 14 0 1 0 14 14A14.016 14.016 0 0 0 16 2Zm-6 24.377V25a3.003 3.003 0 0 1 3-3h6a3.003 3.003 0 0 1 3 3v1.377a11.899 11.899 0 0 1-12 0Zm13.992-1.451A5.002 5.002 0 0 0 19 20h-6a5.002 5.002 0 0 0-4.992 4.926a12 12 0 1 1 15.985 0Z"
        /></svg
      >
      {videoInfo.channelTitle}
    </a>
    <div class="desc">
      {fromNow(videoInfo.publishedAt, { zero: false, max: 1 })} ago
      {video.description?.trim()?.length
        ? " – " + niceslice(videoInfo.description)
        : ""}
    </div>
  </div>
{/if}
{#if loading}
  <span class="loading desc">Loading...</span>
{:else}
  <div class="buttons">
    <button class="search button" on:click={clicked}>
      {#if video}Again!{:else}Go!{/if}
    </button>
    <svg
      on:click={() => dispatch("settings")}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      ><path
        fill="currentColor"
        d="m19.588 15.492l-1.814-1.29a6.483 6.483 0 0 0-.005-3.421l1.82-1.274l-1.453-2.514l-2.024.926a6.484 6.484 0 0 0-2.966-1.706L12.953 4h-2.906l-.193 2.213A6.483 6.483 0 0 0 6.889 7.92l-2.025-.926l-1.452 2.514l1.82 1.274a6.483 6.483 0 0 0-.006 3.42l-1.814 1.29l1.452 2.502l2.025-.927a6.483 6.483 0 0 0 2.965 1.706l.193 2.213h2.906l.193-2.213a6.484 6.484 0 0 0 2.965-1.706l2.025.927l1.453-2.501ZM13.505 2.985a.5.5 0 0 1 .5.477l.178 2.035a7.45 7.45 0 0 1 2.043 1.178l1.85-.863a.5.5 0 0 1 .662.195l2.005 3.47a.5.5 0 0 1-.162.671l-1.674 1.172c.128.798.124 1.593.001 2.359l1.673 1.17a.5.5 0 0 1 .162.672l-2.005 3.457a.5.5 0 0 1-.662.195l-1.85-.863c-.602.49-1.288.89-2.043 1.179l-.178 2.035a.5.5 0 0 1-.5.476h-4.01a.5.5 0 0 1-.5-.476l-.178-2.035a7.453 7.453 0 0 1-2.043-1.179l-1.85.863a.5.5 0 0 1-.663-.194L2.257 15.52a.5.5 0 0 1 .162-.671l1.673-1.171a7.45 7.45 0 0 1 0-2.359L2.42 10.148a.5.5 0 0 1-.162-.67L4.26 6.007a.5.5 0 0 1 .663-.195l1.85.863a7.45 7.45 0 0 1 2.043-1.178l.178-2.035a.5.5 0 0 1 .5-.477h4.01ZM11.5 9a3.5 3.5 0 1 1 0 7a3.5 3.5 0 0 1 0-7Zm0 1a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5Z"
      /></svg
    >
  </div>
{/if}

<style>
  iframe {
    aspect-ratio: 16/9;
    width: 100%;
    margin-bottom: 20px;
    border-radius: 5px;
    overflow: hidden;
  }
  .buttons {
    display: flex;
    position: relative;
    width: 400px;
  }

  .buttons button {
    height: 100%;
  }

  .buttons svg {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 4px;
    border-radius: 3px;
    width: 40px;
    padding: 3px 5px;
    border: 0;
    margin: 0 !important;
  }

  .buttons svg:hover {
    background: #0003;
    cursor: pointer;
  }
  .info {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .info .heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .info .heading .views {
    display: flex;
    align-items: center;
  }
  .info .heading .views svg {
    margin-right: 6px;
  }
  .info .heading .title {
    color: #333;
    font-size: 1.5rem;
    font-weight: 600;
  }
  .info .channel {
    display: flex;
    align-items: center;
  }
  .info .channel svg {
    width: 2ch;
    margin-right: 3px;
  }
  svg {
    width: 3ch;
    opacity: 0.6;
  }
  * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  }
</style>
