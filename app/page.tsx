import { getDashboardStats, getRecentQuestions, getDetailedStats } from "@/app/actions";
import Link from "next/link";
import { FileText, Scale, Zap, Plus, ArrowRight } from "lucide-react";
import DashboardAnalytics from "./components/DashboardAnalytics";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recentQuestions = await getRecentQuestions(5);
  const detailedStats = await getDetailedStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/questions/new" className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          New Question
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Questions"
          value={stats.total}
          icon={FileText}
          color="text-gray-600"
          trend={`+${stats.newThisWeek} this week`}
        />
        <StatCard
          title="Balance Game"
          value={stats.balance}
          icon={Scale}
          color="text-blue-600"
        />
        <StatCard
          title="Truth Game"
          value={stats.truth}
          icon={Zap}
          color="text-green-600"
        />
        <StatCard
          title="Mini Games"
          value={stats.miniGame}
          icon={Zap}
          color="text-purple-600"
        />
      </div>

      {/* Analytics & Activity Section */}
      <DashboardAnalytics initialStats={detailedStats}>
        {/* Recent Activity */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link href="/questions" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentQuestions.map((q) => (
                <div key={q.q_id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full 
                                          ${q.type === 'T' ? 'bg-green-100 text-green-700' :
                        q.type === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      <span className="font-bold text-sm">{q.type}</span>
                    </div>
                    <div>
                      <p className="font-medium">{q.content.substring(0, 50)}{q.content.length > 50 && "..."}</p>
                      <p className="text-sm text-gray-500">ID: {q.q_id} • {(q as any).code_names?.length || 0} Targets</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 hidden sm:block">
                      {new Date(q.created_at || new Date()).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/questions/${q.q_id}`}
                      className="rounded-md border px-3 py-1 text-sm font-medium hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardAnalytics>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold">{value}</div>
        {trend && <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</div>}
      </div>
    </div>
  );
}
