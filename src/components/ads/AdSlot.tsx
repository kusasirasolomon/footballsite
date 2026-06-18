import React from 'react';

export default function AdSlot({ slotId }: { slotId: string }) {
  return (
    <div className="my-4 bg-slate-100 p-6 text-center text-sm text-slate-600 rounded">Ad placeholder: {slotId}</div>
  );
}
