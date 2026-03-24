export function SafeRender({ value }: { value: unknown }) {
  if (value === null || value === undefined) return null
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return <>{value}</>
  }
  if (typeof value === "object") {
    return (
      <div className="mt-1 space-y-1 border-l border-border/20 pl-2">
        {Object.entries(value).map(([sk, sv]) => (
          <div key={sk} className="space-y-0.5">
            <p className="text-[10px] font-medium text-muted-foreground/40 capitalize">
              {sk.replace(/_/g, " ")}
            </p>
            <p className="text-xs leading-tight text-foreground/60">
              <SafeRender value={sv} />
            </p>
          </div>
        ))}
      </div>
    )
  }
  return null
}
