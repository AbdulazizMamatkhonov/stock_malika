import { useEffect, useState } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import api from "../lib/api";
import { useStoreContext } from "../lib/storeContext";

type InventoryItem = {
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantityRemaining: number;
  avgUnitCost: number;
};

const InventoryPage = () => {
  const { activeStoreId } = useStoreContext();
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!activeStoreId) {
        return;
      }
      const response = await api.get("/inventory", { params: { storeId: activeStoreId } });
      setItems(response.data || []);
    };
    load();
  }, [activeStoreId]);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Inventory
      </Typography>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell align="right">On hand</TableCell>
              <TableCell align="right">Avg unit cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.productVariantId}>
                <TableCell>{item.productName}</TableCell>
                <TableCell>{item.variantName}</TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell align="right">{item.quantityRemaining}</TableCell>
                <TableCell align="right">${item.avgUnitCost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default InventoryPage;
