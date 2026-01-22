import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../lib/api";
import { useStoreContext } from "../lib/storeContext";

const SalesPage = () => {
  const { activeStoreId } = useStoreContext();
  const [sales, setSales] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Array<{ productVariantId: string; quantity: number; unitPrice: number }>>([
    { productVariantId: "", quantity: 1, unitPrice: 0 }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [salesRes, productRes] = await Promise.all([
        api.get("/sales"),
        api.get("/products")
      ]);
      setSales(salesRes.data || []);
      const flattened = (productRes.data || []).flatMap((product: any) =>
        (product.variants || []).map((variant: any) => ({
          ...variant,
          productName: product.name
        }))
      );
      setVariants(flattened);
    };
    load();
  }, []);

  const totalRevenue = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items]
  );

  const handleItemChange = (index: number, field: keyof typeof items[number], value: string) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: field === "productVariantId" ? value : Number(value)
            }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { productVariantId: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreate = async () => {
    if (!activeStoreId) {
      return;
    }
    setSaving(true);
    try {
      const response = await api.post("/sales", {
        storeId: activeStoreId,
        items
      });
      setSales((prev) => [response.data, ...prev]);
      setItems([{ productVariantId: "", quantity: 1, unitPrice: 0 }]);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Sales
        </Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disabled={!activeStoreId}>
          New sale
        </Button>
      </Box>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Revenue</TableCell>
              <TableCell align="right">COGS</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale._id}>
                <TableCell>#{sale._id.slice(-6)}</TableCell>
                <TableCell align="right">${sale.totalRevenue.toFixed(2)}</TableCell>
                <TableCell align="right">${sale.totalCogs.toFixed(2)}</TableCell>
                <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New sale</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {items.map((item, index) => (
            <Box key={`item-${index}`} sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Variant"
                select
                fullWidth
                value={item.productVariantId}
                onChange={(event) => handleItemChange(index, "productVariantId", event.target.value)}
              >
                {variants.map((variant) => (
                  <MenuItem key={variant._id} value={variant._id}>
                    {variant.productName} · {variant.name} ({variant.sku})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Qty"
                type="number"
                value={item.quantity}
                onChange={(event) => handleItemChange(index, "quantity", event.target.value)}
                sx={{ width: 120 }}
              />
              <TextField
                label="Unit price"
                type="number"
                value={item.unitPrice}
                onChange={(event) => handleItemChange(index, "unitPrice", event.target.value)}
                sx={{ width: 160 }}
              />
              <IconButton onClick={() => removeItem(index)} disabled={items.length === 1}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button onClick={addItem}>Add item</Button>
          <Typography variant="subtitle2">Total revenue: ${totalRevenue.toFixed(2)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving || items.some((item) => !item.productVariantId)}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesPage;
