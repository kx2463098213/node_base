export enum EMP_TYPE {
  BOSS = 1,
  NORMAL = 2,
  VISITOR =3
}

export enum UcPlatform {
  SocialFlow = 2002,
}

export interface UserDataDto {
  userId: number
  name: string
  avatar: string
  email: string
  phone: string
  remark: string | null
  sysRoleId: number
  companyId: number
  employeeId: number
  employeeType: EMP_TYPE
  language: string
  timeZone: string
}

export interface UserInfoDto {
  _id: number
  name: string
  avatar: string
  email: string
  type: number
  userId: number
}

export interface UserAdminApiResDto {
  items: UserInfoDto[],
  total: number,
}

export interface EmployeesInfoDto {
  _id?: number,
  employeeId?: number,
  companyId: number,
  userId: number,
  departmentId?: number,
  name: string,
  email?: string,
  language?: string,
  timeZone?: string,
  avatar?: string,
}

export interface EmployeesByAdminApiResDto {
  items: EmployeesInfoDto[],
  total: number,
}