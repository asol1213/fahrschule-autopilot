const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");

const app = express();
app.use(express.json());

let clientReady = false;
let latestQR = null;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "/data/session" }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  },
});

client.on("qr", (qr) => {
  latestQR = qr;
  console.log("=== QR CODE READY - open http://localhost:3001/qr ===");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp client is ready!");
  clientReady = true;
});

client.on("disconnected", (reason) => {
  console.log("WhatsApp disconnected:", reason);
  clientReady = false;
});

client.on("message", async (msg) => {
  console.log(`Message from ${msg.from}: ${msg.body}`);

  // Forward incoming messages to n8n webhook
  try {
    await fetch("http://n8n:5678/webhook/whatsapp-incoming", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: msg.from,
        body: msg.body,
        timestamp: msg.timestamp,
        fromMe: msg.fromMe,
      }),
    });
  } catch (err) {
    // n8n webhook might not exist yet, that's ok
  }
});

// API: Send a message
app.post("/send", async (req, res) => {
  if (!clientReady) {
    return res.status(503).json({ error: "WhatsApp not connected" });
  }

  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: "number and message required" });
  }

  try {
    // Format: 49XXXXXXXXX@c.us (country code + number without +)
    const chatId = number.replace(/[^0-9]/g, "") + "@c.us";
    await client.sendMessage(chatId, message);
    res.json({ success: true, chatId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: QR code as scannable image
app.get("/qr", async (req, res) => {
  if (clientReady) {
    return res.send("<h1>WhatsApp is already connected!</h1>");
  }
  if (!latestQR) {
    return res.send("<h1>No QR code yet, wait a moment and refresh...</h1>");
  }
  const qrImage = await QRCode.toDataURL(latestQR, { width: 400 });
  res.send(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#111"><div style="text-align:center"><h1 style="color:white">Scan with WhatsApp Business</h1><img src="${qrImage}" style="width:400px;height:400px"/><p style="color:#aaa">Settings → Linked Devices → Link a Device</p></div></body></html>`);
});

// API: Health check
app.get("/health", (req, res) => {
  res.json({ connected: clientReady });
});

// API: Get QR code as text (for remote setup)
app.get("/status", (req, res) => {
  res.json({
    connected: clientReady,
    info: clientReady ? client.info : null,
  });
});

client.initialize();

app.listen(3001, () => {
  console.log("WhatsApp API running on port 3001");
});
