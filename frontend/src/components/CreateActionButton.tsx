import { Button, ButtonProps, Tooltip } from "@mui/material";
import { useSubscriptionContext } from "../lib/subscriptionContext";

type CreateActionButtonProps = ButtonProps & {
  disabledReason?: string;
};

const CreateActionButton = ({ disabledReason, ...props }: CreateActionButtonProps) => {
  const { isReadOnly } = useSubscriptionContext();
  const isDisabled = Boolean(isReadOnly || props.disabled);
  const reason = disabledReason || "Subscription inactive. Renew to create new items.";

  if (!isDisabled) {
    return <Button {...props} />;
  }

  return (
    <Tooltip title={reason} arrow>
      <span>
        <Button {...props} disabled />
      </span>
    </Tooltip>
  );
};

export default CreateActionButton;
