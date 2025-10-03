"use client";
import { ICounter } from "@/interfaces/services/counter.interface";
import { IQueue } from "@/interfaces/services/queue.interface";
import React from "react";
import Button from "../atoms/Button";
import toast from "react-hot-toast";
import Card from "../atoms/Card";
import Select from "../atoms/Select";
import CurrentQueueDisplay from "../molecules/CurrentQueueDisplay";
import { env } from "process";

interface CounterOperatorProps {
  className?: string;
}

const base_url = env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

const CounterOperator: React.FC<CounterOperatorProps> = ({ className }) => {
  // State
  const [activeCounters, setActiveCounters] = React.useState<ICounter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = React.useState<string>("");
  const selectedCounter: ICounter | null =
    activeCounters.find((c) => c.id.toString() === selectedCounterId) || null;
  const [currentQueue, setCurrentQueue] = React.useState<IQueue | null>(null);

  // Fungsi untuk fetch current queue dari backend
  const fetchCurrentQueue = async (counterId: string) => {
    if (!counterId) {
      setCurrentQueue(null);
      return;
    }
    try {
      const res = await fetch(`${base_url}/queues/current`, {
        credentials: "include",
      });
      const json = await res.json();
      const found = Array.isArray(json.data)
        ? json.data.find((q: any) => q.id.toString() === counterId)
        : null;
      if (found && found.currentQueue) {
        setCurrentQueue({
          queueNumber: found.currentQueue,
          status: found.status,
          counter: { id: found.id, name: found.name },
          id: found.currentQueue,
          createdAt: "",
          updatedAt: "",
        });
      } else {
        setCurrentQueue(null);
      }
    } catch (e) {
      setCurrentQueue(null);
    }
  };

  // Reset semua antrian
  const handleResetAllQueues = async () => {
    try {
      const res = await fetch(`${base_url}/queues/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.status) {
        toast.success("Semua antrian berhasil direset!");
        fetchCurrentQueue(selectedCounterId);
      } else {
        toast.error(json.message || "Gagal reset antrian");
      }
    } catch (e) {
      toast.error("Gagal reset antrian");
    }
  };

  // Auto-refresh currentQueue setiap 10 detik
  React.useEffect(() => {
    if (!selectedCounterId) return;
    const interval = setInterval(() => {
      fetchCurrentQueue(selectedCounterId);
    }, 10000); // 10 detik
    return () => clearInterval(interval);
  }, [selectedCounterId]);

  // Fetch current queue saat counter dipilih
  React.useEffect(() => {
    fetchCurrentQueue(selectedCounterId);
  }, [selectedCounterId]);

  React.useEffect(() => {
    const fetchCounters = async () => {
      try {
        const res = await fetch(`${base_url}/counters`);
        const json = await res.json();
        // Asumsi response: { status: true, data: [ ... ] }
        setActiveCounters(json.data || []);
      } catch (e) {
        // Optional: handle error
      }
    };
    fetchCounters();
  }, []);

  const handleCounterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCounterId(e.target.value);
  };

  const handleNextQueue = async () => {
    if (!selectedCounter) return;
    try {
      const res = await fetch(`${base_url}/queues/next`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ counter_id: selectedCounter.id }),
      });
      const json = await res.json();
      if (res.status === 404 || json?.message?.includes("No claimed queues")) {
        toast("Antrian sudah habis untuk counter ini.", { icon: "ℹ️" });
      }
      // Setelah panggil, fetch ulang currentQueue dari backend
      fetchCurrentQueue(selectedCounterId);
    } catch (e) {
      console.error("Error next queue:", e);
    }
  };

  const handleSkipQueue = async () => {
    if (!selectedCounter) return;
    try {
      const res = await fetch(`${base_url}/queues/skip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ counter_id: selectedCounter.id }),
      });
      const json = await res.json();
      if (res.status === 404 || json?.message?.includes("No claimed queues")) {
        toast("Antrian sudah habis untuk counter ini.", { icon: "ℹ️" });
      }
      // Setelah skip, fetch ulang currentQueue dari backend
      fetchCurrentQueue(selectedCounterId);
    } catch (e) {
      console.error("Error skip queue:", e);
    }
  };

  return (
    <div className={className}>
      <Card className="mb-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          OPERATOR COUNTER
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Panel untuk operator counter melayani antrian pengunjung
        </p>
      </Card>

      <div className="space-y-6">
        <div>
          <label className="block mb-2 font-semibold">Pilih Counter:</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedCounterId}
            onChange={handleCounterChange}
          >
            <option value="">-- Pilih Counter --</option>
            {activeCounters.map((counter) => (
              <option key={counter.id} value={counter.id}>
                {counter.name}
              </option>
            ))}
          </select>
        </div>

        <CurrentQueueDisplay
          counterName={currentQueue?.counter?.name ?? "Current Queue"}
          queueNumber={currentQueue?.queueNumber ?? null}
          status={currentQueue?.status ?? "CLAIMED"}
        />

        <div className="flex gap-4">
          <Button
            fullWidth
            leftIcon={
              <span className="material-symbols-outlined">arrow_forward</span>
            }
            onClick={handleNextQueue}
            isLoading={false}
            disabled={!selectedCounterId}
          >
            Panggil Antrian Berikutnya
          </Button>

          {currentQueue && (
            <Button
              fullWidth
              variant="danger"
              leftIcon={
                <span className="material-symbols-outlined">skip_next</span>
              }
              onClick={handleSkipQueue}
              isLoading={false}
              disabled={!selectedCounterId}
            >
              Lewati Antrian
            </Button>
          )}
        </div>
        <div className="flex gap-4 mt-4">
          <Button
            fullWidth
            variant="danger"
            leftIcon={
              <span className="material-symbols-outlined">restart_alt</span>
            }
            onClick={handleResetAllQueues}
          >
            Reset Semua Antrian
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CounterOperator;
