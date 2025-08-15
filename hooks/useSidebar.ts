import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../state/appState';

const MIN_SIDEBAR_WIDTH = 320; // px
const MAX_SIDEBAR_WIDTH = 800; // px
const COLLAPSED_SIDEBAR_WIDTH = 64; // px

export function useSidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const savedSidebarWidth = useRef(sidebarWidth);
  const isResizingRef = useRef(false);
  const { state } = useContext(AppContext);

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

  const handleMouseUp = useCallback(() => {
    isResizingRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current || isSidebarCollapsed) return;
    e.preventDefault();
    const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(e.clientX, MAX_SIDEBAR_WIDTH));
    setSidebarWidth(newWidth);
    savedSidebarWidth.current = newWidth;
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isResizingRef.current) handleMouseMove(e);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if ((state.selectedEntityId || state.multiSelectedIds.length > 0) && isSidebarCollapsed) {
      toggleSidebarCollapse();
    }
  }, [state.selectedEntityId, state.multiSelectedIds, isSidebarCollapsed, toggleSidebarCollapse]);

  return {
    sidebarWidth,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    handleMouseDown,
    isResizingRef,
  };
}

export default useSidebar;
