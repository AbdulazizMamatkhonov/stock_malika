import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import api from "../lib/api";

type Product = {
  _id: string;
  name: string;
  category?: string;
  variants?: Array<{ _id: string; name: string; sku: string }>;
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [variantName, setVariantName] = useState("");
  const [sku, setSku] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/products");
      setProducts(response.data || []);
    };
    load();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const response = await api.post("/products", {
        name,
        category: category || undefined,
        variants: [{ name: variantName, sku }]
      });
      setProducts((prev) => [response.data, ...prev]);
      setName("");
      setCategory("");
      setVariantName("");
      setSku("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Products
        </Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add product
        </Button>
      </Box>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Variants</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category || "-"}</TableCell>
                <TableCell>
                  {(product.variants || [])
                    .map((variant) => `${variant.name} (${variant.sku})`)
                    .join(", ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New product</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField label="Product name" value={name} onChange={(event) => setName(event.target.value)} />
          <TextField label="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
          <TextField label="Variant name" value={variantName} onChange={(event) => setVariantName(event.target.value)} />
          <TextField label="SKU" value={sku} onChange={(event) => setSku(event.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !name || !variantName || !sku}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
