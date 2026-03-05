import { SubtitleClient } from "./helper.js";

const LyricUrl = "wss://www.www.localhost:32810/ws/output/lyric_163";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".back").innerHTML = document.querySelector(".front").innerHTML;

  // DOM 元素获取
  const coverImg = document.querySelectorAll(".cover-image");
  const coverWrapper = document.querySelectorAll(".cover-wrapper");
  const songTitle = document.querySelectorAll(".title");
  const songArtist = document.querySelectorAll(".artist");
  const timeCurrent = document.querySelectorAll(".time-current");
  const timeTotal = document.querySelectorAll(".time-total");
  const progressFill = document.querySelectorAll("#progress-fill");
  const lyricOrig = document.querySelectorAll(".lyric-original");
  const lyricTrans = document.querySelectorAll(".lyric-translated");

  // 辅助函数：将 "MM:SS" 格式的时间转换为秒数
  function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  const createAnimatedUpdater = (propertyName) => {
    let lastValue = null;
    let timeout = null;
    return (elements, data) => {
      const newValue = data[propertyName];
      if (newValue === undefined || newValue === lastValue) return;
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      elements.forEach((el) => {
        // Fade out
        el.classList.add("fade");
      });
      timeout = setTimeout(() => {
        elements.forEach((el) => {
          el.textContent = newValue || "\u00a0";
          el.classList.remove("fade");
        });
        timeout = null;
      }, 200);
      lastValue = newValue;
    };
  };
  const createSimpleUpdater = (propertyName, callback) => {
    let lastValue = null;
    return (elements, data) => {
      const newValue = data[propertyName];
      if (newValue === undefined || newValue === lastValue) return;
      callback(elements, newValue);
      lastValue = newValue;
    };
  };

  const updateTitle = createAnimatedUpdater("title");
  const updateArtist = createAnimatedUpdater("artist");
  const updateOriginal = createAnimatedUpdater("original");
  const updateTranslated = createAnimatedUpdater("translated");

  const updateCover = createSimpleUpdater("cover", (elements, newValue) => {
    elements.forEach((el) => {
      el.src = newValue;
    });
  });
  const updateCoverState = createSimpleUpdater("isPlaying", (elements, isPlaying) => {
    elements.forEach((el) => {
      el.classList.toggle("playing", isPlaying);
    });
  });

  const updateCurrentSec = createSimpleUpdater("current", (elements, newValue) => {
    elements.forEach((el) => {
      el.textContent = newValue;
    });
  });
  const updateTotalSec = createSimpleUpdater("total", (elements, newValue) => {
    elements.forEach((el) => {
      el.textContent = newValue;
    });
  });

  // 更新界面逻辑
  function updatePlayerUI(data) {
    // 1. 更新标题和艺术家
    updateTitle(songTitle, data);
    updateArtist(songArtist, data);

    // 2. 更新封面及旋转动画状态
    updateCover(coverImg, data);
    updateCoverState(coverWrapper, data);

    // 3. 更新进度条和时间
    updateCurrentSec(timeCurrent, data);
    updateTotalSec(timeTotal, data);

    const currentSec = timeToSeconds(data.current);
    const totalSec = timeToSeconds(data.total);

    if (totalSec > 0) {
      const percentage = (currentSec / totalSec) * 100;
      progressFill.forEach((el) => {
        el.style.width = `${percentage}%`;
      });
    } else {
      progressFill.forEach((el) => {
        el.style.width = "0%";
      });
    }

    // 4. 更新歌词
    updateOriginal(lyricOrig, data);
    updateTranslated(lyricTrans, data);
  }

  const client = new SubtitleClient(LyricUrl, (event) => {
    try {
      const data = JSON.parse(event.data);
      updatePlayerUI(data);
    } catch (e) {
      console.error("解析 WebSocket 数据失败:", e);
    }
  });
  client.start();
});
