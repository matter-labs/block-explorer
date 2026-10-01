(function () {
  const { appBase, assetsUrl, version, assetsVersioned } = document.currentScript.dataset;
  window.__APP_BASE__ = appBase || "/";
  const base = (assetsUrl || window.__APP_BASE__).replace(/\/?$/, "/");
  window.__ASSETS_BASE__ = assetsUrl && assetsVersioned !== "false" && version ? base + version + "/" : base;
})();
