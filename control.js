window.addEventListener("DOMContentLoaded", () => {
  const isLyricRadios = document.getElementsByName("is-lyric");
  const replaceDictTextArea = document.getElementById("replace-dict");
  const songUrlInput = document.getElementById("song-url");
  const saveButton = document.getElementById("save-button");

  const storedConfiguration = JSON.parse(localStorage.getItem("xz-configuration") || "{}");

  const storedIsLyric = storedConfiguration["isLyric"];
  for (const radio of isLyricRadios) {
    if (radio.value === `${Boolean(storedIsLyric)}`) {
      radio.checked = true;
      break;
    }
  }
  const storedDict = storedConfiguration["replaceDict"] || JSON.parse(localStorage.getItem("xz-replace-dict") || "{}");
  let dictText = [];
  for (const [key, value] of Object.entries(storedDict)) {
    dictText.push(`${key} => ${value}`);
  }
  replaceDictTextArea.value = dictText.join("\n");

  saveButton.addEventListener("click", (e) => {
    e.preventDefault();

    const isLyric = document.querySelector('input[name="is-lyric"]:checked')?.value === "true";
    const dictText = replaceDictTextArea.value;
    const replaceDict = {};
    dictText.split("\n").forEach((line) => {
      const [key, value] = line.split("=>").map((part) => part.trim());
      if (key && value) {
        replaceDict[key] = value;
      }
    });

    const newConfiguration = JSON.stringify({
      ...storedConfiguration,
      replaceDict,
      isLyric,
    });
    if (newConfiguration !== localStorage.getItem("xz-configuration")) {
      localStorage.setItem("xz-configuration", newConfiguration);
    }

    const songUrl = songUrlInput.value.trim();
    if (songUrl) {
      const websocket = new WebSocket("wss://www.www.localhost:32810/ws/output/lyric_163");
      websocket.onopen = () => {
        websocket.send(JSON.stringify({ url: songUrl }));
        websocket.close();
      };
      songUrlInput.value = "";
    }
  });
});
