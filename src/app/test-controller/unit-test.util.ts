export function json(ob: unknown): unknown {
  return JSON.parse(JSON.stringify(ob));
}
