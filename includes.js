async function loadInclude(id, file) {
  const el = document.getElementById(id);
  if (!el) return;

  try {
    const res = await fetch(file, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Could not load ${file}`);

    const html = await res.text();
    el.innerHTML = html;

    const scripts = Array.from(el.querySelectorAll("script"));
    for (const oldScript of scripts) {
      const newScript = document.createElement("script");
      for (const attr of oldScript.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.replaceWith(newScript);
    }
  } catch (err) {
    console.error(err);
  }
}

window.scamScouterIncludesReady = Promise.all([
  loadInclude("site-analytics", "/analytics.html"),
  loadInclude("site-header", "/header.html"),
  loadInclude("site-footer", "/footer.html")
]).then(() => {
  window.dispatchEvent(new Event("scamscouter:includes-ready"));
});