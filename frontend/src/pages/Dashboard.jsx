import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth, usePermissions } from '../contexts/AuthContext';
import { usersAPI, tenantsAPI, notificationsAPI } from '../services/api';
import {
  Users,
  Building2,
  Bell,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();
  
  const [stats, setStats] = useState({
    users: null,
    tenants: null,
    notifications: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const promises = [];

        // Fetch user stats if user has permission
        if (hasPermission('users', 'read')) {
          promises.push(
            usersAPI.getUserStats().then(response => ({
              type: 'users',
              data: response.data,
            }))
          );
        }

        // Fetch tenant stats if super admin
        if (isSuperAdmin && hasPermission('tenants', 'read')) {
          promises.push(
            tenantsAPI.getTenantStats().then(response => ({
              type: 'tenants',
              data: response.data,
            }))
          );
        }

        // Fetch notification stats
        promises.push(
          notificationsAPI.getNotificationStats().then(response => ({
            type: 'notifications',
            data: response.data,
          }))
        );

        const results = await Promise.all(promises);
        const newStats = { users: null, tenants: null, notifications: null };
        
        results.forEach(result => {
          newStats[result.type] = result.data;
        });

        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [hasPermission, isSuperAdmin]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const StatCard = ({ title, value, description, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${
                trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {trend.value}% from last month
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const QuickActions = () => {
    const actions = [];

    if (hasPermission('users', 'create')) {
      actions.push({
        title: 'Add User',
        description: 'Create a new user account',
        href: '/users/new',
        icon: Users,
      });
    }

    if (isSuperAdmin && hasPermission('tenants', 'create')) {
      actions.push({
        title: 'Add Tenant',
        description: 'Create a new organization',
        href: '/tenants/new',
        icon: Building2,
      });
    }

    if (hasPermission('notifications', 'create')) {
      actions.push({
        title: 'Send Notification',
        description: 'Send a message to users',
        href: '/notifications/new',
        icon: Bell,
      });
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you can perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto p-4"
                asChild
              >
                <a href={action.href}>
                  <action.icon className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const RecentActivity = () => {
    const activities = [
      {
        type: 'user_login',
        message: 'John Doe logged in',
        time: '2 minutes ago',
        icon: Users,
      },
      {
        type: 'notification_sent',
        message: 'System maintenance notification sent',
        time: '15 minutes ago',
        icon: Bell,
      },
      {
        type: 'user_created',
        message: 'New user account created',
        time: '1 hour ago',
        icon: Users,
      },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <activity.icon className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Welcome to your {user?.role_name} dashboard. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* User Stats */}
        {stats.users && (
          <>
            <StatCard
              title="Total Users"
              value={stats.users.statusCounts?.reduce((sum, item) => sum + item.count, 0) || 0}
              description="All registered users"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Active Users"
              value={stats.users.statusCounts?.find(item => item.status === 'active')?.count || 0}
              description="Currently active users"
              icon={Activity}
              color="green"
            />
          </>
        )}

        {/* Tenant Stats (Super Admin only) */}
        {stats.tenants && isSuperAdmin && (
          <>
            <StatCard
              title="Total Tenants"
              value={stats.tenants.statusCounts?.reduce((sum, item) => sum + item.count, 0) || 0}
              description="All organizations"
              icon={Building2}
              color="purple"
            />
            <StatCard
              title="Active Tenants"
              value={stats.tenants.statusCounts?.find(item => item.status === 'active')?.count || 0}
              description="Active organizations"
              icon={Building2}
              color="green"
            />
          </>
        )}

        {/* Notification Stats */}
        {stats.notifications && (
          <StatCard
            title="Unread Notifications"
            value={stats.notifications.readCounts?.find(item => !item.is_read)?.count || 0}
            description="Pending notifications"
            icon={Bell}
            color="yellow"
          />
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <RecentActivity />

        {/* Role-specific content */}
        {user?.role_name === 'User' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <Badge variant="secondary">{user.role_name}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Organization</p>
                  <p className="text-sm text-muted-foreground">
                    {user.tenant_name || 'No organization'}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

