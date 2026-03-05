from typing import List, Set

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

WHITE_LIST = ["default", "lyric_163"]


app = FastAPI()
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


class Client:
  def __init__(self):
    self.input_connections: Set[WebSocket] = set()
    self.output_connections: Set[WebSocket] = set()
    self.last_input_message: str = ""
    self.last_output_message: str = ""


clients: dict[str, Client] = {}


@app.websocket("/ws/input/{client_id}")
async def websocket_input(websocket: WebSocket, client_id: str):
  if client_id not in WHITE_LIST:
    await websocket.close(code=1008, reason="client_id 不在白名单中")
    raise HTTPException(status_code=403, detail="client_id 不在白名单中")

  if client_id not in clients:
    clients[client_id] = Client()

  client = clients[client_id]
  last_message = client.last_input_message
  await websocket.accept()
  await websocket.send_text(client.last_output_message)

  client.input_connections.add(websocket)
  try:
    while True:
      data = await websocket.receive_text()
      if data == last_message:
        continue

      # 1. 存入历史消息列表
      client.last_input_message = data
      # 2. 转发给所有 /output 客户端
      for connection in client.output_connections:
        await connection.send_text(data)

  except WebSocketDisconnect:
    client.input_connections.discard(websocket)
  except Exception as e:
    client.input_connections.discard(websocket)
    print(f"/input WebSocket 接口异常: {e}")


@app.websocket("/ws/output/{client_id}")
async def websocket_output(websocket: WebSocket, client_id: str):
  """/output WebSocket 接口：接收转发的消息"""
  if client_id not in WHITE_LIST:
    await websocket.close(code=1008, reason="client_id 不在白名单中")
    raise HTTPException(status_code=403, detail="client_id 不在白名单中")

  if client_id not in clients:
    clients[client_id] = Client()

  client = clients[client_id]
  last_message = client.last_output_message
  await websocket.accept()
  await websocket.send_text(client.last_input_message)

  client.output_connections.add(websocket)
  try:
    while True:
      data = await websocket.receive_text()
      if data == last_message:
        continue

      # 1. 存入历史消息列表
      client.last_output_message = data
      # 2. 转发给所有 /input 客户端
      for connection in client.input_connections:
        await connection.send_text(data)
  except WebSocketDisconnect:
    client.output_connections.discard(websocket)
  except Exception as e:
    client.output_connections.discard(websocket)
    print(f"/output WebSocket 接口异常: {e}")


@app.get("/", response_class=HTMLResponse)
async def http_output_panel():
  with open("index.html", "r", -1, "utf8") as reader:
    raw = reader.read()
  return raw


@app.get("/clients")
async def get_clients():
  return {
    k: {
      "input_connections": len(v.input_connections),
      "output_connections": len(v.output_connections),
      "last_input_message": v.last_input_message,
      "last_output_message": v.last_output_message,
    }
    for k, v in clients.items()
  }


if __name__ == "__main__":
  import os

  import uvicorn

  os.chdir(os.path.dirname(__file__))
  uvicorn.run(
    app, host="127.0.0.1", port=32810, ssl_certfile="../../Certs/localhost.crt", ssl_keyfile="../../Certs/localhost.key"
  )
