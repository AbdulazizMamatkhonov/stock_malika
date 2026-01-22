import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import api from "../lib/api";

type Variant = {
  _id: string;
  sku: string;
  name: string;
  attributes?: Record<string, string>;
};

type Product = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  variants: Variant[];
};

type ProductFormState = {
  id: string;
  name: string;
  description: string;
  category: string;
};

type VariantFormState = {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  attributes: string;
};

const emptyProductForm: ProductFormState = {
  id: "",
  name: "",
  description: "",
  category: ""
};

const emptyVariantForm: VariantFormState = {
  productId: "",
  sku: "",
  name: "",
  attributes: ""
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState("");
  const [confirmDialogBody, setConfirmDialogBody] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(
    null
  );
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [variantForm, setVariantForm] = useState<VariantFormState>(emptyVariantForm);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data || []);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("Unable to load products right now.");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenProductDialog = (product: Product) => {
    setDialogError(null);
    setProductForm({
      id: product._id,
      name: product.name,
      description: product.description || "",
      category: product.category || ""
    });
    setProductDialogOpen(true);
  };

  const handleOpenVariantDialog = (product: Product, variant?: Variant) => {
    setDialogError(null);
    setVariantForm({
      productId: product._id,
      variantId: variant?._id,
      sku: variant?.sku || "",
      name: variant?.name || "",
      attributes: variant?.attributes ? JSON.stringify(variant.attributes, null, 2) : ""
    });
    setVariantDialogOpen(true);
  };

  const closeDialogs = () => {
    setProductDialogOpen(false);
    setVariantDialogOpen(false);
    setDialogError(null);
  };

  const parseAttributes = () => {
    if (!variantForm.attributes.trim()) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(variantForm.attributes);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { error: "Attributes must be a JSON object with string values." };
      }
      const entries = Object.entries(parsed);
      if (entries.some(([, value]) => typeof value !== "string")) {
        return { error: "Attributes values must all be strings." };
      }
      return { data: parsed as Record<string, string> };
    } catch {
      return { error: "Attributes must be valid JSON." };
    }
  };

  const handleSaveProduct = async () => {
    try {
      const response = await api.patch(`/products/${productForm.id}`, {
        name: productForm.name,
        description: productForm.description || undefined,
        category: productForm.category || undefined
      });
      setProducts((prev) =>
        prev.map((product) => (product._id === response.data._id ? response.data : product))
      );
      closeDialogs();
    } catch (error: any) {
      setDialogError(error.response?.data?.message || "Unable to update product.");
    }
  };

  const handleSaveVariant = async () => {
    const attributesResult = parseAttributes();
    if (attributesResult && "error" in attributesResult) {
      setDialogError(attributesResult.error);
      return;
    }

    try {
      if (variantForm.variantId) {
        const response = await api.patch(
          `/products/${variantForm.productId}/variants/${variantForm.variantId}`,
          {
            sku: variantForm.sku,
            name: variantForm.name,
            attributes: attributesResult?.data
          }
        );
        setProducts((prev) =>
          prev.map((product) =>
            product._id === variantForm.productId
              ? {
                  ...product,
                  variants: product.variants.map((variant) =>
                    variant._id === response.data._id ? response.data : variant
                  )
                }
              : product
          )
        );
      } else {
        const response = await api.post(`/products/${variantForm.productId}/variants`, {
          sku: variantForm.sku,
          name: variantForm.name,
          attributes: attributesResult?.data
        });
        setProducts((prev) =>
          prev.map((product) =>
            product._id === variantForm.productId
              ? {
                  ...product,
                  variants: [...product.variants, response.data]
                }
              : product
          )
        );
      }
      closeDialogs();
    } catch (error: any) {
      setDialogError(error.response?.data?.message || "Unable to save variant.");
    }
  };

  const handleConfirmDelete = (
    title: string,
    body: string,
    action: () => Promise<void>
  ) => {
    setConfirmDialogTitle(title);
    setConfirmDialogBody(body);
    setConfirmAction(() => action);
    setConfirmDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    await api.delete(`/products/${productId}`);
    setProducts((prev) => prev.filter((product) => product._id !== productId));
  };

  const handleDeleteVariant = async (productId: string, variantId: string) => {
    await api.delete(`/products/${productId}/variants/${variantId}`);
    setProducts((prev) =>
      prev.map((product) =>
        product._id === productId
          ? {
              ...product,
              variants: product.variants.filter((variant) => variant._id !== variantId)
            }
          : product
      )
    );
  };

  const confirmDialogAction = useMemo(() => confirmAction, [confirmAction]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Products
        </Typography>
        <Button variant="outlined" onClick={loadProducts}>
          Refresh
        </Button>
      </Stack>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      <Stack spacing={3}>
        {products.map((product) => (
          <Paper key={product._id} sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {product.name}
                </Typography>
                {product.category && (
                  <Typography variant="body2" color="text.secondary">
                    Category: {product.category}
                  </Typography>
                )}
                {product.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {product.description}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: { xs: 2, md: 0 } }}>
                <Button variant="outlined" onClick={() => handleOpenProductDialog(product)}>
                  Edit product
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() =>
                    handleConfirmDelete(
                      "Delete product",
                      "This will remove the product and all of its variants.",
                      () => handleDeleteProduct(product._id)
                    )
                  }
                >
                  Delete
                </Button>
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Variants
              </Typography>
              <Button variant="contained" onClick={() => handleOpenVariantDialog(product)}>
                Add variant
              </Button>
            </Stack>
            {product.variants.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No variants yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Attributes</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {product.variants.map((variant) => (
                    <TableRow key={variant._id}>
                      <TableCell>{variant.sku}</TableCell>
                      <TableCell>{variant.name}</TableCell>
                      <TableCell>
                        {variant.attributes ? JSON.stringify(variant.attributes) : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleOpenVariantDialog(product, variant)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={() =>
                              handleConfirmDelete(
                                "Delete variant",
                                "This will remove the variant from the product.",
                                () => handleDeleteVariant(product._id, variant._id)
                              )
                            }
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        ))}
      </Stack>

      <Dialog open={productDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Edit product</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Name"
              value={productForm.name}
              onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
              fullWidth
            />
            <TextField
              label="Category"
              value={productForm.category}
              onChange={(event) =>
                setProductForm({ ...productForm, category: event.target.value })
              }
              fullWidth
            />
            <TextField
              label="Description"
              value={productForm.description}
              onChange={(event) =>
                setProductForm({ ...productForm, description: event.target.value })
              }
              fullWidth
              multiline
              rows={3}
            />
            {dialogError && <Alert severity="error">{dialogError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProduct}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={variantDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>{variantForm.variantId ? "Edit variant" : "Add variant"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="SKU"
              value={variantForm.sku}
              onChange={(event) => setVariantForm({ ...variantForm, sku: event.target.value })}
              fullWidth
            />
            <TextField
              label="Variant name"
              value={variantForm.name}
              onChange={(event) => setVariantForm({ ...variantForm, name: event.target.value })}
              fullWidth
            />
            <TextField
              label="Attributes (JSON)"
              value={variantForm.attributes}
              onChange={(event) =>
                setVariantForm({ ...variantForm, attributes: event.target.value })
              }
              fullWidth
              multiline
              minRows={3}
            />
            {dialogError && <Alert severity="error">{dialogError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVariant}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{confirmDialogTitle}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialogBody}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (confirmDialogAction) {
                await confirmDialogAction();
              }
              setConfirmDialogOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
