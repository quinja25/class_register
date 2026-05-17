import { useEffect } from 'react';

const CONFIRM_MESSAGE = '작성 중인 신청서가 있습니다. 페이지를 떠나시겠습니까?';

export function useNavigationGuard(active: boolean) {
  // Block refresh / tab close
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);

  // Block browser back button
  useEffect(() => {
    if (!active) return;

    // Push a duplicate entry so the back button has something to pop
    history.pushState(null, '', location.href);

    const handler = () => {
      // Re-push immediately to stay on page, then ask
      history.pushState(null, '', location.href);
      const confirmed = window.confirm(CONFIRM_MESSAGE);
      if (confirmed) {
        // User wants to leave — pop twice (the two entries we pushed)
        history.go(-2);
      }
    };

    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [active]);
}
