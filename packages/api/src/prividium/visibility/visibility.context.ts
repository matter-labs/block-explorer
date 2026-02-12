import { UserWithRoles } from "../../api/pipes/addUserRoles.pipe";

export interface VisibilityContext {
  user?: UserWithRoles | null;
}
