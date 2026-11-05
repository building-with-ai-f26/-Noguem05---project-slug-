// SnapSet — tiny local server. No dependencies: only built-in Node modules.
// Serves public/index.html and saves workout logs to data/logs.json.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = process.env.SNAPSET_DATA_FILE || path.join(__dirname, "data", "logs.json");

// ---- Storage: a JSON array of { machine, date, sets, reps, weight } ----

function readLogs(file = DATA_FILE) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function addLog(entry, file = DATA_FILE) {
  const logs = readLogs(file);
  logs.push(entry);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(logs, null, 2));
  return entry;
}

function lastLogFor(machine, file = DATA_FILE) {
  const matches = readLogs(file).filter((l) => l.machine === machine);
  return matches.length ? matches[matches.length - 1] : null;
}

// ---- HTTP helpers ----

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// ---- Routes ----

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // GET /api/last?machine=Leg%20Press  -> last log for that machine (or null)
  if (req.method === "GET" && url.pathname === "/api/last") {
    return sendJson(res, 200, lastLogFor(url.searchParams.get("machine")));
  }

  // POST /api/log  { machine, sets, reps, weight } -> saves it with today's date
  if (req.method === "POST" && url.pathname === "/api/log") {
    try {
      const { machine, sets, reps, weight } = JSON.parse(await readBody(req));
      if (!machine || !(sets > 0) || !(reps > 0) || !(weight >= 0)) {
        return sendJson(res, 400, { error: "Need machine, sets, reps and weight." });
      }
      const entry = {
        machine,
        date: new Date().toISOString().slice(0, 10), // e.g. 2026-11-05
        sets: Number(sets),
        reps: Number(reps),
        weight: Number(weight),
      };
      return sendJson(res, 201, addLog(entry));
    } catch {
      return sendJson(res, 400, { error: "Invalid request." });
    }
  }

  // Anything else: serve the web page
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return fs.createReadStream(path.join(PUBLIC_DIR, "index.html")).pipe(res);
  }

  res.writeHead(404);
  res.end("Not found");
}

if (require.main === module) {
  http.createServer(handle).listen(PORT, () => {
    console.log(`SnapSet running at http://localhost:${PORT}`);
  });
}

module.exports = { readLogs, addLog, lastLogFor };
