export default function Loading() {
  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 flex-1">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-7 w-14 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex-1 border rounded-lg bg-muted/30 animate-pulse" />
    </div>
  );
}
