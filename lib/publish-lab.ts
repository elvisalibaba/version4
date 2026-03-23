export type PublishLabFormatState = {
  enabled: boolean;
  price: string;
  printingCost: string;
  stockQuantity: string;
  published: boolean;
};

export const initialOptionalFormat: PublishLabFormatState = {
  enabled: false,
  price: "0",
  printingCost: "",
  stockQuantity: "",
  published: false,
};

export function buildOptionalFormatState(
  format:
    | {
        price: number;
        printing_cost: number | null;
        stock_quantity: number | null;
        is_published?: boolean;
      }
    | undefined,
): PublishLabFormatState {
  if (!format) return initialOptionalFormat;

  return {
    enabled: true,
    price: String(format.price ?? 0),
    printingCost: format.printing_cost !== null ? String(format.printing_cost) : "",
    stockQuantity: format.stock_quantity ? String(format.stock_quantity) : "",
    published: Boolean(format.is_published),
  };
}
