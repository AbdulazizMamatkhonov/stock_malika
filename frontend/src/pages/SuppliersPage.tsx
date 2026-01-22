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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/suppliers");
      setSuppliers(response.data || []);
    };
    load();
  }, []);

  const handleCreate = async () => {
    if (!activeStoreId) {
      return;
    }
    setSaving(true);
    try {
      const response = await api.post("/suppliers", {
        storeId: activeStoreId,
        name,
        phone: phone || undefined,
        email: email || undefined
      });
      setSuppliers((prev) => [response.data, ...prev]);
      setName("");
      setPhone("");
      setEmail("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Suppliers
        </Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disabled={!activeStoreId}>
          Add supplier
        </Button>
      </Box>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
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
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New supplier</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <TextField label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !name}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuppliersPage;
