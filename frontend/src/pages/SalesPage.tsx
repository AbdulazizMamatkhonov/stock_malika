import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useStoreContext } from "../lib/storeContext";

type ProductVariantOption = {
  id: string;
  label: string;
  sku: string;
  name: string;
  productName: string;
};

type SaleLineItem = {
  productVariantId: string;
  quantity: string;
  unitPrice: string;
};

const createEmptyLineItem = (): SaleLineItem => ({
  productVariantId: "",
  quantity: "",
  unitPrice: ""
});

const SalesPage = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductVariantOption[]>([]);
  const [items, setItems] = useState<SaleLineItem[]>([createEmptyLineItem()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeStoreId } = useStoreContext();

  const lineErrors = useMemo(
    () =>
      items.map((item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        return {
          productVariantId: item.productVariantId.trim().length === 0,
          quantity:
            item.quantity.trim().length === 0 || !Number.isFinite(quantity) || quantity <= 0,
          unitPrice:
            item.unitPrice.trim().length === 0 || !Number.isFinite(unitPrice) || unitPrice < 0
        };
      }),
    [items]
  );

  const hasInvalidLine = lineErrors.some(
    (error) => error.productVariantId || error.quantity || error.unitPrice
  );
  const canSubmit =
    Boolean(activeStoreId) && items.length > 0 && !hasInvalidLine && products.length > 0;

  useEffect(() => {
    const loadSales = async () => {
      const response = await api.get("/sales");
      setSales(response.data || []);
    };
    const loadProducts = async () => {
      const response = await api.get("/products");
      const flattened: ProductVariantOption[] = (response.data || []).flatMap(
        (product: any) =>
          (product.variants || []).map((variant: any) => ({
            id: variant._id,
            label: `${product.name} · ${variant.name}${variant.sku ? ` (${variant.sku})` : ""}`,
            sku: variant.sku,
            name: variant.name,
            productName: product.name
          }))
      );
      setProducts(flattened);
    };
    loadSales();
    loadProducts();
  }, []);

  const handleItemChange = (index: number, field: keyof SaleLineItem, value: string) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    );
  };

  const handleAddLine = () => {
    setItems((prev) => [...prev, createEmptyLineItem()]);
  };

  const handleRemoveLine = (index: number) => {
    setItems((prev) => prev.filter((_item, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async () => {
    if (!activeStoreId) {
      setFormError("Select a store before recording a sale.");
      return;
    }
    if (!canSubmit) {
      setFormError("Complete each line item with a product, quantity, and price.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        storeId: activeStoreId,
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      };
      const response = await api.post("/sales", payload);
      setSales((prev) => [response.data, ...prev]);
      setItems([createEmptyLineItem()]);
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message || "Unable to record sale. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Sales
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              New sale
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add line items and submit to record a sale.
            </Typography>
          </Box>
          {products.length === 0 && (
            <Alert
              severity="info"
              action={
                <Button component={Link} to="/products" color="inherit" size="small">
                  Go to Products
                </Button>
              }
            >
              No products available.
            </Alert>
          )}
          {formError && <Alert severity="error">{formError}</Alert>}
          {items.map((item, index) => (
            <Paper key={`line-${index}`} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    select
                    label="Product"
                    value={item.productVariantId}
                    onChange={(event) =>
                      handleItemChange(index, "productVariantId", event.target.value)
                    }
                    fullWidth
                    error={lineErrors[index]?.productVariantId}
                    helperText={
                      lineErrors[index]?.productVariantId ? "Select a product" : " "
                    }
                  >
                    {products.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Quantity"
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    value={item.quantity}
                    onChange={(event) => handleItemChange(index, "quantity", event.target.value)}
                    fullWidth
                    error={lineErrors[index]?.quantity}
                    helperText={
                      lineErrors[index]?.quantity ? "Enter a quantity greater than 0" : " "
                    }
                  />
                  <TextField
                    label="Unit price"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={item.unitPrice}
                    onChange={(event) => handleItemChange(index, "unitPrice", event.target.value)}
                    fullWidth
                    error={lineErrors[index]?.unitPrice}
                    helperText={
                      lineErrors[index]?.unitPrice ? "Enter a valid price" : " "
                    }
                  />
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Button
                    color="error"
                    onClick={() => handleRemoveLine(index)}
                    disabled={items.length === 1}
                  >
                    Remove line
                  </Button>
                  {index === items.length - 1 && (
                    <Button onClick={handleAddLine} disabled={products.length === 0}>
                      Add line item
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
          <Divider />
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              Record sale
            </Button>
          </Stack>
        </Stack>
      </Paper>
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
    </Box>
  );
};

export default SalesPage;
