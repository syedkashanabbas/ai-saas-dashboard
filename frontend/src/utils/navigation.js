import {
  LayoutDashboard,
  Users,
  Building2,
  Bell,
  Settings,
  BarChart3,
  Shield,
  UserCog,
  Database,
  Activity,
} from 'lucide-react';

// Define navigation items based on roles
export const getNavigationItems = (user) => {
  if (!user) return [];

  const baseItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics',
    },
  ];

  const roleBasedItems = {
    'Super Admin': [
      ...baseItems,
      {
        title: 'Tenants',
        href: '/tenants',
        icon: Building2,
        description: 'Manage organizations',
      },
      {
        title: 'Users',
        href: '/users',
        icon: Users,
        description: 'Manage all users',
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        description: 'System analytics',
      },
      {
        title: 'System Settings',
        href: '/settings',
        icon: Settings,
        description: 'System configuration',
      },
    ],
    'Admin': [
      ...baseItems,
      {
        title: 'Users',
        href: '/users',
        icon: Users,
        description: 'Manage tenant users',
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        description: 'Tenant analytics',
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Tenant settings',
      },
    ],
    'Manager': [
      ...baseItems,
      {
        title: 'Team',
        href: '/team',
        icon: Users,
        description: 'View team data',
      },
      {
        title: 'Reports',
        href: '/reports',
        icon: BarChart3,
        description: 'Team reports',
      },
    ],
    'User': [
      ...baseItems,
      {
        title: 'Profile',
        href: '/profile',
        icon: UserCog,
        description: 'Manage your profile',
      },
    ],
  };

  // Add notifications for all roles
  const items = roleBasedItems[user.role_name] || baseItems;
  items.push({
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    description: 'View notifications',
  });

  return items;
};

// Check if user has access to a specific route
export const hasRouteAccess = (user, route) => {
  if (!user) return false;

  const navigationItems = getNavigationItems(user);
  return navigationItems.some(item => item.href === route);
};

// Get breadcrumb items for current route
export const getBreadcrumbs = (pathname, user) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { title: 'Home', href: '/dashboard' }
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Capitalize and format segment
    const title = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbs.push({
      title,
      href: currentPath,
      isLast: index === segments.length - 1
    });
  });

  return breadcrumbs;
};

// Navigation groups for better organization
export const getNavigationGroups = (user) => {
  if (!user) return [];

  const items = getNavigationItems(user);
  
  const groups = [
    {
      title: 'Main',
      items: items.filter(item => 
        ['Dashboard', 'Profile'].includes(item.title)
      ),
    },
  ];

  if (user.role_name === 'Super Admin') {
    groups.push(
      {
        title: 'Administration',
        items: items.filter(item => 
          ['Tenants', 'Users', 'System Settings'].includes(item.title)
        ),
      },
      {
        title: 'Analytics',
        items: items.filter(item => 
          ['Analytics'].includes(item.title)
        ),
      }
    );
  } else if (user.role_name === 'Admin') {
    groups.push(
      {
        title: 'Management',
        items: items.filter(item => 
          ['Users', 'Settings'].includes(item.title)
        ),
      },
      {
        title: 'Analytics',
        items: items.filter(item => 
          ['Analytics'].includes(item.title)
        ),
      }
    );
  } else if (user.role_name === 'Manager') {
    groups.push(
      {
        title: 'Team',
        items: items.filter(item => 
          ['Team', 'Reports'].includes(item.title)
        ),
      }
    );
  }

  // Add notifications to all groups
  groups.push({
    title: 'Communication',
    items: items.filter(item => 
      ['Notifications'].includes(item.title)
    ),
  });

  return groups.filter(group => group.items.length > 0);
};

