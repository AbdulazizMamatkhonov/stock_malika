import { useEffect, useState } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import api from "../lib/api";

type ProductVariantRow = {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  attributes?: Record<string, string>;
};

const ProductsPage = () => {
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/products");
      const flattened: ProductVariantRow[] = (response.data || []).flatMap((product: any) =>
        (product.variants || []).map((variant: any) => ({
          id: variant._id,
          productName: product.name,
          variantName: variant.name,
          sku: variant.sku,
          attributes: variant.attributes || undefined
        }))
      );
      setVariants(flattened);
    };
    load();
  }, []);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Products
      </Typography>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Attributes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell>{variant.productName}</TableCell>
                <TableCell>{variant.variantName}</TableCell>
                <TableCell>{variant.sku}</TableCell>
                <TableCell>
                  {variant.attributes
                    ? Object.entries(variant.attributes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default ProductsPage;
