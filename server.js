"use strict";
const http = require("http");
const path = require("path");
const fs = require("fs");
const express = require("express");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const PIN = String(process.env.TEACHER_PIN || "1234");
if (!process.env.TEACHER_PIN) console.warn("POZOR: TEACHER_PIN není nastaven, používá se 1234.");

const TASKS = JSON.parse(fs.readFileSync(path.join(__dirname, "public", "ulohy.json"), "utf8"));
const CC = ["A", "B", "AB", "N"];

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("/ucitel", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/healthz", (req, res) => res.send("ok"));
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let game = { idx: 0, phase: "lobby", shownAt: 0 };
const players = new Map(); // id -> {name, answers:{idx:{c,ms}}, pts:{idx:body}}
const clients = new Set();

const total = p => Object.values(p.pts).reduce((a, b) => a + b, 0);
const send = (c, o) => { if (c.ws.readyState === 1) c.ws.send(JSON.stringify(o)); };

function view(c) {
  const out = {};
  for (const [id, p] of players) {
    out[id] = c.teacher || id === c.id
      ? { name: p.name, answers: p.answers, pts: p.pts }
      : { name: p.name, pts: { s: total(p) } };
  }
  return { t: "state", state: { idx: game.idx, phase: game.phase }, players: out };
}

let timer = null;
function broadcast() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    for (const c of clients) if (c.id) send(c, view(c));
  }, 80);
}

function score() {
  const t = TASKS[game.idx];
  for (const p of players.values()) {
    const a = p.answers[game.idx];
    p.pts[game.idx] = a && a.c === t.ans ? 1000 - Math.round(Math.min(a.ms, 30000) / 30000 * 500) : 0;
  }
}

function handle(c, m) {
  if (m.t === "hello") {
    if (typeof m.id !== "string" || m.id.length < 6 || m.id.length > 80) return;
    c.id = m.id;
    if (m.pin !== undefined) {
      if (String(m.pin) === PIN) c.teacher = true;
      else { send(c, { t: "denied" }); return; }
    }
    send(c, { t: "hello", teacher: c.teacher });
    send(c, view(c));
    return;
  }
  if (!c.id) return;

  if (c.teacher) {
    if (m.t === "go") {
      for (const p of players.values()) { p.answers = {}; p.pts = {}; }
      game = { idx: 0, phase: "question", shownAt: Date.now() };
    } else if (m.t === "reveal" && game.phase === "question") {
      score(); game.phase = "reveal";
    } else if (m.t === "next" && game.phase === "reveal" && game.idx + 1 < TASKS.length) {
      game = { idx: game.idx + 1, phase: "question", shownAt: Date.now() };
    } else if (m.t === "end" && game.phase === "reveal") {
      game.phase = "end";
    } else if (m.t === "new") {
      players.clear(); game = { idx: 0, phase: "lobby", shownAt: 0 };
    } else return;
    broadcast();
    return;
  }

  if (m.t === "join") {
    const name = typeof m.name === "string" ? m.name.trim().slice(0, 20) : "";
    if (!name) return;
    const p = players.get(c.id);
    if (p) p.name = name; else players.set(c.id, { name, answers: {}, pts: {} });
    broadcast();
  } else if (m.t === "answer") {
    const p = players.get(c.id), t = TASKS[game.idx];
    if (!p || game.phase !== "question" || p.answers[game.idx]) return;
    const valid = t.mc ? t.mc.map((x, k) => "ABCD"[k]) : CC;
    if (!valid.includes(m.c)) return;
    p.answers[game.idx] = { c: m.c, ms: Date.now() - game.shownAt };
    broadcast();
  }
}

wss.on("connection", ws => {
  const c = { ws, id: null, teacher: false, alive: true };
  clients.add(c);
  ws.on("pong", () => { c.alive = true; });
  ws.on("message", raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m && typeof m === "object") handle(c, m);
  });
  ws.on("close", () => clients.delete(c));
  ws.on("error", () => {});
});

setInterval(() => {
  for (const c of clients) {
    if (!c.alive) { c.ws.terminate(); clients.delete(c); continue; }
    c.alive = false;
    try { c.ws.ping(); } catch (e) {}
  }
}, 30000);

server.listen(PORT, () => console.log("Server běží na portu " + PORT));
