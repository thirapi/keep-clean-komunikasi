"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/components/breadcrumb/breadcrumb-context";

export function BreadcrumbRenderer() {
    const { breadcrumbs } = useBreadcrumbs();

    if (breadcrumbs.length === 0) {
        return null;
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                    <BreadcrumbItem key={index}>
                        <BreadcrumbLink href={crumb.href}>
                            {crumb.label}
                        </BreadcrumbLink>
                        {index < breadcrumbs.length - 1 && (
                            <BreadcrumbSeparator />
                        )}
                    </BreadcrumbItem>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}