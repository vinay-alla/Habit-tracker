import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useHabits, useHabitStats } from "@/hooks/useHabits";
import type { Habit } from "@/hooks/useHabits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, LogOut } from "lucide-react";
import { toast } from "sonner";
import HabitTable from "@/components/HabitTable";
import AddHabitDialog from "@/components/AddHabitDialog";
import EditHabitDialog from "@/components/EditHabitDialog";
import ProgressAnalytics from "@/components/ProgressAnalytics";
import ThemeToggle from "@/components/ThemeToggle";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { habits, loading: habitsLoading, addHabit, updateHabit, deleteHabit, toggleStatus } = useHabits(session, selectedDate);
  const stats = useHabitStats(session);

  const handleDelete = async (id: string) => {
    const error = await deleteHabit(id);
    if (error) toast.error("Failed to delete");
    else toast.success("Habit deleted");
  };

  const handleEdit = (habit: Habit) => {
    setEditHabit(habit);
    setEditOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">Habit Tracker</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Signed out");
            }}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Analytics */}
        <section className="animate-fade-in">
          <ProgressAnalytics {...stats} />
        </section>

        {/* Habits Section */}
        <Card className="glass-card p-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Daily Habits</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("gap-2", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <AddHabitDialog onAdd={addHabit} />
          </div>

          <HabitTable
            habits={habits}
            loading={habitsLoading}
            onToggle={toggleStatus}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Card>

        <EditHabitDialog
          habit={editHabit}
          open={editOpen}
          onOpenChange={setEditOpen}
          onUpdate={updateHabit}
        />
      </main>
    </div>
  );
};

export default Index;
