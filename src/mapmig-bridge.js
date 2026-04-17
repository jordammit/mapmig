// mapmig-bridge.js
//
// Abstraction layer between MapMig UI and Tauri backend.
// When running in Tauri, uses invoke() for filesystem access.
// When running in a browser (fallback), uses browser File APIs.
//
// Copyright (c) 2026 iKM Media (Jordan Siegler)

const IS_TAURI = !!(window.__TAURI_INTERNALS__);

// In Tauri v2, invoke is available via the global __TAURI_INTERNALS__
function _invoke(cmd, args) {
  if (!IS_TAURI) return Promise.reject("Not in Tauri");
  return window.__TAURI_INTERNALS__.invoke(cmd, args);
}

/////////////////////////////
// FILE OPEN/SAVE DIALOGS //
///////////////////////////

async function openFileDialog(filters) {
  // filters: [{name: "MAP Files", extensions: ["map"]}]
  if (IS_TAURI) {
    const result = await _invoke("plugin:dialog|open", {
      options: { multiple: false, filters: filters || [] }
    });
    if (!result) return null;
    // Tauri v2 may return a string path or an object with .path
    if (typeof result === "string") return result;
    if (result.path) return result.path;
    if (result.paths && result.paths.length) return result.paths[0];
    // Try to extract from other formats
    return String(result);
  }
  // Browser fallback: use file input
  return new Promise((resolve) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = filters ? filters.map(f => f.extensions.map(e => "." + e).join(",")).join(",") : "";
    inp.onchange = () => resolve(inp.files[0] || null);
    inp.click();
  });
}

async function openMultiFileDialog(filters) {
  if (IS_TAURI) {
    const result = await _invoke("plugin:dialog|open", {
      options: { multiple: true, filters: filters || [] }
    });
    return result || []; // returns array of file path strings
  }
  return new Promise((resolve) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = filters ? filters.map(f => f.extensions.map(e => "." + e).join(",")).join(",") : "";
    inp.multiple = true;
    inp.onchange = () => resolve(Array.from(inp.files));
    inp.click();
  });
}

async function saveFileDialog(defaultName, filters) {
  if (IS_TAURI) {
    const result = await _invoke("plugin:dialog|save", {
      options: { defaultPath: defaultName, filters: filters || [] }
    });
    return result || null; // returns file path string or null
  }
  // Browser: not needed, we use download
  return defaultName;
}

///////////////
// FILE I/O //
/////////////

async function readTextFile(pathOrFile) {
  if (IS_TAURI) {
    return await _invoke("read_text_file", { path: pathOrFile });
  }
  // Browser: pathOrFile is a File object
  return await pathOrFile.text();
}

async function readBinaryFile(pathOrFile) {
  if (IS_TAURI) {
    const arr = await _invoke("read_binary_file", { path: pathOrFile });
    return new Uint8Array(arr).buffer;
  }
  return await pathOrFile.arrayBuffer();
}

async function writeTextFile(pathOrName, content) {
  if (IS_TAURI) {
    await _invoke("write_text_file", { path: pathOrName, content: content });
    return;
  }
  // Browser fallback: download
  _browserDownload(pathOrName, content, "text/plain");
}

async function writeBinaryFile(pathOrName, content) {
  if (IS_TAURI) {
    await _invoke("write_binary_file", { path: pathOrName, content: Array.from(new Uint8Array(content)) });
    return;
  }
  _browserDownload(pathOrName, content, "application/octet-stream");
}

function _browserDownload(name, content, type) {
  const bl = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(bl);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/////////////////
// PATH UTILS //
///////////////

async function getFileName(pathOrFile) {
  if (IS_TAURI) {
    return await _invoke("get_file_name", { path: pathOrFile });
  }
  return pathOrFile.name || pathOrFile;
}

async function getParentDir(path) {
  if (IS_TAURI) {
    return await _invoke("get_parent_dir", { path });
  }
  return "";
}

async function joinPath(dir, filename) {
  if (IS_TAURI) {
    return await _invoke("join_path", { dir, filename });
  }
  return filename;
}

async function generateBackupName(path) {
  if (IS_TAURI) {
    return await _invoke("generate_backup_name", { path });
  }
  // Browser fallback
  const name = typeof path === "string" ? path : path.name || "map";
  const stem = name.replace(/\.[^.]+$/, "");
  const ext = name.match(/\.[^.]+$/)?.[0] || ".map";
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${stem}_original_${ts}${ext}`;
}

//////////////
// RECENTS //
////////////

async function getRecents() {
  if (IS_TAURI) {
    return await _invoke("get_recents");
  }
  try { return JSON.parse(localStorage.getItem("mapmig_recents") || "[]"); } catch { return []; }
}

async function addRecent(name, path) {
  if (IS_TAURI) {
    return await _invoke("add_recent", { name, path: path || name });
  }
  const recents = (await getRecents()).filter(r => r.name !== name);
  recents.unshift({ name, path: path || name, date: Date.now() });
  if (recents.length > 20) recents.length = 20;
  try { localStorage.setItem("mapmig_recents", JSON.stringify(recents)); } catch {}
  return recents;
}

async function clearAllRecents() {
  if (IS_TAURI) {
    await _invoke("clear_recents");
    return;
  }
  try { localStorage.removeItem("mapmig_recents"); } catch {}
}

async function openRecentFile(path) {
  if (IS_TAURI) {
    // In Tauri we can re-read the file directly by path
    const content = await readTextFile(path);
    const name = await getFileName(path);
    return { content, name, path };
  }
  // Browser: can't re-open by path, return null
  return null;
}

///////////////
// SETTINGS //
/////////////

async function getSetting(key) {
  if (IS_TAURI) {
    return await _invoke("get_setting", { key });
  }
  try { return localStorage.getItem("mapmig_" + key); } catch { return null; }
}

async function setSetting(key, value) {
  if (IS_TAURI) {
    await _invoke("set_setting", { key, value });
    return;
  }
  try { localStorage.setItem("mapmig_" + key, value); } catch {}
}

/////////////////////////////
// PERSISTENT WAD LOADING //
///////////////////////////

async function getPersistentWadList() {
  if (IS_TAURI) {
    return await _invoke("get_persistent_wad_list");
  }
  // Browser fallback: IndexedDB (existing implementation in mapmig-editor.js handles this)
  return null; // signals to use IndexedDB fallback
}

async function readPersistentWad(name) {
  if (IS_TAURI) {
    const arr = await _invoke("read_persistent_wad", { name });
    return new Uint8Array(arr).buffer;
  }
  return null;
}

async function savePersistentWadFile(name, data) {
  if (IS_TAURI) {
    await _invoke("save_persistent_wad", { name, data: Array.from(new Uint8Array(data)) });
    return;
  }
}

async function removePersistentWadFile(name) {
  if (IS_TAURI) {
    await _invoke("remove_persistent_wad", { name });
    return;
  }
}

////////////////////
// EXPORT BRIDGE //
//////////////////

window.MapMigBridge = {
  IS_TAURI,
  openFileDialog,
  openMultiFileDialog,
  saveFileDialog,
  readTextFile,
  readBinaryFile,
  writeTextFile,
  writeBinaryFile,
  getFileName,
  getParentDir,
  joinPath,
  generateBackupName,
  getRecents,
  addRecent,
  clearAllRecents,
  openRecentFile,
  getSetting,
  setSetting,
  getPersistentWadList,
  readPersistentWad,
  savePersistentWadFile,
  removePersistentWadFile,
};
