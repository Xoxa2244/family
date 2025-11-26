'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/stateContext';

export default function Home() {
  const router = useRouter();
  const { state } = useAppState();

  useEffect(() => {
    if (state.currentUserId) {
      router.push('/today');
    } else {
      router.push('/login');
    }
  }, [state.currentUserId, router]);

  return <div>Загрузка...</div>;
}

