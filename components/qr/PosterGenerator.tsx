"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { EVENT_LOGIN_PATH } from "@/lib/event-links";

const BLUE = "#0b4fb8";
const DARK = "#04214f";

const STEPS = [
  ["1", "Escanea el QR", "Abre el muro de fotografías de SENATI."],
  ["2", "Inicia sesión con Google", "Ingresa con tu cuenta para participar."],
  ["3", "Comparte tus fotografías", "Toma fotografías o selecciona hasta cinco desde tu galería."],
  ["4", "Publica y participa", "Escribe un mensaje, publica, comenta y disfruta las fotografías del evento."],
];

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lh;
}

async function makeQr(url: string, size: number) {
  // Nivel H + margen (zona de silencio) de 4 módulos, texto oscuro sobre blanco: alto contraste.
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, url, { width: size, margin: 4, errorCorrectionLevel: "H", color: { dark: "#000000", light: "#ffffff" } });
  return canvas;
}

async function drawPoster(url: string, orientation: "vertical" | "horizontal", title: string) {
  const vertical = orientation === "vertical";
  const W = vertical ? 2480 : 3840; // A4 a 300 dpi / 4K 16:9
  const H = vertical ? 3508 : 2160;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const s = W / (vertical ? 2480 : 3840);

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, DARK);
  g.addColorStop(1, BLUE);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.textAlign = vertical ? "center" : "left";
  const pad = 160 * s;
  const left = vertical ? W / 2 : pad;

  // Marca textual. Reemplazar por el logotipo oficial cuando se proporcione el recurso autorizado.
  ctx.font = `900 ${vertical ? 150 : 130}px sans-serif`;
  ctx.fillText("SENATI", left, pad + 120);
  ctx.font = `500 ${vertical ? 64 : 56}px sans-serif`;
  wrap(ctx, title, left, pad + 220, vertical ? W - pad * 2 : W * 0.5, 76);
  ctx.font = `800 ${vertical ? 110 : 100}px sans-serif`;
  ctx.fillText("¡Comparte tus mejores momentos!", left, vertical ? 700 : 560);

  // QR en tarjeta blanca
  const qrSize = vertical ? 1000 : 1100;
  const qrCanvas = await makeQr(url, qrSize);
  const cardPad = 60;
  const qx = vertical ? (W - qrSize) / 2 : W - pad - qrSize - cardPad * 2;
  const qy = vertical ? 800 : (H - qrSize) / 2 - cardPad;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(qx - cardPad, qy - cardPad + (vertical ? 0 : cardPad), qrSize + cardPad * 2, qrSize + cardPad * 2, 48);
  ctx.fill();
  ctx.drawImage(qrCanvas, qx, qy + (vertical ? 0 : cardPad));

  // Pasos
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  const stepsX = vertical ? pad : pad;
  let y = vertical ? 2020 : 800;
  const colW = vertical ? W - pad * 2 : W * 0.5;
  for (const [n, t, d] of STEPS) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(stepsX + 50, y - 20, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BLUE;
    ctx.font = "900 64px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(n, stepsX + 50, y);
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = `800 ${vertical ? 68 : 60}px sans-serif`;
    ctx.fillText(`Paso ${n}: ${t}`, stepsX + 140, y);
    ctx.font = `400 ${vertical ? 52 : 46}px sans-serif`;
    y = wrap(ctx, d, stepsX + 140, y + 64, colW - 140, 62) + (vertical ? 50 : 34);
  }

  // Mensaje final
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = `800 ${vertical ? 68 : 62}px sans-serif`;
  ctx.fillText("¡Tus fotografías también podrán aparecer en la pantalla del evento!", W / 2, H - pad);

  return c;
}

function download(canvas: HTMLCanvasElement, name: string) {
  canvas.toBlob((b) => {
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
}

export function PosterGenerator({ appUrl, title }: { appUrl: string; title: string }) {
  const url = `${appUrl.replace(/\/+$/, "")}${EVENT_LOGIN_PATH}`;
  const [busy, setBusy] = useState<string | null>(null);

  async function run(kind: "vertical" | "horizontal" | "qr") {
    setBusy(kind);
    try {
      if (kind === "qr") download(await makeQr(url, 2000), "qr-senati.png");
      else download(await drawPoster(url, kind, title), `afiche-senati-${kind}.png`);
    } finally {
      setBusy(null);
    }
  }

  const valid = /^https:\/\/[^\s/]+/.test(url);

  return (
    <div className="space-y-4">
      <p className="text-sm">El QR apuntará a: <code className="rounded bg-slate-100 px-2 py-1">{url}</code></p>
      {!valid && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Define NEXT_PUBLIC_APP_URL con el dominio real de producción (https://…) antes de imprimir.</p>}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={!!busy} onClick={() => run("vertical")}>{busy === "vertical" ? "Generando…" : "Descargar afiche vertical (A4)"}</button>
        <button className="btn btn-primary" disabled={!!busy} onClick={() => run("horizontal")}>{busy === "horizontal" ? "Generando…" : "Descargar afiche horizontal (16:9)"}</button>
        <button className="btn btn-ghost" disabled={!!busy} onClick={() => run("qr")}>Solo QR</button>
      </div>
    </div>
  );
}
