export default function Home() {
  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Welcome to your ERP Mobile Progressive Web App
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Sales Overview</h3>
          <p className="text-3xl font-bold tracking-tight">$45,231</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            +20.1% from last month
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Orders</h3>
          <p className="text-3xl font-bold tracking-tight">124</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
            +12 new today
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Inventory Items</h3>
          <p className="text-3xl font-bold tracking-tight">2,847</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
            23 low stock
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4 group">
            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none mb-1">New order received</p>
              <p className="text-xs text-muted-foreground">Order #1234 - 2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start gap-4 group">
            <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none mb-1">Inventory updated</p>
              <p className="text-xs text-muted-foreground">Product SKU-789 - 15 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start gap-4 group">
            <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none mb-1">Customer added</p>
              <p className="text-xs text-muted-foreground">John Doe - 1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
