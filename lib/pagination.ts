/** Pages à afficher : la première, la dernière et deux voisines de la page courante. */
export function paginationRange(current: number, last: number): Array<number | "gap"> {
  const pages = new Set([1, last, current - 1, current, current + 1].filter((page) => page >= 1 && page <= last));
  const sorted = [...pages].sort((a, b) => a - b);
  const range: Array<number | "gap"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) range.push("gap");
    range.push(page);
  });
  return range;
}
