// ── Polyfills Node 18 (LWS) — DOIT rester en tout premier ──
if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function (compareFn) {
    return this.slice().sort(compareFn);
  };
}
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function () {
    return this.slice().reverse();
  };
}
if (!Array.prototype.toSpliced) {
  Array.prototype.toSpliced = function (start, deleteCount, ...items) {
    const copy = this.slice();
    copy.splice(start, deleteCount, ...items);
    return copy;
  };
}
if (!Array.prototype.with) {
  Array.prototype.with = function (index, value) {
    const copy = this.slice();
    copy[index] = value;
    return copy;
  };
}

const fs = require("fs");
const path = require("path");
const { createServer } = require("http");
const { parse } = require("url");

const UPLOAD_MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function tryServeUpload(req, res, urlPath) {
  if (!urlPath || !urlPath.startsWith("/uploads/")) return false;

  const safeName = path.basename(urlPath);
  if (!safeName || safeName.includes("..")) return false;

  const filePath = path.join(__dirname, "public", "uploads", safeName);
  const uploadsRoot = path.join(__dirname, "public", "uploads");
  if (!filePath.startsWith(uploadsRoot)) return false;

  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader("Content-Type", UPLOAD_MIME[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

function tryServeNextImageUpload(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname || "";
  if (pathname !== "/_next/image") return false;
  const src = parsedUrl.query?.url;
  if (typeof src !== "string" || !src.startsWith("/uploads/")) return false;
  return tryServeUpload(req, res, src);
}

// ── .env (prioritaire sur variables cPanel) ──
(function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch (err) {
    console.error("[server.js] .env:", err.message || err);
  }
})();

process.chdir(__dirname);
process.env.APP_ROOT = __dirname;

if (process.env.DATABASE_USER && process.env.DATABASE_NAME) {
  delete process.env.DATABASE_URL;
}

const logPath = path.join(__dirname, "startup-error.log");
function logStartup(msg, err) {
  const line = `[${new Date().toISOString()}] ${msg}${err ? " " + (err.stack || err) : ""}\n`;
  console.error(line.trim());
  try {
    fs.appendFileSync(logPath, line);
  } catch {
    /* ignore */
  }
}

const hasNextBuild = fs.existsSync(path.join(__dirname, ".next", "BUILD_ID"));
const hasNodeModules = fs.existsSync(
  path.join(__dirname, "node_modules", "next", "package.json")
);

logStartup(
  `Boot — Node ${process.version}, PORT=${process.env.PORT || "?"}, ` +
    `NODE_ENV=${process.env.NODE_ENV || "undefined"}, .next=${hasNextBuild}, deps=${hasNodeModules}`
);

let nextApp = null;
let handle = null;
let isReady = false;
let bootError = null;

if (hasNextBuild && hasNodeModules) {
  try {
    const next = require("next");
    const dev = process.env.NODE_ENV !== "production";
    nextApp = next({ dev, dir: __dirname });
    handle = nextApp.getRequestHandler();
    nextApp
      .prepare()
      .then(() => {
        isReady = true;
        logStartup("Next.js prêt");
      })
      .catch((err) => {
        bootError = err;
        logStartup("Échec app.prepare()", err);
      });
  } catch (err) {
    bootError = err;
    logStartup("Échec require(next)", err);
  }
} else {
  bootError = new Error(
    !hasNextBuild
      ? "Dossier .next absent — extrayez queenofex-deploy.zip dans ~/queenofex"
      : "node_modules/next absent — lancez: npm install --omit=dev"
  );
  logStartup(bootError.message);
}

const server = createServer(async (req, res) => {
  if (bootError || !handle) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(
      bootError?.message ||
        "Application en cours de démarrage — voir startup-error.log"
    );
    return;
  }
  if (!isReady) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Application en cours de démarrage…");
    return;
  }
  try {
    const parsedUrl = parse(req.url, true);
    const pathname = parsedUrl.pathname || "";
    if (tryServeUpload(req, res, pathname)) return;
    if (tryServeNextImageUpload(req, res, parsedUrl)) return;
    await handle(req, res, parsedUrl);
  } catch (err) {
    logStartup("Erreur requête " + req.url, err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

function onListening() {
  const target =
    typeof PhusionPassenger !== "undefined"
      ? "passenger"
      : String(process.env.PORT || "3000");
  logStartup(`Écoute sur ${target}`);
}

// Passenger exige que listen() soit appelé rapidement — jamais process.exit() avant
if (typeof PhusionPassenger !== "undefined") {
  PhusionPassenger.configure({ autoInstall: false });
  server.listen("passenger", onListening);
} else {
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, "0.0.0.0", onListening);
}

server.on("error", (err) => {
  logStartup("Erreur serveur HTTP", err);
});
