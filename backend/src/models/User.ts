import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["MASTER", "OWNER", "MANAGER", "CASHIER", "VIEWER"],
      required: true
    },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" }
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
