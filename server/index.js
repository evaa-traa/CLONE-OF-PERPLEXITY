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
    streaming: true
  };

  console.log(`[Flowise] Fetching URL: ${url}`);
  console.log(`[Flowise] Payload:`, JSON.stringify(payload));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: controller.signal // Ensure we use the controller signal explicitly
  }).catch((err) => {
    console.error("[Flowise] Fetch error:", err);
    throw new Error(`Failed to connect to Flowise: ${err.message}`);
  });

  const contentType = response.headers.get("content-type") || "";
  console.log(`[Flowise] Status: ${response.status}, Content-Type: ${contentType}`);
  console.log(`[Flowise] Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries())));

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[Flowise] API error (${response.status}):`, text);
    throw new Error(`Flowise error ${response.status}: ${text}`);
  }

  if (!response.body) {
    throw new Error("Flowise returned an empty response body.");
  }

  // If the content type is not a stream, it might be a JSON error hidden in a 200 OK 
  // or just a non-streaming response that we should handle.
  if (!contentType.includes("text/event-stream")) {
    console.warn(`[Flowise] Warning: Expected event-stream but got ${contentType}`);
    // If it's JSON, we can try to parse it
    if (contentType.includes("application/json")) {
      const json = await response.json().catch(() => null);
      if (json) {
        console.log(`[Flowise] Parsed JSON instead of stream:`, JSON.stringify(json).slice(0, 50));
        const text = json.text || json.answer || json.output || json.message || JSON.stringify(json);
        sendEvent(res, "token", { text });
        return; // We're done
      }
    }
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

  if (controller.signal.aborted) {
    console.warn("[Chat] Request already aborted by client before starting.");
    return res.end();
  }

  try {
    // Attempt streaming first
    await streamFlowise({
      res,
      model,
      message,
      mode,
      signal: controller.signal
    });
    sendEvent(res, "done", { ok: true });
  } catch (error) {
    const isAbort = error.name === "AbortError" || error.message?.includes("aborted");
    console.error(`[Chat] Streaming failed (Abort: ${isAbort}):`, error.message);

    if (isAbort && controller.signal.aborted) {
      console.log("[Chat] Client disconnected, skipping fallback.");
      return;
    }

    try {
      // Fallback to non-streaming (user's working snippet format)
      const url = `${model.host}/api/v1/prediction/${model.id}`;
      const payload = {
        question: buildPrompt(message, mode)
      };

      console.log(`[Flowise Fallback] Fetching URL: ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        // For fallback, we'll use a fresh controller or no signal to be safe if the first failed due to a weird terminal signal state,
        // but still respect the connection closing if we can.
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Flowise fallback error ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log("[Flowise Fallback] Success");

      const finalContent = result.text || result.answer || result.output || result.message || JSON.stringify(result);

      sendEvent(res, "token", { text: finalContent });
      sendEvent(res, "done", { ok: true });
    } catch (fallbackError) {
      const isFbAbort = fallbackError.name === "AbortError" || fallbackError.message?.includes("aborted");
      console.error(`[Chat] Fallback failed (Abort: ${isFbAbort}):`, fallbackError.message);
      if (!isFbAbort) {
        sendEvent(res, "error", { message: fallbackError.message });
      }
    }
  } finally {
    clearActivities();
    if (!res.writableEnded) res.end();
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
  const { models } = loadModelsFromEnvDetailed(process.env);
  console.log(`Loaded models:`, JSON.stringify(models, null, 2));
});
