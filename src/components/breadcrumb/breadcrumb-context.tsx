"use client";

import { createContext, useContext, useMemo, useState } from "react";

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

    const value = useMemo(
        () => ({ breadcrumbs, setBreadcrumbs }),
        [breadcrumbs],
    );

    return (
        <BreadcrumbContext.Provider value={value}>
            {children}
        </BreadcrumbContext.Provider>
    );
};
export const useBreadcrumbs = () => useContext(BreadcrumbContext);