"use client";

import { useState, useEffect } from "react";

export function useToast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const show = (msg: string) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 2500);
  };

  return { message, visible, show };
}

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
      {message}
    </div>
  );
}
