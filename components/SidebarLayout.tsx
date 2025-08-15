import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ResizeHandle } from './ResizeHandle';
import type { LibraryEntity } from '../types';

const MIN_SIDEBAR_WIDTH = 320; // px
const MAX_SIDEBAR_WIDTH = 800; // px
const COLLAPSED_SIDEBAR_WIDTH = 64; // px

interface SidebarLayoutProps {
  onNewEntity: () => void;
  onEditEntity: (entity: LibraryEntity) => void;
  children: React.ReactNode;
  className?: string;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ onNewEntity, onEditEntity, children, className = '' }) => {
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const savedSidebarWidth = useRef(sidebarWidth);
  const isResizingRef = useRef(false);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const collapsing = !prev;
      setSidebarWidth(collapsing ? COLLAPSED_SIDEBAR_WIDTH : savedSidebarWidth.current);
      return collapsing;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isSidebarCollapsed) return;
    e.preventDefault();
    isResizingRef.current = true;
  }, [isSidebarCollapsed]);

  const handleMouseUp = useCallback(() => { isResizingRef.current = false; }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current || isSidebarCollapsed) return;
    e.preventDefault();
    const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(e.clientX, MAX_SIDEBAR_WIDTH));
    setSidebarWidth(newWidth);
    savedSidebarWidth.current = newWidth;
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => { if (isResizingRef.current) handleMouseMove(e); };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const rootClasses = [
    'flex h-screen font-sans text-slate-800 bg-slate-100 overflow-hidden',
    (isResizingRef.current && !isSidebarCollapsed) ? 'cursor-col-resize select-none' : '',
    className
  ].join(' ');

  return (
    <div className={rootClasses}>
      <Sidebar
        width={sidebarWidth}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        onNewEntity={onNewEntity}
        onEditEntity={onEditEntity}
      />
      {!isSidebarCollapsed && <ResizeHandle onMouseDown={handleMouseDown} />}
      <main className="flex-1 h-full min-w-0 relative">
        {children}
      </main>
    </div>
  );
};
