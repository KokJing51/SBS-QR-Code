// wweb.js — WhatsApp wiring for Salon bot (ESM, safe open mode)
import "dotenv/config";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

import { handleInboundMessage } from "./handler.js";

// ---------- helpers ----------
const bootTs = Math.floor(Date.now() / 1000); // ignore old messages
const normalizeDigits = (s) =>
  String(s || "").replace(/@c\.us$/i, "").replace(/[^\d]/g, "");
const isGroup = (jid) => /@g\.us$/i.test(jid);
const isStatus = (jid) => /@status\.broadcast$/i.test(jid);

// Env: allow-list & prefix
const allowListEnv = (process.env.ALLOW_LIST || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOW_DIGITS = new Set(allowListEnv.map(normalizeDigits));
const REQUIRED_PREFIX = (process.env.REQUIRE_PREFIX || "").trim();

// Resolve browser executable (Chrome/Chromium)
const executablePath =
  (process.env.CHROME_PATH && process.env.CHROME_PATH.trim()) ||
  (process.env.PUPPETEER_EXECUTABLE_PATH &&
    process.env.PUPPETEER_EXECUTABLE_PATH.trim()) ||
  undefined;

function passesAllowlist(phoneDigits) {
  if (!ALLOW_DIGITS.size) return true; // open mode
  return ALLOW_DIGITS.has(phoneDigits);
}
function passesPrefix(text) {
  if (!REQUIRED_PREFIX) return true; // open mode
  return typeof text === "string" && text.startsWith(REQUIRED_PREFIX);
}
function stripPrefix(text) {
  return REQUIRED_PREFIX
    ? String(text || "").slice(REQUIRED_PREFIX.length).trim()
    : String(text || "");
}

// ---------- singleton client ----------
let client;
export function getWwebClient() {
  return client;
}

export function startWweb() {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
      ...(executablePath ? { executablePath } : {}),
    },
  });

  client.on("qr", (qr) => {
    console.log("Scan this QR with your WhatsApp:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("wwebjs is ready ✅");
    console.log(
      "Allow-list (digits):",
      ALLOW_DIGITS.size ? [...ALLOW_DIGITS].join(",") : "(open)"
    );
    console.log("Required prefix:", REQUIRED_PREFIX || "(none)");
    if (executablePath) console.log("Using browser:", executablePath);
  });

  // 1) Incoming messages from others
  client.on("message", async (msg) => {
    try {
      const { from, fromMe, body, timestamp } = msg;
      console.log("[RX]", { from, fromMe, body });

      if (timestamp && timestamp < bootTs) return;
      if (isGroup(from) || isStatus(from)) return;
      if (fromMe) return;

      const phoneDigits = normalizeDigits(from);
      if (!passesAllowlist(phoneDigits)) {
        console.log(
          "[BLOCKED allow-list]",
          phoneDigits,
          "not in",
          [...ALLOW_DIGITS]
        );
        return;
      }

      let text = String(body || "").trim();
      if (!text) return;

      if (!passesPrefix(text)) {
        console.log("[BLOCKED prefix]", {
          required: REQUIRED_PREFIX,
          got: text.slice(0, 20),
        });
        return;
      }
      text = stripPrefix(text);
      if (!text) return;

      const reply = await handleInboundMessage({ from: phoneDigits, text });
      if (!reply) return;

      await msg.reply(reply);
    } catch (e) {
      console.error("handler error (message):", e);
      try {
        await msg.reply("Sorry, something went wrong.");
      } catch {}
    }
  });

  // 2) Self-testing (messages you send to yourself)
  client.on("message_create", async (msg) => {
    try {
      const { to, fromMe, body, timestamp } = msg;
      console.log("[RX:self]", { to, fromMe, body });

      if (!fromMe) return;
      if (timestamp && timestamp < bootTs) return;
      if (isGroup(to) || isStatus(to)) return;

      const selfDigits = normalizeDigits(to);
      const SELF = normalizeDigits(process.env.SELF_NUMBER || "");
      if (!SELF || selfDigits !== SELF) return;

      if (!passesAllowlist(selfDigits)) {
        console.log("[BLOCKED self allow-list]", selfDigits);
        return;
      }

      let text = String(body || "").trim();
      if (!text) return;
      if (!passesPrefix(text)) {
        console.log("[BLOCKED self prefix]", {
          required: REQUIRED_PREFIX,
          got: text.slice(0, 20),
        });
        return;
      }
      text = stripPrefix(text);
      if (!text) return;

      const reply = await handleInboundMessage({ from: selfDigits, text });
      if (!reply) return;

      await msg.reply(reply);
    } catch (e) {
      console.error("handler error (message_create):", e);
      try {
        await msg.reply("Sorry, something went wrong.");
      } catch {}
    }
  });

  client.on("disconnected", (reason) => {
    console.log("wwebjs disconnected:", reason);
  });

  client.initialize();
}
