import PageHeader from '@/components/layout/PageHeader';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import {
  LayoutDashboard,
  CheckCircle2,
  Flame,
  Sun,
  Target,
} from 'lucide-react';
import TodaysTasks from '@/components/dashboard/TodaysTasks';
import TopPriorities from '@/components/dashboard/TopPriorities';
import HabitSnapshot from '@/components/dashboard/HabitSnapshot';
import DailyAffirmation from '@/components/dashboard/DailyAffirmation';
import GratitudePrompt from '@/components/dashboard/GratitudePrompt';
import DashboardStats from '@/components/dashboard/DashboardStats';
import CalendarWidget from '@/components/dashboard/CalendarWidget';

export default function Dashboard() {
  return (
    <>
      <PageHeader
        title="Good Morning"
        description="Your daily execution dashboard"
        icon={LayoutDashboard}
      />

      {/* Stats Overview */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <TopPriorities />
          <TodaysTasks />
        </div>

        {/* Right Column - Habits, Affirmations */}
        <div className="space-y-6">
          <CalendarWidget />
          <DailyAffirmation />
          <HabitSnapshot />
          <GratitudePrompt />
        </div>
      </div>
    </>
  );
}

