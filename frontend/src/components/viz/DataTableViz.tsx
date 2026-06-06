import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'

interface TablePayload {
  columns: string[]
  rows: string[][]
}

interface DataTableVizProps {
  data: unknown
  compact?: boolean
}

function parseData(data: unknown): TablePayload {
  if (!data || typeof data !== 'object') {
    return { columns: [], rows: [] }
  }

  const record = data as TablePayload
  return {
    columns: record.columns ?? [],
    rows: record.rows ?? [],
  }
}

export default function DataTableViz({ data, compact = false }: DataTableVizProps) {
  const payload = parseData(data)
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo(() => {
    const helper = createColumnHelper<Record<string, string>>()

    return payload.columns.map((column, index) =>
      helper.accessor(String(index), {
        header: column,
        cell: (info) => info.getValue(),
      }),
    )
  }, [payload.columns])

  const tableData = useMemo(
    () =>
      payload.rows.map((row) =>
        Object.fromEntries(row.map((value, index) => [String(index), value])),
      ),
    [payload.rows],
  )

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div
      className={`glass-surface overflow-auto rounded-2xl ${compact ? 'max-h-36' : 'max-h-56'}`}
    >
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-slate-950/60 backdrop-blur">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="cursor-pointer border-b border-white/10 px-2 py-1.5 font-medium text-[#9aa3b2]"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: ' ↑',
                    desc: ' ↓',
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-white/8">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1.5 text-[#d1d5db]">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
