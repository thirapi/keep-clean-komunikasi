import {
    UserCheck,
    UserX,
    UserCog,
    User,
  } from "lucide-react"

export const statuses = [
    {
      value: "ACTIVE",
      label: "Active",
      icon: UserCheck,
    },
    {
      value: "INACTIVE",
      label: "Inactive",
      icon: UserX,
    },
  ]
  
  export const roles = [
    {
      value: "ADMIN",
      label: "Admin",
      icon: UserCog,
    },
    {
      value: "STAFF",
      label: "Staff",
      icon: User,
    },
  ]