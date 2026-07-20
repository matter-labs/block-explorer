export const computeFromToMinMax = (
  from: string,
  to?: string
): { fromToMin: string | null; fromToMax: string | null } => {
  if (!from || !to) return { fromToMin: null, fromToMax: null };
  return from.toLowerCase() <= to.toLowerCase()
    ? { fromToMin: from, fromToMax: to }
    : { fromToMin: to, fromToMax: from };
};
