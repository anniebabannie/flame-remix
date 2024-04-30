import flame from "./flame-remix.server";
function runMath(a:string, b:string) {
  const aNum = parseInt(a);
  const bNum = parseInt(b);
  return aNum + bNum;
}

export default flame(runMath, {
  path: 'runMath',
  // path: import.meta.url,
  guest: {
    cpu_kind: "shared",
    cpus: 2,
    memory_mb: 1024
  }
});