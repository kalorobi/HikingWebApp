import { QueryClientProvider } from '@tanstack/react-query';
import { liveQueryClient } from './LiveQueryClient';

export default function LiveQueryProvider({ children }) {
  return (
    <QueryClientProvider client={liveQueryClient}>
      {children}
    </QueryClientProvider>
  );
}