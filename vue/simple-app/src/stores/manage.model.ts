export interface User {
  id: number;
  name: string;
  email: string;
  createTime: string;
  lastLoginTime: string;
  enable: boolean;
  roles: string[];
  primaryOrganizationId: string;
  primaryOrganizationName: string;
  creatorId: string;
  orgnizations: string[];
}
