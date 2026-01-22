import { useEffect, useMemo, useState } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import api from "../lib/api";
import { useStoreContext } from "../lib/storeContext";

type SalesRow = { day: string; revenue: number; cogs: number; salesCount: number };

type ExpenseRow = { day: string; expenses: number };

const ReportsPage = () => {
  const { activeStoreId } = useStoreContext();
  const [salesRows, setSalesRows] = useState<SalesRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!activeStoreId) {
        return;
      }
      const response = await api.get("/reports/sales", {
        params: { storeId: activeStoreId }
      });
      setSalesRows(response.data.revenueRows || []);
      setExpenseRows(response.data.expenseRows || []);
    };
    load();
  }, [activeStoreId]);

  const combined = useMemo(() => {
    const expenseMap = new Map(expenseRows.map((row) => [row.day, row.expenses]));
    return salesRows.map((row) => ({
      ...row,
      expenses: expenseMap.get(row.day) || 0,
      netProfit: row.revenue - row.cogs - (expenseMap.get(row.day) || 0)
    }));
  }, [salesRows, expenseRows]);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Reports
      </Typography>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Revenue</TableCell>
              <TableCell align="right">COGS</TableCell>
              <TableCell align="right">Expenses</TableCell>
              <TableCell align="right">Net Profit</TableCell>
              <TableCell align="right">Sales Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {combined.map((row) => (
              <TableRow key={row.day}>
                <TableCell>{new Date(row.day).toLocaleDateString()}</TableCell>
                <TableCell align="right">${row.revenue.toFixed(2)}</TableCell>
                <TableCell align="right">${row.cogs.toFixed(2)}</TableCell>
                <TableCell align="right">${row.expenses.toFixed(2)}</TableCell>
                <TableCell align="right">${row.netProfit.toFixed(2)}</TableCell>
                <TableCell align="right">{row.salesCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default ReportsPage;
