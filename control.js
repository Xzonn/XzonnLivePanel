window.addEventListener("DOMContentLoaded", () => {
  const replaceDictTextArea = document.getElementById("replace-dict");
  const saveButton = document.getElementById("save-button");

  const storedDict = JSON.parse(localStorage.getItem("xz-replace-dict") || "{}");
  let dictText = [];
  for (const [key, value] of Object.entries(storedDict)) {
    dictText.push(`${key} => ${value}`);
  }
  replaceDictTextArea.value = dictText.join("\n");

  saveButton.addEventListener("click", (e) => {
    e.preventDefault();

    const dictText = replaceDictTextArea.value;
    const dict = {};
    dictText.split("\n").forEach((line) => {
      const [key, value] = line.split("=>").map((part) => part.trim());
      if (key && value) {
        dict[key] = value;
      }
    });

    localStorage.setItem("xz-replace-dict", JSON.stringify(dict));
  });
});
