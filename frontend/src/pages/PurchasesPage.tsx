import { useEffect, useState } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import api from "../lib/api";

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/purchases");
      setPurchases(response.data || []);
    };
    load();
  }, []);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Purchases
      </Typography>
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
    </Box>
  );
};

export default PurchasesPage;
