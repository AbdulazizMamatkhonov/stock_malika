import { Card, CardContent, Typography } from "@mui/material";

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
}

const StatCard = ({ label, value, helper }: StatCardProps) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
        {value}
      </Typography>
      {helper ? (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
);

export default StatCard;
