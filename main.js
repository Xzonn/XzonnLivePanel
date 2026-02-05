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

let replaceDict = JSON.parse(localStorage.getItem("xz-replace-dict") || "{}");
const replaceText = (text) => {
  let newText = text;
  for (const [key, value] of Object.entries(replaceDict)) {
    newText = newText.split(key).join(value);
  }
  return newText;
};
window.addEventListener("storage", (event) => {
  if (event.key === "xz-replace-dict") {
    replaceDict = JSON.parse(event.newValue || "{}");
  }
});

class SubtitleClient {
  MaxReconnectAttempts = 10;

  constructor(url, onmessage) {
    this.url = url;
    this.onmessage = onmessage;

    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
  }

  start() {
    const ws = new WebSocket(this.url);

    ws.onopen = () => {
      console.log("已连接到服务器");
      this.reconnectAttempts = 0;
    };

    ws.onmessage = (event) => this.onmessage(event);

    ws.onclose = (event) => {
      console.log("连接断开，代码: " + event.code);

      if (event.code !== 1000) {
        if (this.reconnectAttempts < this.MaxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`尝试重连 (${this.reconnectAttempts}/${this.MaxReconnectAttempts})...`);

          this.reconnectTimer = setTimeout(this.start.bind(this), 10000 * this.reconnectAttempts);
        } else {
          console.log("已达到最大重连次数，停止尝试");
        }
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket错误:", error);
    };
  }
}

window.addEventListener("DOMContentLoaded", () => {
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
  const translatedClient = new SubtitleClient(TranslateServerUrl, (event) => {
    const { original = "", translated = "" } = JSON.parse(event.data || "{}");
    originalBlocks.forEach((block) => (block.innerText = splitLines(replaceText(original))));
    translatedBlocks.forEach((block) => (block.innerText = splitLines(replaceText(translated))));
  });
  translatedClient.start();
  const commentClient = new SubtitleClient(CommentServerUrl, (event) => {
    const comment = event.data || "";
    commentBlocks.forEach((block) => (block.innerText = replaceText(comment)));
  });
  commentClient.start();

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
    if (translatedClient.reconnectTimer) clearTimeout(translatedClient.reconnectTimer);
    if (commentClient.reconnectTimer) clearTimeout(commentClient.reconnectTimer);
  });
});
