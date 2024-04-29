import flame from "./flame.server";
function runMath(a:number, b:number) {
  return a + b;
}

export default flame(runMath, {
  path: import.meta.url,
  guest: {
    cpu_kind: "shared",
    cpus: 2,
    memory_mb: 1024
  }
});