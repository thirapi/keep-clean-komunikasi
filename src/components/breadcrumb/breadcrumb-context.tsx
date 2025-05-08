"use client";

import { createContext, useContext, useState } from "react";

type Crumb = { label: string; href?: string };

const BreadcrumbContext = createContext<{
    breadcrumbs: Crumb[];
    setBreadcrumbs: (crumbs: Crumb[]) => void;
}>({
    breadcrumbs: [],
    setBreadcrumbs: () => {},
});

export const BreadcrumbProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

    return (
        <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};
export const useBreadcrumbs = () => useContext(BreadcrumbContext);