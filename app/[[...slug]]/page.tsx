"use client";

import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/components/App'), {
  ssr: false,
});

// Optional catch-all so every section path (/dashboard, /research, /campaign/social, ...)
// serves the same client-side App. useAppEngine reads the pathname to restore state on refresh.
export default function Home() {
  return <App />;
}
