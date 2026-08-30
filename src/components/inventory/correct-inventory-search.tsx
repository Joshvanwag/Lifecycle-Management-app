"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Asset, Space } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CorrectInventorySearchProps {
  spaces: Space[];
  assets: Asset[];
}

export function CorrectInventorySearch({ spaces, assets }: CorrectInventorySearchProps) {
  const [search, setSearch] = useState("");

  const spaceById = useMemo(
    () => new Map(spaces.map((space) => [space.id, space])),
    [spaces],
  );

  const query = search.trim().toLowerCase();

  const matchedSpaces = useMemo(() => {
    if (!query) return spaces.slice(0, 40);
    return spaces
      .filter((space) => {
        const haystack = [
          space.name,
          space.spaceType,
          space.locationLabel,
          space.organizationName,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 40);
  }, [spaces, query]);

  const matchedAssets = useMemo(() => {
    if (!query) return [];
    return assets
      .filter((asset) => {
        const haystack = [
          asset.manufacturer,
          asset.modelNumber,
          asset.category,
          asset.serialNumber,
          asset.ipAddress,
          asset.macAddress,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 40);
  }, [assets, query]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search Spaces, rooms, manufacturers, models, or serials..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Spaces</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Space</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Assets</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {matchedSpaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  No Spaces match that search.
                </TableCell>
              </TableRow>
            ) : (
              matchedSpaces.map((space) => (
                <TableRow key={space.id}>
                  <TableCell>
                    <p className="font-medium">{space.name}</p>
                    <p className="text-xs text-muted-foreground">{space.spaceType}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {space.locationLabel}
                  </TableCell>
                  <TableCell className="text-right">{space.assetCount}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/spaces/${space.id}/correct`} className="text-sm font-medium text-primary">
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {query && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Matching assets</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    No assets match that search.
                  </TableCell>
                </TableRow>
              ) : (
                matchedAssets.map((asset) => {
                  const space = spaceById.get(asset.spaceId);
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <p className="font-medium">
                          {asset.manufacturer} {asset.modelNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">{asset.category}</p>
                      </TableCell>
                      <TableCell className="text-sm">{space?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {asset.serialNumber ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/spaces/${asset.spaceId}/correct`}
                          className="text-sm font-medium text-primary"
                        >
                          Edit Space
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
