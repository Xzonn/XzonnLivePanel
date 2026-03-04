(() => {
  const card = document.getElementById("pm30th-card");
  const imgFront = document.getElementById("pm30th-img-front");
  const imgBack = document.getElementById("pm30th-img-back");

  const BASE_URL = "output/";
  const MIN = 1;
  const MAX = 1025;
  const INTERVAL = 5000; // ms

  // 格式化为四位数字符串
  function pad(n) {
    return String(n).padStart(4, "0");
  }

  function randomIndex() {
    return Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  }

  function buildUrl(n) {
    return `${BASE_URL}${pad(n)}.webp`;
  }

  let isFront = true; // 当前显示的面
  let totalFlips = 0; // 累计翻转次数，用于持续累加角度
  let currentIdx = randomIndex();
  let nextIdx = randomIndex();

  // 初始化：前面直接显示
  imgFront.src = buildUrl(currentIdx);

  // 预载下一张到背面
  function prepareNext() {
    nextIdx = randomIndex();
    if (isFront) {
      imgBack.src = buildUrl(nextIdx);
    } else {
      imgFront.src = buildUrl(nextIdx);
    }
  }

  // 执行翻转
  function flip() {
    isFront = !isFront;
    totalFlips++;
    card.classList.add("active");
    card.style.transform = `rotateY(${totalFlips * 180}deg)`;
    setTimeout(() => {
      card.classList.remove("active");
      if (totalFlips > 2) {
        // 为了避免数值过大，超过一定次数后重置
        totalFlips = totalFlips % 2;
      }
      card.style.transform = `rotateY(${totalFlips * 180}deg)`;
      prepareNext();
    }, 1000); // 比动画时间稍长，确保动画完成
    currentIdx = nextIdx;
  }

  // 初始预载
  prepareNext();

  // 定时切换
  setInterval(flip, INTERVAL);
})();
