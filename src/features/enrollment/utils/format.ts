export function formatPrice(price: number) {
  return price.toLocaleString('ko-KR') + '원';
}

export function formatDateRange(start: string, end: string) {
  const fmt = (d: string) => d.replace(/-/g, '.').slice(2);
  return `${fmt(start)} ~ ${fmt(end)}`;
}
