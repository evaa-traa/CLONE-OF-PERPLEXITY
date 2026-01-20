const express = require("express");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const { createParser } = require("eventsource-parser");
const { loadModelsFromEnv, loadModelsFromEnvDetailed } = require("./models");

require("dotenv").config();

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(morgan("tiny"));

const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

function sendEvent(res, event, data) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function buildPrompt(message, mode) {
  if (mode === "research") {
    return [
      "You are a research assistant.",
      "Provide a structured answer with sections: Summary, Key Points, and Sources.",
      "If you do not have sources, write: Sources: No sources provided.",
      "Include 3 follow-up questions under a Follow-up section.",
      `User: ${message}`
    ].join("\n");
  }
  return message;
}

async function streamFlowise({
  res,
  model,
  message,
  mode,
  signal
}) {
  const url = `${model.host}/api/v1/prediction/${model.id}`;
  const payload = {
    question: buildPrompt(message, mode),
    streaming: true,
    responseMode: "stream"
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(`Flowise error ${response.status}: ${text}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createParser((event) => {
    if (event.type !== "event") return;
    const raw = event.data || "";
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      parsed = null;
    }

    if (parsed && typeof parsed === "object") {
      const errorText = parsed.error || parsed.message?.error;
      if (errorText) {
        sendEvent(res, "error", { message: errorText });
        return;
      }
    }

    const payloadText =
      (parsed &&
        (parsed.token || parsed.text || parsed.answer || parsed.message)) ||
      raw;
    if (payloadText) {
      sendEvent(res, "token", { text: payloadText });
    }
  });

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    parser.feed(decoder.decode(value, { stream: true }));
  }
}

function scheduleActivities(res, mode) {
  const steps =
    mode === "research"
      ? ["searching", "reading", "reasoning", "writing"]
      : ["writing"];
  const timers = steps.map((step, index) =>
    setTimeout(() => {
      sendEvent(res, "activity", { state: step });
    }, index * 600)
  );
  return () => {
    timers.forEach((timer) => clearTimeout(timer));
  };
}

app.get("/models", (req, res) => {
  const { models, issues } = loadModelsFromEnvDetailed(process.env);
  res.json({ models, issues });
});

app.post("/chat", async (req, res) => {
  const { message, modelId, mode } = req.body || {};
  if (
    !message ||
    typeof message !== "string" ||
    message.length > 10000 ||
    !modelId ||
    typeof modelId !== "string" ||
    !mode ||
    typeof mode !== "string" ||
    !["chat", "research"].includes(mode)
  ) {
    return res.status(400).json({ error: "Invalid message" });
  }

  const models = loadModelsFromEnv(process.env);
  const model = models.find((item) => item.id === modelId);
  if (!model) {
    return res.status(404).json({ error: "Model not found" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  const clearActivities = scheduleActivities(res, mode);

  const controller = new AbortController();
  req.on("close", () => {
    controller.abort();
    clearActivities();
  });

  try {
    await streamFlowise({
      res,
      model,
      message,
      mode,
      signal: controller.signal
    });
    sendEvent(res, "done", { ok: true });
  } catch (error) {
    sendEvent(res, "error", { message: error.message });
  } finally {
    clearActivities();
    res.end();
  }
});

app.get("*", (req, res, next) => {
  if (fs.existsSync(publicDir)) {
    const indexPath = path.join(publicDir, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
