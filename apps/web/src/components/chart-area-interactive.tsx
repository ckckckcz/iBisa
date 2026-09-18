"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const ALL_MONTHS = "__all"

const chartConfig = {
  submissions: {
    label: "Pengerjaan Kuis",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function monthLabel(month: string): string {
  const d = new Date(`${month}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return month
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
}

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function ChartAreaInteractive({ data, loading }: { data: { date: string; submissions: number }[]; loading?: boolean }) {
  const months = React.useMemo(() => {
    const set = new Set<string>()
    for (const item of data) {
      const m = item.date ? item.date.slice(0, 7) : ""
      if (m) set.add(m)
    }
    return [...set].sort().reverse()
  }, [data])

  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null)
  const nowMonth = currentMonthKey()
  const activeMonth =
    selectedMonth ?? (months.includes(nowMonth) ? nowMonth : (months[0] ?? nowMonth))

  const filteredData =
    activeMonth === ALL_MONTHS
      ? data
      : data.filter((item) => Boolean(item.date) && item.date.startsWith(activeMonth))

  const description =
    activeMonth === ALL_MONTHS
      ? "Pengerjaan kuis — Semua bulan"
      : `Pengerjaan kuis — ${monthLabel(activeMonth)}`

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64" />
          <CardAction>
            <Skeleton className="h-8 w-44" />
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="aspect-auto h-62.5 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Aktivitas Pembelajaran</CardTitle>
        <CardDescription className="truncate">{description}</CardDescription>
        <CardAction>
          {loading ? (
            <Skeleton className="h-8 w-44" />
          ) : (
            <Select
              value={activeMonth}
              onValueChange={(value) => setSelectedMonth(value || ALL_MONTHS)}
            >
              <SelectTrigger
                className="flex w-44 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
                size="sm"
                aria-label="Pilih bulan"
              >
                <SelectValue placeholder={monthLabel(activeMonth)} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value={ALL_MONTHS} className="rounded-lg">
                  Semua bulan
                </SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m} className="rounded-lg">
                    {monthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="aspect-auto h-62.5 w-full" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-62.5 w-full"
          >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSubmissions" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-submissions)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-submissions)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="submissions"
              type="natural"
              fill="url(#fillSubmissions)"
              stroke="var(--color-submissions)"
              stackId="a"
            />
          </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}