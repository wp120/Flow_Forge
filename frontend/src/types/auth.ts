export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  companyId: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
};

export type AuthResponse = {
  user: CurrentUser;
  message?: string;
};
