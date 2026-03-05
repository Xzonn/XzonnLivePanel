class SubtitleClient {
  MaxReconnectAttempts = 10;

  constructor(url, onmessage) {
    this.url = url;
    this.onmessage = onmessage;

    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.ws = null;
  }

  start() {
    const ws = new WebSocket(this.url);
    this.ws = ws;

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

  stop() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close(1000);
    }
  }
}

export { SubtitleClient };
