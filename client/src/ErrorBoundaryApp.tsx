import { ErrorBoundary } from './components/ErrorBoundary';
import RoutesComponent from './app.tsx';

const AppWithErrorBoundary = () => {
  return (
    <ErrorBoundary>
      <RoutesComponent />
    </ErrorBoundary>
  );
};

export default AppWithErrorBoundary;
