/* Puente CMDV (2026-11-11): muestra las pantallas de Google Apps Script sin enviar las cuentas de
   Google del navegador. Con varias cuentas abiertas, Google falla ("No se pudo abrir el archivo").
   La página define window.PUENTE = { api: "<url /exec>" } antes de cargar este archivo.
   1) GET  api?<parámetros de esta página>&modo=puente  → { ok, titulo, html }
   2) google.script.run.fn(args) → POST { puente:true, fn, args } → { __r } o { __error }      */
(function () {
  var cfg = window.PUENTE || {};

  // Reemplazo de google.script.run (mismo uso: withSuccessHandler / withFailureHandler / withUserObject).
  function instalarRun(api) {
    function cadena(ok, mal, obj) {
      return new Proxy({}, {
        get: function (_, k) {
          if (k === "withSuccessHandler") return function (f) { return cadena(f, mal, obj); };
          if (k === "withFailureHandler") return function (f) { return cadena(ok, f, obj); };
          if (k === "withUserObject") return function (u) { return cadena(ok, mal, u); };
          if (typeof k !== "string") return undefined;
          return function () {
            var args = Array.prototype.slice.call(arguments);
            fetch(api, { method: "POST", credentials: "omit", redirect: "follow",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify({ puente: true, fn: k, args: args }) })
              .then(function (r) { if (!r.ok) throw new Error("Error de conexión (" + r.status + ")."); return r.json(); })
              .then(function (d) {
                if (d && d.__error !== undefined) throw new Error(d.__error);
                if (ok) ok(d ? d.__r : null, obj);
              })
              .catch(function (e) {
                var err = e instanceof Error ? e : new Error(String(e));
                if (/Failed to fetch|NetworkError|Load failed/i.test(err.message))
                  err = new Error("No hay conexión con el servidor. Revise su internet e intente nuevamente.");
                if (mal) mal(err, obj); else console.error(err);
              });
          };
        }
      });
    }
    window.google = window.google || {};
    window.google.script = window.google.script || {};
    window.google.script.run = cadena(null, null, undefined);
  }

  function pantalla(titulo, texto, conBoton) {
    var c = document.getElementById("puente");
    if (!c) return;
    c.innerHTML = '<img src="logo.png" alt="Colegio Maese da Vinci">' +
      '<p class="col">Colegio Maese da Vinci</p><h1></h1><p class="tx"></p>' +
      (conBoton ? '<button type="button">Reintentar</button><p class="ay">¿Sigue sin funcionar? Escriba a ' +
        '<a href="mailto:nicolas.parra@maesedavinci.cl">nicolas.parra@maesedavinci.cl</a></p>' : '<div class="gira"></div>');
    c.querySelector("h1").textContent = titulo;
    c.querySelector(".tx").textContent = texto;
    var b = c.querySelector("button");
    if (b) b.onclick = function () { location.reload(); };
  }

  function mostrar(d) {
    var extra = '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<link rel="icon" href="logo.png"><script>(' + instalarRun.toString() + ')(' + JSON.stringify(cfg.api) + ');<\/script>';
    var html = String(d.html || "");
    html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, function (m) { return m + extra; }) : extra + html;
    document.open();
    document.write(html);
    document.close();
    if (d.titulo) document.title = d.titulo;
  }

  var q = location.search.replace(/^\?/, "");
  var url = cfg.api + "?" + (q ? q + "&" : "") + "modo=puente";
  pantalla("Cargando…", "Un momento, por favor.", false);
  fetch(url, { credentials: "omit", redirect: "follow" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (d) { if (!d || !d.ok) throw new Error((d && d.mensaje) || "Respuesta no válida"); mostrar(d); })
    .catch(function (e) {
      console.error(e);
      pantalla("No se pudo cargar la página",
        "Revise su conexión a internet y presione Reintentar. Si el problema continúa, intente más tarde.", true);
    });
})();
