import { Badge } from "@/components/ui/Badge";
import { roleLabel } from "@/lib/utils/roles";
import type { RoleType } from "@/types/auth.types";

const variantMap: Record<RoleType, "indigo" | "amber" | "gray"> = {
  ROLE_ADMIN:  "indigo",
  ROLE_VENDOR: "amber",
  ROLE_USER:   "gray",
};

export function RoleBadge({ role }: { role: RoleType }) {
  return (
    <Badge variant={variantMap[role] ?? "gray"}>
      {roleLabel(role)}
    </Badge>
  );
}
