import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { getNavigationGroups } from '../utils/navigation';
import { Brain, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();

  const navigationGroups = getNavigationGroups(user);

  const SidebarItem = ({ item, isCollapsed }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const content = (
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start h-12',
          isCollapsed ? 'px-2' : 'px-4',
          isActive && 'bg-secondary text-secondary-foreground'
        )}
        asChild
      >
        <Link to={item.href}>
          <Icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
          {!isCollapsed && (
            <span className="truncate">{item.title}</span>
          )}
        </Link>
      </Button>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-4">
              <span>{item.title}</span>
              {item.description && (
                <span className="text-muted-foreground text-sm">
                  {item.description}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        isMobile && isCollapsed && '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link 
          to="/dashboard" 
          className="flex items-center gap-3 font-semibold text-sidebar-foreground"
        >
          <div className="p-1.5 bg-primary rounded-lg">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-lg">8Solve AI</span>
          )}
        </Link>
        
        {/* Toggle Button */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              'ml-auto h-8 w-8 p-0',
              isCollapsed && 'ml-0'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.title}>
              {!isCollapsed && (
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
              )}
              
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
              
              {groupIndex < navigationGroups.length - 1 && !isCollapsed && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {user.role_name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

