<script>
  export let fetchOpts = {};
  let value = "";
  let loading = false;
  let video;
  $: videoInfo = video?.snippet;
  const THRESHOLD = 1;
  const prefixes = `IMG,IMG_,IMG-,DSC`.split(",");

  async function findVid(iterations = 5, curr = []) {
    if (iterations <= 0) {
      console.log("Couldn't find");
      video = curr.sort(
        (a, b) => a.statistics.viewCount - b.statistics.viewCount
      )[0];
      console.log(video);
      return video;
    }
    let json = await fetch(
      `https://www.googleapis.com/youtube/v3/search?q=${
        prefixes[Math.floor(Math.random() * prefixes.length)]
      }${Math.round(Math.random() * 9999)}&part=snippet`,
      fetchOpts
    ).then((r) => r.json());
    console.log(json);
    let vids = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${json.items
        .map((i) => i.id.videoId)
        .join(",")}&part=statistics,snippet`,
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
    await findVid(5);
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
      {fromNow(`2020-04-18T22:24:16Z`, { zero: false, max: 1 })} ago
      {video.description?.trim()?.length
        ? " – " + niceslice(videoInfo.description)
        : ""}
    </div>
  </div>
{/if}
{#if loading}
  <span class="loading desc">Loading...</span>
{:else}
  <button class="search" on:click={clicked}>
    {#if video}Again!{:else}Go!{/if}
  </button>
{/if}

<style>
  iframe {
    aspect-ratio: 16/9;
    width: 100%;
    margin-bottom: 20px;
    border-radius: 5px;
    overflow: hidden;
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
