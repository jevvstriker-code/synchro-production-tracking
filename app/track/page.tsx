'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function TrackQueryRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jc = searchParams.get('jc');

  React.useEffect(() => {
    if (jc) {
      router.replace(`/track/${encodeURIComponent(jc)}`);
    } else {
      router.replace('/');
    }
  }, [jc, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <TrackQueryRedirect />
    </Suspense>
  );
}
