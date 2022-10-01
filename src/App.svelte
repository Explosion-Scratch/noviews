<script>
  import ToastContainer from "./ToastContainer.svelte";
  import NoViews from "./NoViews.svelte";
  import Settings from "./Settings.svelte";
  import notifs from "./toast.js";
  import { onMount } from "svelte";
  let showSettings = false;
  let anonymous = false;
  let settings = {};
  let info = {
    token: {},
    loaded: false,
    signedIn: false,
  };
  let queryParams = {};

  $: {
    if (anonymous) {
      queryParams.key = `AIzaSyC_5nnMeplNjnAVC5tyS5OT5tDxnt43QFA`;
    }
    for (let [key, value] of Object.entries(settings)) {
      if (settings[key]) {
        queryParams[key] = value;
      } else {
        delete queryParams[key];
      }
    }
    if (settings.publishedAfter) {
      queryParams.publishedAfter = formatDate(
        new Date(settings.publishedAfter)
      );
    }
    if (settings.publishedBefore) {
      queryParams.publishedBefore = formatDate(
        new Date(settings.publishedBefore)
      );
    }
    delete queryParams.maxViews;
    delete queryParams.searchPattern;
  }

  onMount(() => {
    console.log("Test")
    console.log(notifs)
    import("https://cdn.skypack.dev/tippy.js").then(({ default: tippy }) => {
      window.tippy = tippy;
      setInterval(() => {
        [
          ...document.querySelectorAll(
            "[data-tippy-content]:not([data-tippy-checked])"
          ),
        ].forEach((i) => {
          tippy(i, {
            theme: "light-border",
            content: i.getAttribute("data-tippy-content"),
          });
          i.setAttribute("data-tippy-checked", "true");
        });
      }, 500);
    });
    try {
      settings = JSON.parse(localStorage.settings);
      if (typeof settings !== "object") {
        settings = {};
      }
    } catch (e) {}
    info.token = JSON.parse(localStorage?.token || "{}");
    if (
      typeof info.token !== "object" ||
      !(
        info.token.access_token &&
        info.token.expires_at &&
        info.token.token_type
      ) ||
      info.token.expires_at < Date.now()
    ) {
      console.log(info.token, "invalid");
      info.token = {};
      info.signedIn = false;
    } else {
      console.log("Signed in");
      info.signedIn = true;
    }

    Object.assign(window, { info, settings });
    settings = {
      publishedAfter: new Date("January 1, 2000"),
      publishedBefore: new Date(),
      language: "en",
      videoDuration: "any",
      safeSearch: "moderate",
      maxViews: 1,
      ...settings,
    };
    start();
    setInterval(() => {
      localStorage.setItem("settings", JSON.stringify(settings));
    }, 500);
  });

  async function start() {
    await until(() => window.gapi);
    console.log(window.gapi);
    console.log("GAPI loaded");
    gapi.load("client", () => {
      initClient().then(() => {
        info.loaded = true;
        notifs.show("Loaded!")
      });
    });
  }

  function initClient() {
    return new Promise((resolve) => {
      gapi.client
        .init({
          // Your API key will be automatically added to the Discovery Document URLs.
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest",
          ],
          // clientId and scope are optional if auth is not required.
          clientId:
            "624071780217-cp736o7egfe97s941dc2kvmv5o7oavbs.apps.googleusercontent.com",
          scope: "https://www.googleapis.com/auth/youtube.readonly",
        })
        .then(() => resolve());
    });
  }

  async function until(fn, args = []) {
    return new Promise((resolve) => {
      async function repeat() {
        let result;
        try {
          result = fn(...args);
        } catch (_) {}
        if (!result) {
          await requestAnimationFrame(repeat);
        } else {
          resolve(result);
        }
      }
      repeat();
    });
  }

  async function signin() {
    const user = await gapi.auth2.getAuthInstance().signIn();
    console.log(user);
    let response = user.getAuthResponse();
    info.signedIn = true;
    info.token = response;
    localStorage.setItem("token", JSON.stringify(info.token));
  }

  function formatDate(d) {
    d = new Date(d.getTime() - Math.random() * 1000 * 60 * 60 * 24);
    function pad(n) {
      return n < 10 ? "0" + n : n;
    }
    return (
      d.getUTCFullYear() +
      "-" +
      pad(d.getUTCMonth() + 1) +
      "-" +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      ":" +
      pad(d.getUTCMinutes()) +
      ":" +
      pad(d.getUTCSeconds()) +
      "Z"
    );
  }
</script>

<svelte:head>
  <script src="https://apis.google.com/js/api.js"></script>
  <link
    rel="stylesheet"
    href="https://unpkg.com/tippy.js@6.3.7/themes/light-border.css"
  />
  <link
    rel="stylesheet"
    href="https://unpkg.com/tippy.js@6.3.7/dist/tippy.css"
  />
</svelte:head>

<div class="container">
  {#if !info.signedIn && !anonymous}
    <h2>NoViews</h2>
    <span class="desc">Find a random YouTube video with 1 or less views</span>
    <button
      data-tippy-content="Sign in with google"
      disabled={!info.loaded}
      class="button"
      on:click={() => info.loaded && signin()}
      >{#if !info.loaded}Loading libraries...{:else}Go!{/if}</button
    >
    {#if info.loaded}
      <span
        data-tippy-content="This may or may not work depending on how many people use it"
        class="below"
        on:click={() => (anonymous = true)}
        >Use without signing in - May be rate limited</span
      >
    {/if}
  {/if}
  {#if info.signedIn || anonymous}
    <NoViews
      on:settings={() => (showSettings = true)}
      fetchOpts={{
        headers: {
          Authorization: `${info.token.token_type} ${info.token.access_token}`,
        },
      }}
      showSignout={true}
      maxViews={settings.maxViews || 1}
      searchPattern={settings.searchPattern}
      {queryParams}
    />
  {/if}
  {#if showSettings}<Settings
      bind:opts={settings}
      on:close={() => (showSettings = false,notifs.show("Saved settings"))}
    />{/if}
</div>

<ToastContainer></ToastContainer>

<style>
  .below {
    color: #999 !important;
    text-decoration: underline;
    cursor: pointer;
    font-style: italic;
    text-align: left;
    margin-top: 10px;
  }
  :global(body) {
    padding: 0 !important;
  }
  :global(.button) {
    width: 100%;
    border: 1px solid #0002;
    border-radius: 2px;
    padding: 10px 20px;
    background: #0000;
    cursor: pointer;
    color: #333;
  }
  :global(.button:hover) {
    background: #00000009;
  }
  :global(.button:focus) {
    outline: none;
    box-shadow: 0 0 0 2px #0001;
  }
  :global(.container) {
    width: 80vw;
    max-width: 400px;
    margin: 0 auto;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  :global(.desc) {
    color: #888;
    font-style: italic;
    margin-bottom: 20px;
  }
  :global(.error) {
    font-style: italic;
    color: #c66;
    margin-bottom: 20px;
  }
</style>
