// Compare two highlights by reading order (used for client-side sorting)
export function compareByPosition(
  a: { positionPart: number; positionPara: number; positionSeg: number },
  b: { positionPart: number; positionPara: number; positionSeg: number },
): number {
  if (a.positionPart !== b.positionPart) return a.positionPart - b.positionPart;
  if (a.positionPara !== b.positionPara) return a.positionPara - b.positionPara;
  return a.positionSeg - b.positionSeg;
}
