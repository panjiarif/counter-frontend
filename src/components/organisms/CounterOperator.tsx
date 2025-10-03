"use client";
import { ICounter } from "@/interfaces/services/counter.interface";
import { IQueue } from "@/interfaces/services/queue.interface";
import React from "react";
import Button from "../atoms/Button";
import Card from "../atoms/Card";
import Select from "../atoms/Select";
import CurrentQueueDisplay from "../molecules/CurrentQueueDisplay";
import { env } from "process";

interface CounterOperatorProps {
  className?: string;
}

const base_url = env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

const CounterOperator: React.FC<CounterOperatorProps> = ({ className }) => {
  const [activeCounters, setActiveCounters] = React.useState<ICounter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = React.useState<string>("");
  const selectedCounter: ICounter | null =
    activeCounters.find((c) => c.id.toString() === selectedCounterId) || null;
  const [currentQueue, setCurrentQueue] = React.useState<IQueue | null>(null);

  // Fetch current queue saat counter dipilih
  React.useEffect(() => {
    if (!selectedCounterId) {
      setCurrentQueue(null);
      return;
    }
    const fetchCurrentQueue = async () => {
      try {
        const res = await fetch(`${base_url}/queues/current`, {
          credentials: "include",
        });
        const json = await res.json();
        // Asumsi response: { status: true, data: [ ... ] }
        const found = Array.isArray(json.data)
          ? json.data.find((q: any) => q.id.toString() === selectedCounterId)
          : null;
        if (found && found.currentQueue) {
          setCurrentQueue({
            queueNumber: found.currentQueue,
            status: found.status,
            counter: { id: found.id, name: found.name },
            id: found.currentQueue, // id queue sama dengan nomor antrian
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
    fetchCurrentQueue();
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
      console.log("Response next queue:", json);
      setCurrentQueue(json.queue || null);
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
      console.log("Response skip queue:", json);
      // Update currentQueue ke antrian berikutnya jika ada
      setCurrentQueue(json.nextQueue || null);
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

        <Select
          label="Pilih Counter"
          fullWidth
          options={[
            { value: "", label: "Pilih Counter", disabled: true },
            ...activeCounters.map((counter) => ({
              value: counter.id.toString(),
              label: counter.name,
              disabled: false,
            })),
          ]}
          value={selectedCounterId}
          onChange={handleCounterChange}
        />
      </Card>

      {selectedCounter ? (
        <div className="space-y-6">
          <CurrentQueueDisplay
            counterName={selectedCounter.name}
            queueNumber={currentQueue?.queueNumber ?? 0}
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
              disabled={false}
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
                disabled={false}
              >
                Lewati Antrian
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Card variant="outline" className="text-center py-8 text-gray-500">
          Silahkan pilih counter untuk mulai melayani antrian
        </Card>
      )}
    </div>
  );
};

export default CounterOperator;
