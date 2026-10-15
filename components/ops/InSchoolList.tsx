"use client";

import { useMemo, useState } from "react";
import { Button, DataTable, DataTableScroll, SearchField } from "@/components";
import { Select } from "@/components/ui/Dropdown";
import { accountHasRole } from "@/lib/account";
import { INSCHOOL_LIST_AS_OF, SCHOOL_TYPES, setSchoolType, useInSchoolSchools, type SchoolType } from "@/lib/inschool-schools";

const HEADERS = ["Code", "School", "City", "State", "ZIP", "Branch", "Type", "Address"];

export function InSchoolList() {
  const schools = useInSchoolSchools();
  const canEditType = accountHasRole("Admin");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, SchoolType>>({});
  const needle = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      schools.filter((row) => {
        if (!needle) return true;
        return [row.code, row.name, row.city, row.state, row.zip, row.branch, row.type, row.address]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      }),
    [needle, schools],
  );

  function stageType(code: string, saved: SchoolType, next: SchoolType) {
    setDrafts((current) => {
      if (next === saved) {
        const rest = { ...current };
        delete rest[code];
        return rest;
      }
      return { ...current, [code]: next };
    });
  }

  function cancelType(code: string) {
    setDrafts((current) => {
      const rest = { ...current };
      delete rest[code];
      return rest;
    });
  }

  function saveType(code: string) {
    const next = drafts[code];
    if (!next) return;
    setSchoolType(code, next);
    cancelType(code);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="uw-edmed-header">
        <div className="flex items-center justify-between gap-md">
          <div className="w-[320px]">
            <SearchField
              label="Search schools"
              placeholder="Search the list..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <p className="text-sm text-gray-medium">As of {INSCHOOL_LIST_AS_OF}</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="uw-list-empty">No schools match that search.</p>
      ) : (
        <DataTableScroll className="uw-list-scroll">
          <DataTable density="compact" className="uw-list-table uw-opp-table uw-inschool-list">
            <thead className="sticky top-0 z-10">
              <tr>
                {HEADERS.map((label) => (
                  <th key={label} className="uw-list-th">
                    {label}
                  </th>
                ))}
                <th className="uw-list-th" aria-label="Row actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const draft = drafts[row.code];
                const type = draft ?? row.type;
                return (
                  <tr key={row.code} className={draft ? "uw-row-pending" : undefined}>
                    <td className="uw-list-td">{row.code}</td>
                    <td className="uw-list-td">{row.name}</td>
                    <td className="uw-list-td">{row.city}</td>
                    <td className="uw-list-td">{row.state}</td>
                    <td className="uw-list-td">{row.zip}</td>
                    <td className="uw-list-td">{row.branch ?? "Null"}</td>
                    <td className="uw-list-td">
                      {canEditType ? (
                        <Select
                          variant="box"
                          aria-label={`Certification type for ${row.name}`}
                          value={type}
                          options={SCHOOL_TYPES}
                          triggerClassName="h-[34px] py-0 text-sm"
                          onChange={(value) => stageType(row.code, row.type, value as SchoolType)}
                        />
                      ) : (
                        row.type
                      )}
                    </td>
                    <td className="uw-list-td">{row.address}</td>
                    <td className="uw-list-td">
                      {draft ? (
                        <div className="uw-row-actions">
                          <Button variant="link" size="small" onClick={() => cancelType(row.code)}>
                            Cancel
                          </Button>
                          <Button variant="link" size="small" onClick={() => saveType(row.code)}>
                            Save Changes
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </DataTableScroll>
      )}
    </div>
  );
}
