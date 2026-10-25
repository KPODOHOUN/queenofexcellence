#!/usr/bin/env node
/**
 * Correctif votes true/false — à lancer sur le serveur cPanel :
 *   ~/nodevenv/queenofex/18/bin/node ~/queenofex/patch-votes-online.js
 */
const fs = require("fs");
const { execSync } = require("child_process");

const APP = process.env.HOME + "/queenofex";
const DIRS = [
  APP + "/.next/server/chunks",
  APP + "/.next/server/chunks/ssr",
];

const NUMERIC_SET =
  'new Set(["vote_count","number","order","vote_price","amount","price","quantity","stock","max_uses","candidate_count"])';

function listJsFiles() {
  const files = new Set();
  for (const dir of DIRS) {
    try {
      execSync(`test -d "${dir}"`, { stdio: "ignore" });
      const out = execSync(
        `find "${dir}" -name '*.js' ! -name '*.map*' ! -name '*.bak*' 2>/dev/null`,
        { encoding: "utf8" }
      );
      for (const f of out.trim().split("\n")) {
        if (f) files.add(f);
      }
    } catch {
      /* dir missing */
    }
  }
  return [...files];
}

function patchCamelKeys(content) {
  if (content.includes('vote_count","number","order')) return content;

  let s = content;

  s = s.replace(
    /(function \w+\(\w+\)\{if\(!\w+\)return null;let )(\w=\{\};for\(let\[(\w),(\w+)\]of Object\.entries\(\w+\)\)\{var (\w);)/g,
    `$1n=${NUMERIC_SET},$2`
  );

  s = s.replace(
    /\]=0!==\((\w)=(\w+)\)&&\(1===\1\|\|\1\)/g,
    (m, a, i) => {
      if (m.includes("n.has")) return m;
      const keyVar = i === "i" ? "r" : "e";
      return `]=n.has(${keyVar})?${i}:0!==(${a}=${i})&&(1===${a}||${a})`;
    }
  );

  s = s.replace(
    /\]=0===\w+\?!1:1===\w+\?!0:\w+/g,
    (m) => {
      if (m.includes("n.has")) return m;
      return `]=n.has(r)?i:0===i?!1:1===i?!0:i`;
    }
  );

  return s;
}

function voteExpr(varName) {
  return `(typeof ${varName}==="boolean"?${varName}?1:0:Number(${varName}??0))`;
}

function patchDisplay(content) {
  let s = content;
  if (!s.includes("voteCount")) return s;

  // (a.voteCount??0).toLocaleString("fr-FR")
  s = s.replace(
    /\(([a-z])\.voteCount\?\?0\)\.toLocaleString\("fr-FR"\)/g,
    (_, v) => `${voteExpr(`${v}.voteCount`)}.toLocaleString("fr-FR")`
  );

  // j(a.voteCount) si j absent — helper inline displayVoteCount
  if (!s.includes('function j(a){if("boolean"==typeof a)')) {
    s = s.replace(
      /(\w)\(([a-z])\.voteCount\)\.toLocaleString/g,
      (_, fn, v) => {
        if (fn === "Number") {
          return `${voteExpr(`${v}.voteCount`)}.toLocaleString`;
        }
        return `${fn}(${v}.voteCount).toLocaleString`;
      }
    );
  }

  // tri : j(b.voteCount)-j(a.voteCount) ou (b.voteCount??0)-(a.voteCount??0)
  s = s.replace(
    /\(([a-z])\.voteCount\?\?0\)-\(([a-z])\.voteCount\?\?0\)/g,
    (_, b, a) => `${voteExpr(`${b}.voteCount`)}-${voteExpr(`${a}.voteCount`)}`
  );

  // children:c.voteCount seul (React affiche rien pour true)
  s = s.replace(
    /children:(\w+)\.voteCount(?![?.])/g,
    (_, v) => `children:${voteExpr(`${v}.voteCount`)}`
  );

  return s;
}

function main() {
  if (!fs.existsSync(APP + "/.next")) {
    console.error("✗ Dossier ~/queenofex/.next introuvable.");
    process.exit(1);
  }

  const already = listJsFiles().some((f) => {
    try {
      return fs.readFileSync(f, "utf8").includes('vote_count","number","order');
    } catch {
      return false;
    }
  });

  if (already) {
    console.log("ℹ camelKeys semble déjà corrigé (NUMERIC_COLUMNS présent).");
    console.log("  Patch affichage voteCount uniquement si besoin…");
  }

  let count = 0;
  for (const file of listJsFiles()) {
    let original;
    try {
      original = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    let patched = patchCamelKeys(original);
    patched = patchDisplay(patched);

    if (patched === original) continue;

    fs.writeFileSync(file + ".bakvotes", original);
    fs.writeFileSync(file, patched);
    console.log("✓", file.replace(APP, "~"));
    count++;
  }

  console.log("");
  if (count === 0) {
    console.log("⚠ Aucun fichier modifié.");
    console.log("  Si le bug persiste, envoyez : grep -rl voteCount ~/.next/server/chunks | head");
  } else {
    console.log(`✓ ${count} fichier(s) patché(s).`);
    console.log("");
    console.log("→ cPanel : Setup Node.js → ARRÊTER");
    console.log("→ Attendre 2 minutes");
    console.log("→ DÉMARRER");
    console.log("→ Ctrl+F5 sur la page événement / fiche candidate");
  }
}

main();
