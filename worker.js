const HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cloudflare Mesh Panel</title>

<style>
*{box-sizing:border-box}

body{
  margin:0;
  background:#f5f7fa;
  color:#172033;
  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
}

header{
  padding:24px 30px;
  background:#fff;
  border-bottom:1px solid #e5e7eb;
  display:flex;
  justify-content:space-between;
  align-items:center
}

h1{margin:0;font-size:24px}
header p{margin:5px 0 0;color:#6b7280}

.status{
  padding:8px 14px;
  border-radius:999px;
  font-size:13px
}

.online{
  background:#dcfce7;
  color:#166534
}

.offline{
  background:#fee2e2;
  color:#991b1b
}

main{
  width:min(1100px,calc(100% - 40px));
  margin:30px auto
}

.cards{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:16px;
  margin-bottom:24px
}

.card,.panel{
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:14px
}

.card{
  padding:20px
}

.card span{
  color:#6b7280;
  font-size:13px
}

.card strong{
  display:block;
  margin-top:8px;
  font-size:28px
}

.panel{
  margin-bottom:24px;
  overflow:hidden
}

.panel-header{
  padding:18px 20px;
  border-bottom:1px solid #e5e7eb;
  display:flex;
  justify-content:space-between;
  align-items:center
}

.panel-header h2{
  margin:0;
  font-size:18px
}

button{
  border:0;
  border-radius:8px;
  padding:8px 14px;
  background:#111827;
  color:#fff;
  cursor:pointer
}

.row{
  padding:16px 20px;
  border-bottom:1px solid #f0f0f0;
  display:flex;
  justify-content:space-between;
  gap:20px
}

.row:last-child{
  border-bottom:0
}

.row strong{
  display:block
}

.row small{
  display:block;
  margin-top:4px;
  color:#6b7280
}

.badge{
  padding:5px 9px;
  background:#f3f4f6;
  border-radius:6px;
  font-size:11px;
  white-space:nowrap
}

.empty,.error,.loading{
  padding:24px;
  color:#6b7280
}

.error{
  color:#b91c1c
}

@media(max-width:700px){
  .cards{
    grid-template-columns:1fr
  }

  header{
    padding:20px
  }

  main{
    width:calc(100% - 24px)
  }
}
</style>
</head>

<body>

<header>

<div>
<h1>Cloudflare Mesh</h1>
<p>Private Network Dashboard</p>
</div>

<div id="status" class="status offline">
Connecting...
</div>

</header>

<main>

<section class="cards">

<div class="card">
<span>Worker</span>
<strong id="worker">—</strong>
</div>

<div class="card">
<span>Mesh Routes</span>
<strong id="routes-count">—</strong>
</div>

<div class="card">
<span>Devices</span>
<strong id="devices-count">—</strong>
</div>

</section>


<section class="panel">

<div class="panel-header">
<h2>Mesh Routes</h2>
<button onclick="loadRoutes()">刷新</button>
</div>

<div id="routes">
<div class="loading">Loading...</div>
</div>

</section>


<section class="panel">

<div class="panel-header">
<h2>Devices</h2>
<button onclick="loadDevices()">刷新</button>
</div>

<div id="devices">
<div class="loading">Loading...</div>
</div>

</section>

</main>


<script>

function esc(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}


async function api(path){

  const response =
    await fetch(path,{
      cache:"no-store"
    });

  const data =
    await response.json();

  if(!response.ok || data.ok === false){
    throw new Error(
      data.error || "Request failed"
    );
  }

  return data;
}


async function health(){

  try{

    const data =
      await api("/api/health");

    document
      .getElementById("worker")
      .textContent="Online";

    document
      .getElementById("status")
      .textContent="Online";

    document
      .getElementById("status")
      .className="status online";

  }catch(e){

    document
      .getElementById("worker")
      .textContent="Offline";

    document
      .getElementById("status")
      .textContent="Error";

    document
      .getElementById("status")
      .className="status offline";
  }
}


async function loadRoutes(){

  const box =
    document.getElementById("routes");

  box.innerHTML =
    '<div class="loading">Loading...</div>';

  try{

    const data =
      await api("/api/routes");

    const routes =
      Array.isArray(data.routes)
        ? data.routes
        : [];

    document
      .getElementById("routes-count")
      .textContent=routes.length;

    if(!routes.length){

      box.innerHTML =
        '<div class="empty">No routes.</div>';

      return;
    }

    box.innerHTML =
      routes.map(route => `

        <div class="row">

          <div>

            <strong>
              ${esc(
                route.network ||
                route.cidr ||
                "Unknown"
              )}
            </strong>

            <small>
              ${esc(
                route.comment ||
                route.description ||
                ""
              )}
            </small>

          </div>

          <span class="badge">
            ${esc(
              route.tunnel_id ||
              route.tunnelId ||
              "—"
            )}
          </span>

        </div>

      `).join("");

  }catch(e){

    box.innerHTML =
      '<div class="error">' +
      esc(e.message) +
      '</div>';
  }
}


async function loadDevices(){

  const box =
    document.getElementById("devices");

  box.innerHTML =
    '<div class="loading">Loading...</div>';

  try{

    const data =
      await api("/api/devices");

    const devices =
      Array.isArray(data.devices)
        ? data.devices
        : [];

    document
      .getElementById("devices-count")
      .textContent=devices.length;

    if(!devices.length){

      box.innerHTML =
        '<div class="empty">No devices.</div>';

      return;
    }

    box.innerHTML =
      devices.map(device => `

        <div class="row">

          <div>

            <strong>
              ${esc(
                device.name ||
                device.hostname ||
                "Unnamed"
              )}
            </strong>

            <small>
              ${esc(
                device.platform ||
                "Unknown"
              )}
            </small>

          </div>

          <span class="badge">
            ${esc(
              device.client_version ||
              device.version ||
              "—"
            )}
          </span>

        </div>

      `).join("");

  }catch(e){

    box.innerHTML =
      '<div class="error">' +
      esc(e.message) +
      '</div>';
  }
}


async function refresh(){

  await Promise.all([
    health(),
    loadRoutes(),
    loadDevices()
  ]);

}


refresh();

</script>

</body>
</html>`;


async function cfAPI(
  env,
  path
){

  const response =
    await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" +
      env.CF_ACCOUNT_ID +
      path,
      {
        headers:{
          "Authorization":
            "Bearer " +
            env.CF_API_TOKEN,

          "Content-Type":
            "application/json"
        }
      }
    );

  const data =
    await response.json();

  if(
    !response.ok ||
    !data.success
  ){

    throw new Error(
      JSON.stringify(
        data.errors ||
        "Cloudflare API error"
      )
    );
  }

  return data.result;
}


export default {

  async fetch(
    request,
    env
  ){

    const url =
      new URL(request.url);


    /*
     * Health
     */

    if(
      url.pathname ===
      "/api/health"
    ){

      return Response.json({
        ok:true,
        service:"cf-mesh-panel",
        time:
          new Date().toISOString()
      });

    }


    /*
     * Mesh Routes
     */

    if(
      url.pathname ===
      "/api/routes"
    ){

      try{

        const routes =
          await cfAPI(
            env,
            "/teamnet/routes"
          );

        return Response.json({
          ok:true,
          routes
        });

      }catch(error){

        return Response.json(
          {
            ok:false,
            error:String(error)
          },
          {
            status:500
          }
        );
      }

    }


    /*
     * Devices
     */

    if(
      url.pathname ===
      "/api/devices"
    ){

      try{

        const devices =
          await cfAPI(
            env,
            "/devices/physical-devices"
          );

        return Response.json({
          ok:true,
          devices
        });

      }catch(error){

        return Response.json(
          {
            ok:false,
            error:String(error)
          },
          {
            status:500
          }
        );
      }

    }


    /*
     * Frontend
     */

    return new Response(
      HTML,
      {
        headers:{
          "Content-Type":
            "text/html;charset=UTF-8",

          "Cache-Control":
            "no-store"
        }
      }
    );

  }

};
