import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import api from "../lib/api";
import { useStoreContext } from "../lib/storeContext";

type Supplier = {
  _id: string;
  name: string;
};

type ProductVariant = {
  _id: string;
  name: string;
  sku: string;
  productName: string;
};

type PurchaseItemInput = {
  id: string;
  productVariantId: string;
  quantity: string;
  unitCost: string;
};

const PurchasesPage = () => {
  const { activeStoreId } = useStoreContext();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [paidNow, setPaidNow] = useState("0");
  const [items, setItems] = useState<PurchaseItemInput[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadPurchases = async () => {
      const response = await api.get("/purchases");
      setPurchases(response.data || []);
    };
    const loadSupportingData = async () => {
      const [suppliersResponse, productsResponse] = await Promise.all([
        api.get("/suppliers"),
        api.get("/products")
      ]);
      setSuppliers(suppliersResponse.data || []);
      const variants =
        productsResponse.data?.flatMap((product: any) =>
          (product.variants || []).map((variant: any) => ({
            _id: variant._id,
            name: variant.name,
            sku: variant.sku,
            productName: product.name
          }))
        ) || [];
      setProductVariants(variants);
    };
    loadPurchases();
    loadSupportingData();
  }, []);

  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!Number.isFinite(sum)) {
        return Number.NaN;
      }
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitCost)) {
        return Number.NaN;
      }
      return sum + quantity * unitCost;
    }, 0);
  }, [items]);

  const paidNowNumber = Number(paidNow);
  const totalsInvalid =
    !Number.isFinite(totalCost) ||
    totalCost <= 0 ||
    !Number.isFinite(paidNowNumber) ||
    paidNowNumber < 0 ||
    paidNowNumber > totalCost;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        productVariantId: "",
        quantity: "",
        unitCost: ""
      }
    ]);
  };

  const handleItemChange = (id: string, field: keyof PurchaseItemInput, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!activeStoreId) {
      errors.push("Select a store before creating a purchase.");
    }

    if (!supplierId) {
      errors.push("Select a supplier before creating a purchase.");
    }

    if (items.length === 0) {
      errors.push("Add at least one purchase item.");
    }

    items.forEach((item, index) => {
      if (!item.productVariantId) {
        errors.push(`Select a product for item ${index + 1}.`);
      }
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        errors.push(`Enter a valid quantity for item ${index + 1}.`);
      }
      if (!Number.isFinite(unitCost) || unitCost <= 0) {
        errors.push(`Enter a valid unit cost for item ${index + 1}.`);
      }
    });

    if (!Number.isFinite(paidNowNumber) || paidNowNumber < 0) {
      errors.push("Enter a valid paid amount.");
    }

    if (!Number.isFinite(totalCost) || totalCost <= 0) {
      errors.push("Total cost must be greater than zero.");
    }

    if (Number.isFinite(totalCost) && Number.isFinite(paidNowNumber) && paidNowNumber > totalCost) {
      errors.push("Paid now cannot exceed the total cost.");
    }

    return errors;
  };

  const handleSubmit = async () => {
    setFormErrors([]);
    setApiError(null);

    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        storeId: activeStoreId,
        supplierId,
        paidNow: paidNowNumber,
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost)
        }))
      };
      const response = await api.post("/purchases", payload);
      setPurchases((prev) => [response.data, ...prev]);
      setSupplierId("");
      setPaidNow("0");
      setItems([]);
    } catch (error: any) {
      setApiError(error?.response?.data?.message || "Failed to create purchase.");
    } finally {
      setSubmitting(false);
    }
  };

  const showMissingDataBanner = suppliers.length === 0 || productVariants.length === 0;

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Purchases
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            New purchase
          </Typography>
          {showMissingDataBanner && (
            <Alert severity="info">
              <Stack spacing={1}>
                <Typography variant="body2">
                  No suppliers/products available yet. Create them to start recording purchases.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Link component={RouterLink} to="/suppliers" underline="hover">
                    Create supplier
                  </Link>
                  <Link component={RouterLink} to="/inventory" underline="hover">
                    Create product
                  </Link>
                </Stack>
              </Stack>
            </Alert>
          )}
          {formErrors.length > 0 && (
            <Alert severity="error">
              <Stack component="ul" spacing={0.5} sx={{ pl: 2, m: 0 }}>
                {formErrors.map((error) => (
                  <li key={error}>
                    <Typography variant="body2">{error}</Typography>
                  </li>
                ))}
              </Stack>
            </Alert>
          )}
          {apiError && <Alert severity="error">{apiError}</Alert>}
          <FormControl fullWidth>
            <InputLabel id="supplier-label">Supplier</InputLabel>
            <Select
              labelId="supplier-label"
              label="Supplier"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              disabled={suppliers.length === 0}
            >
              {suppliers.map((supplier) => (
                <MenuItem key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Paid now"
            type="number"
            value={paidNow}
            onChange={(event) => setPaidNow(event.target.value)}
            inputProps={{ min: 0, step: "0.01" }}
          />
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={600}>
                Items
              </Typography>
              <Button variant="outlined" onClick={handleAddItem}>
                Add item
              </Button>
            </Stack>
            {items.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No items added yet.
              </Typography>
            )}
            {items.map((item, index) => (
              <Stack key={item.id} spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <FormControl fullWidth>
                    <InputLabel id={`product-${item.id}`}>Product</InputLabel>
                    <Select
                      labelId={`product-${item.id}`}
                      label="Product"
                      value={item.productVariantId}
                      onChange={(event) =>
                        handleItemChange(item.id, "productVariantId", event.target.value)
                      }
                      disabled={productVariants.length === 0}
                    >
                      {productVariants.map((variant) => (
                        <MenuItem key={variant._id} value={variant._id}>
                          {variant.productName} · {variant.name} ({variant.sku})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(event) =>
                      handleItemChange(item.id, "quantity", event.target.value)
                    }
                    inputProps={{ min: 0, step: "1" }}
                    sx={{ minWidth: 140 }}
                  />
                  <TextField
                    label="Unit cost"
                    type="number"
                    value={item.unitCost}
                    onChange={(event) =>
                      handleItemChange(item.id, "unitCost", event.target.value)
                    }
                    inputProps={{ min: 0, step: "0.01" }}
                    sx={{ minWidth: 160 }}
                  />
                  <Button color="error" onClick={() => handleRemoveItem(item.id)}>
                    Remove
                  </Button>
                </Stack>
                {index < items.length - 1 && <Divider />}
              </Stack>
            ))}
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Typography variant="subtitle2" fontWeight={600}>
              Total cost: {Number.isFinite(totalCost) ? `$${totalCost.toFixed(2)}` : "--"}
            </Typography>
            <Typography variant="subtitle2" fontWeight={600}>
              Paid now:{" "}
              {Number.isFinite(paidNowNumber) ? `$${paidNowNumber.toFixed(2)}` : "--"}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || totalsInvalid}
          >
            {submitting ? "Saving..." : "Create purchase"}
          </Button>
        </Stack>
      </Paper>
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
