import { QueryClientProvider } from '@tanstack/react-query';
import { livePlanQueryClient } from './LivePlanQueryClient';

export default function LivePlanQueryProvider({ children }) {
  return (
    <QueryClientProvider client={livePlanQueryClient}>
      {children}
    </QueryClientProvider>
  );
}