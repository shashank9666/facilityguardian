import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { timeAgo, daysUntil, cn } from "@/lib/utils";
import { AlertTriangle, Clock, Package, CheckCircle2, Info, ChevronRight, XCircle } from "lucide-react";

export function Notifications() {
  const { state, fetchNotifications, markNotificationRead, markAllNotificationsRead, toast } = useApp();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const alerts = state.notifications;

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      toast("All alerts marked as read", "success");
    } catch (err) {
      toast("Failed to mark all as read", "error");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch (err) {
      toast("Failed to update notification", "error");
    }
  };

  const TYPE_STYLE: Record<string, { color: string, icon: React.ReactNode }> = {
    info:    { color: "bg-blue-50 text-blue-600",    icon: <Info size={16}/> },
    warning: { color: "bg-amber-50 text-amber-600", icon: <AlertTriangle size={16}/> },
    error:   { color: "bg-red-50 text-red-600",     icon: <XCircle size={16}/> },
    success: { color: "bg-green-50 text-green-600", icon: <CheckCircle2 size={16}/> },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Alert Center</h2>
          <p className="text-sm text-slate-500">View and manage all system notifications and facility alerts</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>Mark all as read</Button>
           <Button variant="ghost" size="sm">Archive old</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts.length === 0 ? (
          <Card>
            <CardBody className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">You're all caught up!</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-1">There are no new notifications or alerts requiring your attention right now.</p>
            </CardBody>
          </Card>
        ) : (
          alerts.map((n) => {
            const style = TYPE_STYLE[n.type] || TYPE_STYLE.info;
            return (
              <div key={n.id} 
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={cn(
                  "group transition-all cursor-pointer relative overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm",
                  !n.isRead ? "border-blue-200 bg-blue-50/10" : "opacity-70 grayscale-[0.5]"
                )}>
                {!n.isRead && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"/>}
                <div className="flex items-center p-4 gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", style.color)}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{n.type}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-medium text-slate-400">{timeAgo(n.createdAt)}</span>
                      {!n.isRead && <Badge className="bg-blue-600 text-[9px] px-1 py-0 h-4 min-w-0">New</Badge>}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 truncate">{n.title}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
