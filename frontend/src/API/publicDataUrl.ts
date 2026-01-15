// publicDataUrl.ts
const BASE_PATH = import.meta.env.BASE_URL; // "/" locally, "/GenomeVisProject/" on Pages
const ROOT = "dataroot";

export function publicDataUrl(pathFromDataRoot: string) {
  const clean = pathFromDataRoot.replace(/^\//, "");
  const base = BASE_PATH.endsWith("/") ? BASE_PATH : `${BASE_PATH}/`;
  return `${base}${ROOT}/${clean}`;
}
