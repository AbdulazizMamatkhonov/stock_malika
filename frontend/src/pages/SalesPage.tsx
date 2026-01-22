import { useEffect, useState } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import api from "../lib/api";

const SalesPage = () => {
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/sales");
      setSales(response.data || []);
    };
    load();
  }, []);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Sales
      </Typography>
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
