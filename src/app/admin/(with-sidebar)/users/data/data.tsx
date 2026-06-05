import { UserCheck, UserMinus, UserCircleGear, User } from "@phosphor-icons/react/dist/ssr"

export const statuses = [
    {
      value: "ACTIVE",
      label: "Active",
      icon: UserCheck,
    },
    {
      value: "INACTIVE",
      label: "Inactive",
      icon: UserMinus,
    },
  ]
  
  export const roles = [
    {
      value: "ADMIN",
      label: "Admin",
      icon: UserCircleGear,
    },
    {
      value: "STAFF",
      label: "Staff",
      icon: User,
    },
  ]