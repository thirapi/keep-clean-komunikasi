export interface RoleRecord {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
}

export interface RoleFullRecord {
    id: string;
    name: string;
    permissions: {
        id: string;
        name: string;
    }[];
    description?: string;
    createdAt: Date;
}