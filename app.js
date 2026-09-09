(function () {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const thumbsEl = document.getElementById("thumbs");
  const presetsEl = document.getElementById("presets");
  const topInput = document.getElementById("topText");
  const bottomInput = document.getElementById("bottomText");
  const fontInput = document.getElementById("fontSize");
  const outlineInput = document.getElementById("outline");
  const fontVal = document.getElementById("fontVal");
  const outlineVal = document.getElementById("outlineVal");
  const toastEl = document.getElementById("toast");
  const fileInput = document.getElementById("fileInput");

  const DEFAULT_TOP = "WHEN THE PREVIEW LOADS";
  const DEFAULT_BOTTOM = "AND THE CAPTION IS ALREADY THERE";

  const state = {
    image: null,
    objectUrl: null,
    activeThumb: "cat",
    fontSize: 48,
    outline: 6,
    layout: "classic",
    selected: "top",
    dragging: null,
    top: { text: DEFAULT_TOP, x: 0.5, y: 0.1, visible: true },
    bottom: { text: DEFAULT_BOTTOM, x: 0.5, y: 0.9, visible: true },
  };

  let boxes = [];

  const LAYOUTS = [
    { id: "classic", label: "Classic" },
    { id: "top", label: "Top Heavy" },
    { id: "bottom", label: "Bottom Line" },
    { id: "centered", label: "Centered" },
    { id: "modern", label: "Modern Bar" },
  ];

  function noise(g, amount) {
    const w = g.canvas.width;
    const h = g.canvas.height;
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 255 * amount;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
  }

  function paintNewsprint(g, w, h) {
    g.fillStyle = "#e8dcc8";
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.07;
    for (let i = 0; i < 90; i += 1) {
      g.fillStyle = i % 2 ? "#3a352c" : "#ffffff";
      g.fillRect(0, Math.random() * h, w, 1);
    }
    g.globalAlpha = 1;
    noise(g, 0.1);
  }

  function paintInk(g, w, h) {
    const grd = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.72);
    grd.addColorStop(0, "#2a2722");
    grd.addColorStop(1, "#0a0908");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    noise(g, 0.08);
  }

  function paintBrass(g, w, h) {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, "#c9a227");
    grd.addColorStop(0.5, "#e8c547");
    grd.addColorStop(1, "#8a7018");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.14;
    for (let y = 0; y < h; y += 3) {
      g.fillStyle = y % 6 ? "#ffffff" : "#000000";
      g.fillRect(0, y, w, 1);
    }
    g.globalAlpha = 1;
  }

  function paintStorm(g, w, h) {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#1a2230");
    sky.addColorStop(0.55, "#4a5360");
    sky.addColorStop(0.56, "#2c2a26");
    sky.addColorStop(1, "#1a1814");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#3a3a3a";
    g.beginPath();
    g.moveTo(w * 0.45, h * 0.56);
    g.lineTo(w * 0.55, h * 0.56);
    g.lineTo(w * 1.12, h);
    g.lineTo(-w * 0.12, h);
    g.closePath();
    g.fill();
    g.strokeStyle = "#e8c547";
    g.setLineDash([h * 0.035, h * 0.028]);
    g.lineWidth = Math.max(4, w * 0.006);
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.56);
    g.lineTo(w * 0.5, h);
    g.stroke();
    g.setLineDash([]);
  }

  function paintNight(g, w, h) {
    g.fillStyle = "#12141a";
    g.fillRect(0, 0, w, h);
    const glow = g.createRadialGradient(w * 0.55, h * 0.48, 20, w * 0.55, h * 0.48, w * 0.42);
    glow.addColorStop(0, "rgba(80,160,220,0.5)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#0b1220";
    g.fillRect(w * 0.28, h * 0.32, w * 0.44, h * 0.3);
    g.fillStyle = "#1a3a55";
    g.fillRect(w * 0.3, h * 0.35, w * 0.4, h * 0.24);
  }

  function paintStudio(g, w, h) {
    const spot = g.createRadialGradient(w / 2, h * 0.45, 12, w / 2, h * 0.45, w * 0.48);
    spot.addColorStop(0, "#6a6358");
    spot.addColorStop(1, "#12110e");
    g.fillStyle = spot;
    g.fillRect(0, 0, w, h);
  }

  function paintHalftone(g, w, h) {
    g.fillStyle = "#f3ead8";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#1c1a16";
    const step = Math.max(10, Math.round(w / 80));
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const r = 1.6 + ((x + y) % 18) / 10;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  function paintCrimson(g, w, h) {
    const grd = g.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7);
    grd.addColorStop(0, "#6a1c1c");
    grd.addColorStop(1, "#1a0808");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    noise(g, 0.1);
  }

  const PHOTOS = [
    { id: "cat", name: "Startled Cat", src: "templates/startled-cat.jpg" },
    { id: "wide-eyes", name: "Wide Eyes", src: "templates/wide-eyes.jpg" },
    { id: "dog", name: "Head Tilt", src: "templates/head-tilt.jpg" },
    { id: "road", name: "Open Road", src: "templates/open-road.jpg" },
    { id: "gull", name: "Seagull", src: "templates/seagull.jpg" },
  ];

  const TEMPLATES = [
    { id: "newsprint", name: "Newsprint", paint: paintNewsprint },
    { id: "ink", name: "Ink", paint: paintInk },
    { id: "brass", name: "Brass", paint: paintBrass },
    { id: "storm", name: "Open Road", paint: paintStorm },
    { id: "night", name: "Late Night", paint: paintNight },
    { id: "studio", name: "Spotlight", paint: paintStudio },
    { id: "halftone", name: "Halftone", paint: paintHalftone },
    { id: "crimson", name: "Crimson", paint: paintCrimson },
  ];

  const imageCache = {};

  function canvasToImage(c) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.src = c.toDataURL("image/png");
    });
  }

  function makeCanvas(w, h, paint) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    paint(c.getContext("2d"), w, h);
    return c;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  async function templateImage(id) {
    if (imageCache[id]) return imageCache[id];
    const photo = PHOTOS.find(function (t) { return t.id === id; });
    if (photo) {
      const img = await loadImage(photo.src);
      imageCache[id] = img;
      return img;
    }
    const spec = TEMPLATES.find(function (t) { return t.id === id; });
    const img = await canvasToImage(makeCanvas(1200, 900, spec.paint));
    imageCache[id] = img;
    return img;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function wrapLines(context, text, maxW) {
    const cleaned = String(text || "").split("\n").join(" ");
    const words = cleaned.split(" ");
    const lines = [];
    let line = "";
    for (let i = 0; i < words.length; i += 1) {
      const word = words[i];
      if (!word) continue;
      const test = line ? line + " " + word : word;
      if (context.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function fitCanvas() {
    const img = state.image;
    if (!img) return;
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    const max = 1400;
    const s = Math.min(1, max / Math.max(nw, nh));
    canvas.width = Math.max(1, Math.round(nw * s));
    canvas.height = Math.max(1, Math.round(nh * s));
  }

  function drawCaption(id, hideSelection) {
    const layer = state[id];
    if (!layer.visible) return;
    const text = layer.text.trim();
    if (!text) return;
    const w = canvas.width;
    const h = canvas.height;
    const scale = w / 800;
    const isBar = state.layout === "modern";
    const size = state.fontSize * scale * (isBar ? 0.72 : 1);
    const stroke = state.outline * scale;
    const rendered = isBar ? text : text.toUpperCase();
    ctx.font = (isBar ? "700 " : "900 ") + Math.round(size) + "px " + (isBar
      ? "IBM Plex Sans, ui-sans-serif, sans-serif"
      : "Impact, Anton, Haettenschweiler, Arial Black, sans-serif");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = wrapLines(ctx, rendered, w * 0.9);
    const lh = size * 1.12;
    const blockH = lines.length * lh;
    const cx = layer.x * w;
    const cy = layer.y * h;
    const startY = cy - (blockH - lh) / 2;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(0, stroke * 2);
    let maxLineW = 0;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const y = startY + i * lh;
      maxLineW = Math.max(maxLineW, ctx.measureText(line).width);
      if (!isBar && stroke > 0) {
        ctx.strokeStyle = "#000000";
        ctx.strokeText(line, cx, y);
      }
      ctx.fillStyle = isBar ? "#12110e" : "#ffffff";
      ctx.fillText(line, cx, y);
    }
    const box = {
      id: id,
      x: cx - maxLineW / 2 - 14,
      y: startY - lh / 2 - 10,
      w: maxLineW + 28,
      h: blockH + 20,
    };
    boxes.push(box);
    if (!hideSelection && state.selected === id) {
      ctx.save();
      ctx.strokeStyle = "#e8c547";
      ctx.setLineDash([7, 5]);
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.restore();
    }
  }

  function draw(hideSelection) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (state.image) ctx.drawImage(state.image, 0, 0, w, h);
    if (state.layout === "modern") {
      ctx.fillStyle = "#f3ead8";
      ctx.fillRect(0, h * 0.82, w, h * 0.18);
    }
    boxes = [];
    drawCaption("top", hideSelection);
    drawCaption("bottom", hideSelection);
  }

  function applyLayout(id) {
    state.layout = id;
    if (id === "classic") {
      state.top.visible = true; state.top.x = 0.5; state.top.y = 0.1;
      state.bottom.visible = true; state.bottom.x = 0.5; state.bottom.y = 0.9;
    } else if (id === "top") {
      state.top.visible = true; state.top.x = 0.5; state.top.y = 0.12;
      state.bottom.visible = false; state.bottom.y = 0.9;
    } else if (id === "bottom") {
      state.top.visible = false; state.top.y = 0.1;
      state.bottom.visible = true; state.bottom.x = 0.5; state.bottom.y = 0.9;
    } else if (id === "centered") {
      state.top.visible = true; state.top.x = 0.5; state.top.y = 0.42;
      state.bottom.visible = true; state.bottom.x = 0.5; state.bottom.y = 0.58;
    } else if (id === "modern") {
      state.top.visible = false;
      state.bottom.visible = true; state.bottom.x = 0.5; state.bottom.y = 0.91;
    }
    syncPresetButtons();
    draw();
  }

  function syncPresetButtons() {
    presetsEl.querySelectorAll(".chip").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.dataset.id === state.layout ? "true" : "false");
    });
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  function toCanvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }

  function hitTest(p) {
    for (let i = boxes.length - 1; i >= 0; i -= 1) {
      const b = boxes[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return b.id;
    }
    return null;
  }

  canvas.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const p = toCanvasPoint(e);
    const id = hitTest(p);
    if (!id) return;
    state.selected = id;
    state.dragging = {
      id: id,
      dx: p.x - state[id].x * canvas.width,
      dy: p.y - state[id].y * canvas.height,
    };
    draw();
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!state.dragging) return;
    const p = toCanvasPoint(e);
    const layer = state[state.dragging.id];
    layer.x = clamp((p.x - state.dragging.dx) / canvas.width, 0.08, 0.92);
    layer.y = clamp((p.y - state.dragging.dy) / canvas.height, 0.07, 0.93);
    draw();
  });

  function endDrag() { state.dragging = null; }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  async function useTemplate(id) {
    state.activeThumb = id;
    state.image = await templateImage(id);
    fitCanvas();
    thumbsEl.querySelectorAll(".thumb").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.dataset.id === id ? "true" : "false");
    });
    draw();
  }

  function makeThumbButton(id, name, previewEl) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumb";
    btn.dataset.id = id;
    btn.setAttribute("role", "listitem");
    btn.setAttribute("aria-pressed", id === state.activeThumb ? "true" : "false");
    previewEl.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = name;
    btn.appendChild(previewEl);
    btn.appendChild(label);
    btn.addEventListener("click", function () { useTemplate(id); });
    thumbsEl.appendChild(btn);
  }

  function renderThumbs() {
    thumbsEl.innerHTML = "";
    PHOTOS.forEach(function (t) {
      const img = document.createElement("img");
      img.src = t.src;
      img.alt = t.name;
      makeThumbButton(t.id, t.name, img);
    });
    TEMPLATES.forEach(function (t) {
      const preview = makeCanvas(240, 180, t.paint);
      makeThumbButton(t.id, t.name, preview);
    });
  }

  function renderPresets() {
    presetsEl.innerHTML = "";
    LAYOUTS.forEach(function (p) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.dataset.id = p.id;
      btn.textContent = p.label;
      btn.setAttribute("aria-pressed", p.id === state.layout ? "true" : "false");
      btn.addEventListener("click", function () { applyLayout(p.id); });
      presetsEl.appendChild(btn);
    });
  }

  topInput.value = state.top.text;
  bottomInput.value = state.bottom.text;
  topInput.addEventListener("input", function () { state.top.text = topInput.value; draw(); });
  bottomInput.addEventListener("input", function () { state.bottom.text = bottomInput.value; draw(); });

  fontInput.addEventListener("input", function () {
    state.fontSize = Number(fontInput.value);
    fontVal.textContent = String(state.fontSize);
    draw();
  });
  outlineInput.addEventListener("input", function () {
    state.outline = Number(outlineInput.value);
    outlineVal.textContent = String(state.outline);
    draw();
  });

  document.getElementById("uploadBtn").addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    const url = URL.createObjectURL(file);
    state.objectUrl = url;
    const img = new Image();
    img.onload = function () {
      state.image = img;
      state.activeThumb = "upload";
      thumbsEl.querySelectorAll(".thumb").forEach(function (btn) {
        btn.setAttribute("aria-pressed", "false");
      });
      fitCanvas();
      draw();
    };
    img.onerror = function () { toast("Could not load that image"); };
    img.src = url;
    fileInput.value = "";
  });

  document.getElementById("resetBtn").addEventListener("click", function () {
    state.top.text = DEFAULT_TOP;
    state.bottom.text = DEFAULT_BOTTOM;
    state.fontSize = 48;
    state.outline = 6;
    topInput.value = DEFAULT_TOP;
    bottomInput.value = DEFAULT_BOTTOM;
    fontInput.value = "48";
    outlineInput.value = "6";
    fontVal.textContent = "48";
    outlineVal.textContent = "6";
    applyLayout("classic");
    toast("Captions reset");
  });

  document.getElementById("downloadBtn").addEventListener("click", function () {
    const prev = state.selected;
    state.selected = null;
    draw(true);
    canvas.toBlob(function (blob) {
      state.selected = prev;
      draw();
      if (!blob) { toast("Could not export"); return; }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "meme.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
      toast("Saved meme.png");
    }, "image/png");
  });

  renderThumbs();
  renderPresets();

  function start() {
    Promise.resolve(document.fonts ? document.fonts.ready : true).then(function () {
      return useTemplate("cat");
    });
  }
  start();
})();
