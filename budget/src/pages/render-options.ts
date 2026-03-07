import type { User } from "firebase/auth";
import type { Group } from "@commons-systems/authutil/groups";

export type RenderPageOptions =
  | { user: null; group: null; groupError: false }
  | { user: User; group: Group; groupError: false }
  | { user: User; group: null; groupError: boolean };
