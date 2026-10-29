/*!
 * CMDV Base 1.0.0 · componentes comunes de los sistemas del Colegio Maese da Vinci
 * Uso: <link rel="stylesheet" href=".../base/1.0.0/cmdv.css"> + <script src=".../base/1.0.0/cmdv.js"></script>
 * Expone window.CX. El contenedor (o un ancestro) debe tener la clase "cx".
 */
(function (global) {
  "use strict";
  const VERSION = "1.0.0";
  const COLORES = ["var(--cx-indigo)", "var(--cx-teal)", "var(--cx-orange)", "var(--cx-purple)", "var(--cx-blue)", "var(--cx-green)", "var(--cx-red)"];
  const el = x => typeof x === "string" ? document.getElementById(x) || document.querySelector(x) : x;

  // ---------- utilidades ----------
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pesos = n => "$" + Math.round(Number(n) || 0).toLocaleString("es-CL");
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  /** Iniciales: "Navia Núñez Marcela Daniela" (apellidos primero, 4 palabras) → "MN"; "Marcela Navia" → "MN". */
  function iniciales(nombre) {
    const p = String(nombre || "").trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "?";
    if (p.length === 1) return p[0].slice(0, 2);
    if (p.length >= 3) return p[2][0] + p[0][0];
    return p[0][0] + p[1][0];
  }
  const colorDe = s => COLORES[[...String(s || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORES.length];
  const avatar = (nombre, color) => `<span class="cx-av" style="background:${color || colorDe(nombre)}">${esc(iniciales(nombre))}</span>`;
  const tag = (txt, color) => `<span class="cx-tag cx-t-${color || "gray"}">${esc(txt)}</span>`;
  const CHEV = '<svg class="cx-chev" width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m1.5 1.5 5 5-5 5"/></svg>';
  const LUPA = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="m11 11 3.5 3.5"/></svg>';
  function debounce(fn, ms) { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms || 180); }; }
  const guardar = (k, v) => { try { localStorage.setItem("cx:" + k, JSON.stringify(v)); } catch (e) {} };
  const leer = (k, def) => { try { const v = localStorage.getItem("cx:" + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } };

  // ---------- aviso flotante ----------
  let toastEl, toastT;
  function toast(msg, ms) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "cx-toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("cx-on");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("cx-on"), ms || 2000);
  }

  // ---------- hoja inferior ----------
  let sheetBg, sheetEl;
  function sheet(html) {
    if (!sheetEl) {
      sheetBg = document.createElement("div"); sheetBg.className = "cx-sheet-bg"; sheetBg.onclick = cerrarSheet;
      sheetEl = document.createElement("div"); sheetEl.className = "cx-sheet cx"; sheetEl.setAttribute("role", "dialog"); sheetEl.setAttribute("aria-modal", "true");
      document.body.append(sheetBg, sheetEl);
      document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarSheet(); });
    }
    sheetEl.innerHTML = '<div class="cx-grab"></div>' + html;
    requestAnimationFrame(() => { sheetBg.classList.add("cx-on"); sheetEl.classList.add("cx-on"); });
    return sheetEl;
  }
  function cerrarSheet() { if (sheetEl) { sheetEl.classList.remove("cx-on"); sheetBg.classList.remove("cx-on"); } }

  // ---------- control segmentado ----------
  /** seg(cont, {items:[{v, txt}], valor, ancho, onChange(v)}) */
  function seg(cont, o) {
    cont = el(cont);
    const pintar = () => {
      cont.className = "cx-seg" + (o.ancho ? " cx-ancho" : "");
      cont.innerHTML = o.items.map(i => `<button type="button" data-v="${esc(i.v)}" class="${i.v === o.valor ? "cx-on" : ""}">${esc(i.txt)}</button>`).join("");
    };
    cont.onclick = e => { const b = e.target.closest("button[data-v]"); if (!b || b.dataset.v === o.valor) return; o.valor = b.dataset.v; pintar(); o.onChange && o.onChange(o.valor); };
    pintar();
    return { set: v => { o.valor = v; pintar(); }, get: () => o.valor };
  }

  // ---------- píldoras ----------
  /** pills(cont, {items:[{v, txt, n, color}], valor, wrap, onChange(v)}) */
  function pills(cont, o) {
    cont = el(cont);
    const pintar = () => {
      cont.className = "cx-pills" + (o.wrap ? " cx-wrap" : "");
      cont.innerHTML = o.items.map(i => `<button type="button" class="cx-pill ${i.v === o.valor ? "cx-on" : ""}" data-v="${esc(i.v)}" ${i.color ? `data-c="${i.color}"` : ""}>${esc(i.txt)}${i.n != null ? `<span class="cx-n">${i.n}</span>` : ""}</button>`).join("");
    };
    cont.onclick = e => { const b = e.target.closest(".cx-pill"); if (!b) return; o.valor = b.dataset.v; pintar(); o.onChange && o.onChange(o.valor); };
    pintar();
    return { set: (v, items) => { o.valor = v; if (items) o.items = items; pintar(); }, get: () => o.valor };
  }

  // ---------- buscador ----------
  /** buscador(cont, {placeholder, valor, onInput(texto)}) */
  function buscador(cont, o) {
    cont = el(cont);
    cont.className = "cx-search";
    cont.innerHTML = LUPA + `<input type="search" placeholder="${esc(o.placeholder || "Buscar")}" value="${esc(o.valor || "")}" aria-label="${esc(o.placeholder || "Buscar")}">`;
    const inp = cont.querySelector("input");
    inp.oninput = debounce(() => o.onInput && o.onInput(inp.value), o.espera || 150);
    return inp;
  }

  // ---------- KPIs ----------
  /** kpis(cont, [{v, color, titulo, valor, sub}], {activo, onClick(v)}) */
  function kpis(cont, items, o) {
    cont = el(cont); o = o || {};
    cont.classList.add("cx-kpis");
    cont.innerHTML = items.map(k => `<button type="button" class="cx-kpi ${k.v != null && k.v === o.activo ? "cx-on" : ""}" ${k.v != null ? `data-v="${esc(k.v)}"` : ""} ${o.onClick ? "" : 'style="cursor:default"'}>
      <span class="cx-k">${k.color ? `<i class="cx-dot" style="background:${k.color}"></i>` : ""}${esc(k.titulo)}</span><b>${k.valorHtml || esc(k.valor)}</b>${k.sub ? `<small>${esc(k.sub)}</small>` : ""}</button>`).join("");
    cont.onclick = e => { const b = e.target.closest(".cx-kpi[data-v]"); if (b && o.onClick) o.onClick(b.dataset.v); };
  }

  // ---------- lista agrupada ----------
  /**
   * lista(cont, {grupos:[{titulo, extra, filas:[fila]}], vacio, recordar})
   * fila = {id, nombre, avatar (html opcional), color, titulo (html opcional), sub, derecha (html), detalle (html | () => html),
   *         acciones:[{txt, icono, color: blue|red|purple|orange|green|gray, fn(id)}], apagada, onClick(id)}
   * - Con detalle: un toque despliega/pliega. Con acciones: deslizar a la izquierda las muestra.
   * - recordar: clave para mantener abiertas las filas al volver a pintar.
   */
  const ABIERTAS = {};
  function lista(cont, o) {
    cont = el(cont);
    const reg = {};
    const abiertas = o.recordar ? (ABIERTAS[o.recordar] = ABIERTAS[o.recordar] || {}) : {};
    const grupos = (o.grupos || []).filter(g => g.filas && g.filas.length);
    if (!grupos.length) { cont.innerHTML = `<div class="cx-empty">${o.vacio || "Sin resultados."}</div>`; return; }
    cont.innerHTML = grupos.map(g => (g.titulo != null ? `<div class="cx-grp-t"><span>${esc(g.titulo)}</span><span>${g.extra != null ? esc(g.extra) : g.filas.length}</span></div>` : "") +
      `<div class="cx-list">${g.filas.map(f => {
        reg[f.id] = f;
        const det = typeof f.detalle === "function" ? null : f.detalle;
        const tieneDet = !!f.detalle, abierta = tieneDet && abiertas[f.id];
        const acc = (f.acciones || []).filter(Boolean);
        return `<div class="cx-row ${abierta ? "cx-open" : ""} ${f.apagada ? "cx-apagada" : ""}" data-id="${esc(f.id)}">
          ${acc.length ? `<div class="cx-swipe">${acc.map((a, i) => `<button type="button" class="cx-sa-${a.color || "blue"}" data-a="${i}">${a.icono ? `<span aria-hidden="true">${a.icono}</span>` : ""}<span>${esc(a.txt)}</span></button>`).join("")}</div>` : ""}
          <button type="button" class="cx-row-in ${!tieneDet && !f.onClick && !acc.length ? "cx-fija" : ""}" ${tieneDet ? `aria-expanded="${abierta ? "true" : "false"}"` : ""}>
            ${f.avatar != null ? f.avatar : f.nombre ? avatar(f.nombre, f.color) : ""}
            <span class="cx-row-main"><span class="cx-row-t">${f.titulo != null ? f.titulo : `<span class="cx-nm">${esc(f.nombre)}</span>`}</span>${f.sub ? `<span class="cx-row-s">${f.sub}</span>` : ""}</span>
            <span class="cx-row-r">${f.derecha || ""}${tieneDet || f.onClick ? CHEV : ""}</span></button>
          ${tieneDet ? `<div class="cx-row-det"><div><div class="cx-det-in">${abierta || det ? (det != null ? det : f.detalle()) : ""}</div></div></div>` : ""}</div>`;
      }).join("")}</div>`).join("");
    cont.querySelectorAll(".cx-row").forEach(row => vincularFila_(row, reg[row.dataset.id], abiertas));
  }
  function vincularFila_(row, f, abiertas) {
    const inn = row.querySelector(".cx-row-in"), acts = row.querySelector(".cx-swipe");
    const w = () => acts ? acts.offsetWidth : 0;
    let x0 = null, y0 = 0, dx = 0, movido = false, abierto = false;
    const mover = v => { inn.style.transform = v ? `translateX(${v}px)` : ""; };
    if (acts) {
      inn.addEventListener("pointerdown", e => { if (e.button) return; x0 = e.clientX; y0 = e.clientY; dx = 0; movido = false; inn.style.transition = "none"; });
      inn.addEventListener("pointermove", e => {
        if (x0 === null) return;
        dx = e.clientX - x0;
        if (!movido && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)) movido = true;
        if (movido) mover(Math.min(0, Math.max(-w() - 24, dx + (abierto ? -w() : 0))));
      });
      const fin = () => {
        if (x0 === null) return;
        inn.style.transition = "";
        if (movido) { abierto = dx + (abierto ? -w() : 0) < -w() / 2; mover(abierto ? -w() : 0); }
        x0 = null;
      };
      inn.addEventListener("pointerup", fin); inn.addEventListener("pointercancel", fin); inn.addEventListener("pointerleave", fin);
      acts.addEventListener("click", e => {
        const b = e.target.closest("button[data-a]"); if (!b) return;
        abierto = false; mover(0);
        const a = f.acciones.filter(Boolean)[Number(b.dataset.a)]; a && a.fn && a.fn(f.id, b);
      });
    }
    inn.addEventListener("click", () => {
      if (movido) { movido = false; return; }
      if (abierto) { abierto = false; mover(0); return; }
      if (f.detalle) {
        const det = row.querySelector(".cx-det-in");
        if (!det.innerHTML && typeof f.detalle === "function") det.innerHTML = f.detalle();
        const ab = row.classList.toggle("cx-open");
        inn.setAttribute("aria-expanded", ab ? "true" : "false");
        if (ab) abiertas[f.id] = 1; else delete abiertas[f.id];
      } else if (f.onClick) f.onClick(f.id);
    });
  }

  // ---------- franja de períodos ----------
  /**
   * franja({periodos: 8, dias:[{etiqueta, celdas:{3: {estado, titulo}, 4: {...}}}]}) → html
   * estado: pg (pagado/verde) · np (sin pago/gris) · sc (sin cubrir/rojo) · cf (conflicto/naranja) · in (info/azul) · vacío = sin clase
   */
  function franja(o) {
    const n = o.periodos || 8;
    return `<div class="cx-strip-wrap" style="--cx-p:${n}">${(o.dias || []).map(d => {
      let c = "";
      for (let p = 1; p <= n; p++) {
        const x = (d.celdas || {})[p];
        c += `<span class="cx-cell ${x ? "cx-" + (x.estado || "in") : "cx-no"}" title="${esc(x ? x.titulo || p + "°" : p + "° sin clase")}">${x ? p : ""}</span>`;
      }
      return `<div class="cx-strip"><span class="cx-d">${esc(d.etiqueta)}</span>${c}</div>`;
    }).join("")}</div>`;
  }
  const leyendaFranja = (items) => `<div class="cx-legend">${(items || [["pg", "Pagado"], ["np", "Sin pago"], ["cf", "Conflicto"], ["sc", "Sin cubrir"]])
    .map(i => `<span><i style="background:var(--cx-${{ pg: "green", np: "gray", sc: "red", cf: "orange", in: "blue" }[i[0]]})"></i>${esc(i[1])}</span>`).join("")}</div>`;
  const progreso = (frac, color) => `<span class="cx-prog"><i style="width:${Math.max(0, Math.min(1, frac || 0)) * 100}%${color ? ";background:" + color : ""}"></i></span>`;

  global.CX = { VERSION, esc, pesos, norm, iniciales, colorDe, avatar, tag, debounce, guardar, leer, CHEV,
    toast, sheet, cerrarSheet, seg, pills, buscador, kpis, lista, franja, leyendaFranja, progreso };
})(window);
