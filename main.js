import { SubtitleClient } from "./helper.js";
import { CommentServerUrl, FadeInTime, StartTime, EndTime, TranslateServerUrl } from "./consts.js";

const MinLineLength = 16;
const splitLines = (text) => {
  const newTexts = [text.slice(0, MinLineLength)];
  for (let i = MinLineLength; i < text.length; i += 1) {
    newTexts.push(text[i]);
    if (/[.?!。？！]/.test(text[i]) && i < text.length - 1) {
      newTexts.push("\n");
      newTexts.push(text.slice(i + 1, i + 1 + MinLineLength));
      i += MinLineLength;
    }
  }
  return newTexts.join("");
};

window.addEventListener("DOMContentLoaded", () => {
  let replaceDict = {};
  let isLyric = null;
  let translateClient = null;
  let commentClient = null;

  const replaceText = (text) => {
    let newText = text;
    for (const [key, value] of Object.entries(replaceDict)) {
      newText = newText.split(key).join(value);
    }
    return newText;
  };

  document.querySelector("#subtitle-back").innerHTML = document.querySelector("#subtitle-front").innerHTML;

  const timeFront = document.getElementById("time-front");
  const timeBack = document.getElementById("time-back");

  const updateTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    timeFront.textContent = timeString;
    timeBack.textContent = timeString;
  };

  updateTime();
  setInterval(updateTime, 1000);

  const originalBlocks = document.querySelectorAll(".original");
  const translatedBlocks = document.querySelectorAll(".translated");
  const commentBlocks = document.querySelectorAll(".comment");
  const handleTranslate = (event) => {
    const { original = "", translated = "" } = JSON.parse(event.data || "{}");
    originalBlocks.forEach((block) => (block.innerText = splitLines(replaceText(original))));
    translatedBlocks.forEach((block) => (block.innerText = splitLines(replaceText(translated))));
  };
  const handleComment = (event) => {
    const comment = event.data || "";
    commentBlocks.forEach((block) => (block.innerText = replaceText(comment)));
  };

  const timeline = document.getElementById("timeline");
  const progress = document.getElementById("timeline-progress");
  const mario = document.getElementById("mario-sprite");
  const maxWidth = progress.clientWidth;
  const marioHalfWidth = mario.clientWidth / 2;
  const timelineDuration = EndTime - StartTime;
  const fadeInDuration = StartTime - FadeInTime;
  const changeTimelineBar = () => {
    const now = new Date();
    const elapsed = now - StartTime;
    const percentage = elapsed / timelineDuration;

    const opacity = Math.min(Math.max((now - FadeInTime) / fadeInDuration, 0), 1);
    timeline.style.opacity = opacity;

    const progressLeft = Math.max(Math.min(percentage - 1, 0), -1) * maxWidth;
    const marioLeft = percentage * maxWidth - marioHalfWidth;
    progress.style.left = `${progressLeft}px`;
    mario.style.left = `${marioLeft}px`;

    if (marioLeft > maxWidth + marioHalfWidth) {
      clearInterval(timelineInterval);
    }
  };
  const timelineInterval = setInterval(changeTimelineBar, 15);

  window.addEventListener("beforeunload", () => {
    if (translateClient) {
      translateClient.stop();
    }
    if (commentClient) {
      commentClient.stop();
    }
  });

  // 监听 localStorage 变化以更新配置
  const parseConfiguration = (configuration) => {
    const { replaceDict: newReplaceDict = {}, isLyric: newIsLyric = false } = configuration || {};
    replaceDict = newReplaceDict;
    if (isLyric !== newIsLyric) {
      isLyric = newIsLyric;
      document.body.classList.toggle("lyric", isLyric);
      if (translateClient) {
        translateClient.stop();
      }
      if (commentClient) {
        commentClient.stop();
      }
      if (!isLyric) {
        translateClient = new SubtitleClient(TranslateServerUrl, handleTranslate);
        translateClient.start();
        commentClient = new SubtitleClient(CommentServerUrl, handleComment);
        commentClient.start();
      }
    }
  };
  window.addEventListener("storage", (event) => {
    if (event.key === "xz-configuration") {
      parseConfiguration(JSON.parse(event.newValue || "{}"));
    }
  });
  parseConfiguration(JSON.parse(localStorage.getItem("xz-configuration") || "{}"));
});
