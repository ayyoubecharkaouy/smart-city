"use client";

import { useEffect, useState } from "react";
import { getSocket, getSocketStatus, subscribeSocketStatus } from "@/lib/socket";
import type { SocketStatus } from "@/lib/socket";

export function useSocketStatus(): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>(getSocketStatus());

  useEffect(() => {
    getSocket();
    return subscribeSocketStatus(setStatus);
  }, []);

  return status;
}
