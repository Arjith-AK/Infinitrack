import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { router } from './router';
import { robotWebSocket } from '@/services/websocket/robotWebSocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
    },
  },
});

function RobotConnectionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    robotWebSocket.connect();

    // NOTE: this used to fabricate random telemetry (fake battery/GPS/speed
    // drift) whenever the WebSocket wasn't connected, which made the UI look
    // "alive" even with no robot reachable at all. Removed -- when
    // disconnected, the UI should show disconnected (telemetry.connected
    // stays false / stale), not invented numbers.

    return () => {
      robotWebSocket.disconnect();
    };
  }, []);

  return <>{children}</>;
}

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RobotConnectionProvider>
        <RouterProvider router={router} />
      </RobotConnectionProvider>
    </QueryClientProvider>
  );
}
