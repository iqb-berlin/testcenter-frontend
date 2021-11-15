export function json(ob: unknown): unknown {
  return JSON.parse(JSON.stringify(ob));
}

export const perSequenceId = (agg: { [index: number]: string }, stuff: string, index): { [index: number]: string } => {
  agg[index + 1] = stuff;
  return agg;
};
