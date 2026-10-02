export const getExpandableId = (
  value: string | { id: string } | null | undefined,
): string | null => {
  if (!value) return null;

  return typeof value === 'string' ? value : value.id;
};

export const fromUnixSeconds = (
  unixSeconds: number | null | undefined,
): Date | null => (unixSeconds ? new Date(unixSeconds * 1000) : null);
