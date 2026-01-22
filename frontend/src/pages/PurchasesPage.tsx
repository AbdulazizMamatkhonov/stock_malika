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

const PurchasesPage = () => {
  const { activeStoreId } = useStoreContext();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [paidNow, setPaidNow] = useState(0);
  const [items, setItems] = useState<Array<{ productVariantId: string; quantity: number; unitCost: number }>>([
    { productVariantId: "", quantity: 1, unitCost: 0 }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [purchaseRes, supplierRes, productRes] = await Promise.all([
        api.get("/purchases"),
        api.get("/suppliers"),
        api.get("/products")
      ]);
      setPurchases(purchaseRes.data || []);
      setSuppliers(supplierRes.data || []);
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

  const totalCost = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
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
    setItems((prev) => [...prev, { productVariantId: "", quantity: 1, unitCost: 0 }]);
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
      const response = await api.post("/purchases", {
        storeId: activeStoreId,
        supplierId,
        paidNow,
        items
      });
      setPurchases((prev) => [response.data, ...prev]);
      setSupplierId("");
      setPaidNow(0);
      setItems([{ productVariantId: "", quantity: 1, unitCost: 0 }]);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Purchases
        </Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disabled={!activeStoreId}>
          New purchase
        </Button>
      </Box>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Total cost</TableCell>
              <TableCell align="right">Paid now</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase._id}>
                <TableCell>#{purchase._id.slice(-6)}</TableCell>
                <TableCell align="right">${purchase.totalCost.toFixed(2)}</TableCell>
                <TableCell align="right">${purchase.paidNow.toFixed(2)}</TableCell>
                <TableCell>{new Date(purchase.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New purchase</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="Supplier"
            select
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
          >
            {suppliers.map((supplier) => (
              <MenuItem key={supplier._id} value={supplier._id}>
                {supplier.name}
              </MenuItem>
            ))}
          </TextField>
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
                label="Unit cost"
                type="number"
                value={item.unitCost}
                onChange={(event) => handleItemChange(index, "unitCost", event.target.value)}
                sx={{ width: 160 }}
              />
              <IconButton onClick={() => removeItem(index)} disabled={items.length === 1}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button onClick={addItem}>Add item</Button>
          <TextField
            label="Paid now"
            type="number"
            value={paidNow}
            onChange={(event) => setPaidNow(Number(event.target.value))}
          />
          <Typography variant="subtitle2">Total cost: ${totalCost.toFixed(2)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving || !supplierId || items.some((item) => !item.productVariantId)}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchasesPage;
