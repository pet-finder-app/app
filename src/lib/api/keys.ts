/** Keys follow resources in the Go API, with prefixes for related invalidation. */
export const queryKeys = {
  session: ["session"],
  profile: ["profile"],
  organizations: ["organizations"],
  organizationSelection: ["organizations", "selection"],
  myOrganizations: ["organizations", "memberships"],
  organization: (id: string) => ["organizations", id] as const,
  members: (id: string) => ["organizations", id, "members"] as const,
  animals: ["animals"],
  animal: (id: string) => ["animals", "detail", id] as const,
  inventory: (organizationId?: string, status?: string) =>
    ["animals", "inventory", organizationId ?? "me", status ?? "all"] as const,
  feed: (mode: string, location: string) =>
    ["animals", "feed", mode, location] as const,
  preferences: ["preferences"],
  preference: (value: string, page: number) =>
    ["preferences", value, page] as const,
  applications: ["applications"],
  application: (id: string) => ["applications", "detail", id] as const,
  applicationList: (organizationId?: string) =>
    ["applications", "list", organizationId ?? "me"] as const,
  conversations: ["conversations"],
  conversationList: (organizationId?: string) =>
    ["conversations", "list", organizationId ?? "me"] as const,
  messages: (id: string) => ["conversations", id, "messages"] as const,
  appointments: ["appointments"],
  applicationAppointments: (id: string) =>
    ["appointments", "application", id] as const,
  appointment: (id: string) => ["appointments", "detail", id] as const,
  reports: ["reports"],
  location: ["location"],
} as const;
export const mutationKeys = {
  auth: (action: string) => ["auth", action] as const,
  profile: ["profile", "update"],
  organization: (action: string) => ["organizations", action] as const,
  animal: (action: string) => ["animals", action] as const,
  preference: ["preferences", "set"],
  application: (action: string) => ["applications", action] as const,
  message: ["conversations", "send"],
  appointment: (action: string) => ["appointments", action] as const,
  report: (action: string) => ["reports", action] as const,
  location: ["location", "save"],
} as const;
