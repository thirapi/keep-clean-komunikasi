"use client";

import { Table } from "@tanstack/react-table";
import { UserPlus } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";

// import { roles, statuses } from "../data/data";
import { DataTableViewOptions } from "./data-table-view-options";
import Link from "next/link";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        <Input
          placeholder="Find roles name..."
          value={
            (table.getColumn("roles")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("roles")?.setFilterValue(event.target.value)
          }
          className=" w-full lg:w-[250px]"
        />
        {/* <div className="space-x-2">
          {table.getColumn("roles") && (
            <DataTableFacetedFilter
              column={table.getColumn("roles")}
              title="Role"
              options={roles}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X weight="duotone" />
            </Button>
          )}
        </div> */}
      </div>
      <DataTableViewOptions table={table} />
      <Link href="./roles/create" passHref>
        <Button variant="outline" size="sm" className="ml-2 hidden h-8 lg:flex">
          <UserPlus weight="duotone" />
          Create
        </Button>
      </Link>
    </div>
  );
}
