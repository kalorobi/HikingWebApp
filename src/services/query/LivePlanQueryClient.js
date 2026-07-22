import { QueryClient } from '@tanstack/react-query';

export const livePlanQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});