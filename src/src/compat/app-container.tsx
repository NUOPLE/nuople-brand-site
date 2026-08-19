import type { ReactNode } from 'react';

interface AppContainerProps {
  children?: ReactNode;
  defaultTheme?: 'light' | 'dark';
  enableAuth?: boolean;
  disableToaster?: boolean;
}

export function AppContainer({ children }: AppContainerProps) {
  return <>{children}</>;
}

export default AppContainer;
