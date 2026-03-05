// ==UserScript==
// @name         WebSocket 歌词发送器
// @namespace    http://tampermonkey.net/
// @version      2026-03-03
// @description  try to take over the world!
// @author       You
// @match        https://music.163.com/
// @icon         http://163.com/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const createObserver = () => {
    const contentFrame = document.querySelector('iframe[name="contentFrame"]');
    const playerNode = document.querySelector(".m-playbar");
    const playlistActionNode = playerNode.querySelector('a[data-action="panel"]');

    const websocket = new WebSocket("wss://www.www.localhost:32810/ws/input/lyric_163");

    let lastLine = null;

    const callback = (mutationsList, observer) => {
      const lyricNode = playerNode.querySelector(".listlyric");
      if (!lyricNode) {
        return;
      }
      const currentLine = (lyricNode.querySelector("p.z-sel") || lyricNode.querySelector("p"))?.innerText.trim() || "";
      const lines = currentLine
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const original = lines[0] || "";
      const translated = lines[1] || "";

      const isPlaying = playerNode.querySelector("a[data-action='pause']") !== null;
      const title = playerNode.querySelector(".play .words .name")?.textContent.trim() || "";
      const artist = playerNode.querySelector(".play .words .by")?.textContent.trim() || "";
      const time = playerNode.querySelector(".play .time")?.textContent.trim() || "";
      const [current, total] = time.split("/").map((t) => t.trim());
      const cover =
        playerNode
          .querySelector(".head img")
          ?.src.replace(/(\?.*)?$/, "")
          .replace(/^http:\/\//, "https://") || "";

      const information = JSON.stringify({ title, artist, original, translated, current, total, cover, isPlaying });
      if (information === lastLine) {
        return;
      }

      websocket.send(information);
      lastLine = information;
    };

    const observer = new MutationObserver(callback);
    observer.observe(playerNode, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
    websocket.onmessage = async (event) => {
      const data = JSON.parse(event.data || "{}");
      const { url = "" } = data;
      if (url.startsWith("https://music.163.com/")) {
        const hash = url.replace(/^https:\/\/music\.163\.com\//, "");
        location.hash = `#/${hash}`;
        const isSong = hash.startsWith("song");

        await sleep(1000);

        const playButton = contentFrame.contentDocument.querySelector(
          `#content-operation a[data-res-action="${isSong ? "addto" : "play"}"]`,
        );
        playButton.click();
        await sleep(100);
        playlistActionNode.click();
      }
    };
    websocket.onclose = (event) => {
      observer.disconnect();
    };
  };

  const button = document.createElement("button");
  button.textContent = "发送歌词";
  button.style.padding = "10px 20px";
  button.style.position = "fixed";
  button.style.top = "10px";
  button.style.right = "10px";
  button.style.zIndex = "1000";

  button.addEventListener("click", async (e) => {
    e.preventDefault();
    createObserver();

    await sleep(100);
    document.querySelector('.m-playbar a[data-action="panel"]')?.click();
  });
  document.body.appendChild(button);
})();
