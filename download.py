import os

import requests

os.chdir(os.path.dirname(__file__))
os.makedirs("output", exist_ok=True)

for file_name in os.listdir("pokemon_30th"):
  if not file_name.endswith(".png"):
    continue

  path =  f"https://www.pokemon.co.jp/ex/30th_logo/assets/img/thumbnail/{file_name.replace('.png', '.webp')}"

  with open(f"output/{file_name.replace('.png', '.webp')}", "wb") as writer:
    response = requests.get(path)
    writer.write(response.content)
