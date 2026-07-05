export const preventNavigation = (e: BeforeUnloadEvent) => {
  e.preventDefault();
  e.returnValue = '';
};

export const preventBack = () => {
  window.history.pushState(null, '', window.location.pathname);
};

export const enableRazorpayProtections = () => {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeunload', preventNavigation);
  window.history.pushState(null, '', window.location.pathname);
  window.addEventListener('popstate', preventBack);
};

export const disableRazorpayProtections = () => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('beforeunload', preventNavigation);
  window.removeEventListener('popstate', preventBack);
};
