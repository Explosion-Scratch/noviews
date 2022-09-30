<script>
  import NoViews from "./NoViews.svelte";
  import { onMount } from "svelte";

  let info = {
    token: {},
    signedIn: false,
  };
  onMount(start);
  async function start() {
    await until(() => window.gapi);
    console.log(window.gapi);
    console.log("GAPI loaded");
    gapi.load("client", initClient);
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
  }
</script>

<svelte:head>
  <script src="https://apis.google.com/js/api.js"></script>
</svelte:head>

<div class="container">
  {#if !info.signedIn}
    <h2>NoViews</h2>
    <span class="desc">Find a random YouTube video with 1 or less views</span>
    <button on:click={signin}>Signin</button>
  {:else}
    <NoViews
      fetchOpts={{
        headers: {
          Authorization: `${info.token.token_type} ${info.token.access_token}`,
        },
      }}
    />
  {/if}
</div>

<style>
  :global(button) {
    width: 100%;
    border: 1px solid #0002;
    border-radius: 2px;
    padding: 10px 20px;
    background: #0000;
    cursor: pointer;
    color: #333;
  }
  :global(button:hover) {
    background: #00000009;
  }
  :global(button:focus) {
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
</style>
