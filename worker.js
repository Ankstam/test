const HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CF Mesh Panel</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 1000px;
      margin: 40px auto;
      padding: 0 20px;
      background: #f5f5f5;
      color: #222;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,.08);
    }

    h1 {
      margin-top: 0;
    }

    button {
      padding: 10px 16px;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
    }

    pre {
      white-space: pre-wrap;
      word-break: break-word;
      background: #111;
      color: #eee;
      padding: 15px;
      border-radius: 8px;
      overflow: auto;
    }

    .ok {
      color: green;
    }

    .error {
      color: red;
    }
  </style>
</head>

<body>
  <div class="card">
    <h1>Cloudflare Mesh Panel</h1>
    <p id="status">正在检查 Worker...</p>
    <button onclick="loadData()">刷新</button>
  </div>

  <div class="card">
    <h2>Routes</h2>
    <pre id="routes">Loading...</pre>
  </div>

  <div class="card">
    <h2>Devices</h2>
    <pre id="devices">Loading...</pre>
  </div>

<script>
async function loadData() {
  const status = document.getElementById("status");

  try {
    const health = await fetch("/api/health");
    const healthData = await health.json();

    if (!health.ok) {
      throw new Error(JSON.stringify(healthData));
    }

    status.textContent = "Worker 正常运行";
    status.className = "ok";

    const routes = await fetch("/api/routes");
    document.getElementById("routes").textContent =
      JSON.stringify(await routes.json(), null, 2);

    const devices = await fetch("/api/devices");
    document.getElementById("devices").textContent =
      JSON.stringify(await devices.json(), null, 2);

  } catch (err) {
    status.textContent = "错误: " + err.message;
    status.className = "error";
  }
}

loadData();
</script>
</body>
</html>`;

async function cfAPI(env, path) {
  if (!env.CF_ACCOUNT_ID || !env.CF_API_TOKEN) {
    throw new Error("Missing CF_ACCOUNT_ID or CF_API_TOKEN");
  }

  const response = await fetch(
    "https://api.cloudflare.com/client/v4/accounts/" +
    env.CF_ACCOUNT_ID +
    path,
    {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + env.CF_API_TOKEN,
        "Content-Type": "application/json"
      }
    }
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      success: false,
      error: "Cloudflare API returned non-JSON response",
      raw: text
    };
  }

  return {
    status: response.status,
    data
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health") {
        return Response.json({
          success: true,
          worker: "ok",
          time: new Date().toISOString()
        });
      }

      if (url.pathname === "/api/routes") {
        const result = await cfAPI(
          env,
          "/teamnet/routes"
        );

        return Response.json(result.data, {
          status: result.status
        });
      }

      if (url.pathname === "/api/devices") {
        const result = await cfAPI(
          env,
          "/devices/physical-devices"
        );

        return Response.json(result.data, {
          status: result.status
        });
      }

      return new Response(HTML, {
        headers: {
          "content-type": "text/html; charset=UTF-8"
        }
      });

    } catch (error) {
      return Response.json(
        {
          success: false,
          error: error instanceof Error
            ? error.message
            : String(error)
        },
        {
          status: 500
        }
      );
    }
  }
};
