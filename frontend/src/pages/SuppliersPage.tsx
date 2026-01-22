import { useEffect, useState } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import api from "../lib/api";

type Supplier = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  balance?: number;
};

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/suppliers");
      setSuppliers(response.data || []);
    };
    load();
  }, []);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Suppliers
      </Typography>
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
    </Box>
  );
};

export default SuppliersPage;
