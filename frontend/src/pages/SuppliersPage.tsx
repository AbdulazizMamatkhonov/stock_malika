import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
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
import { useStoreContext } from "../lib/storeContext";

type Supplier = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  balance?: number;
};

const SuppliersPage = () => {
  const { activeStoreId } = useStoreContext();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formValues, setFormValues] = useState({ name: "", phone: "", email: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/suppliers");
      setSuppliers(response.data || []);
    };
    load();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeStoreId) {
      setSubmitError("Select a store before adding suppliers.");
      return;
    }
    setIsSaving(true);
    setFieldErrors({});
    setSubmitError("");
    setSuccessMessage("");
    try {
      const response = await api.post("/suppliers", {
        storeId: activeStoreId,
        name: formValues.name,
        phone: formValues.phone,
        email: formValues.email
      });
      setSuppliers((prev) => [...prev, response.data]);
      setFormValues({ name: "", phone: "", email: "" });
      setSuccessMessage("Supplier added successfully.");
      setToastOpen(true);
    } catch (error: any) {
      const apiErrors = error?.response?.data?.fieldErrors;
      if (apiErrors) {
        setFieldErrors(apiErrors);
      } else {
        setSubmitError("Unable to save supplier. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldError = (field: string) => fieldErrors[field]?.[0] ?? "";

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Suppliers
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Add supplier
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Name"
                value={formValues.name}
                onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
                error={Boolean(getFieldError("name"))}
                helperText={getFieldError("name")}
                fullWidth
                required
              />
              <TextField
                label="Phone"
                value={formValues.phone}
                onChange={(event) => setFormValues({ ...formValues, phone: event.target.value })}
                error={Boolean(getFieldError("phone"))}
                helperText={getFieldError("phone")}
                fullWidth
              />
              <TextField
                label="Email"
                value={formValues.email}
                onChange={(event) => setFormValues({ ...formValues, email: event.target.value })}
                error={Boolean(getFieldError("email"))}
                helperText={getFieldError("email")}
                fullWidth
              />
            </Stack>
            {submitError ? (
              <Alert severity="error">{submitError}</Alert>
            ) : successMessage ? (
              <Alert severity="success">{successMessage}</Alert>
            ) : null}
            <Box>
              <Button type="submit" variant="contained" disabled={isSaving || !activeStoreId}>
                {isSaving ? "Saving..." : "Add supplier"}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        {suppliers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="subtitle1" fontWeight={600}>
              No suppliers yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add your first supplier to start tracking balances.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier._id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.phone || "-"}</TableCell>
                  <TableCell>{supplier.email || "-"}</TableCell>
                  <TableCell align="right">${(supplier.balance || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
      <Snackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)}>
        <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: "100%" }}>
          Supplier saved.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SuppliersPage;
