"use client";
import {
  ICounter,
  ICreateCounterRequest,
  IUpdateCounterRequest,
} from "@/interfaces/services/counter.interface";
import React, { useState } from "react";
// Impor Hooks dari service wrapper yang sudah kita buat
import {
  useGetAllCounters,
  useCreateCounter,
  useUpdateCounter,
  useDeleteCounter,
} from "@/services/counter/wrapper.service";

import Button from "../atoms/Button";
import Card from "../atoms/Card";
import CounterCard from "../molecules/CounterCard";
import CounterForm from "../molecules/CounterForm";
import toast from "react-hot-toast";

// Import hook untuk antrian yang sedang dilayani
import { useGetCurrentQueues } from "@/services/queue/wrapper.service";

interface CounterManagerProps {
  className?: string;
}

const CounterManager: React.FC<CounterManagerProps> = ({ className }) => {
  const [isAddingCounter, setIsAddingCounter] = useState(false);
  const [editingCounter, setEditingCounter] = useState<ICounter | null>(null);
  const [selectedCounter, setSelectedCounter] = useState<ICounter | null>(null);

  // 1. INTEGRASI READ: Mengambil daftar counter
  const { data, isLoading: isLoadingCounters, isError } = useGetAllCounters();
  // Ambil data atau array kosong jika belum ada
  const counters: ICounter[] = data?.data || [];

  // Ambil antrian yang sedang dilayani di setiap counter
  const {
    data: currentQueuesData,
    isLoading: isLoadingCurrentQueues,
    isError: isErrorCurrentQueues,
  } = useGetCurrentQueues();
  // Bentuk: [{ id, name, currentQueue, status }]
  const currentQueuesDetail: {
    [counterId: number]: { currentQueue: number | null; status: string | null };
  } = {};
  if (Array.isArray(currentQueuesData?.data)) {
    currentQueuesData.data.forEach(
      (q: { id: number; currentQueue: number | null; status?: string }) => {
        currentQueuesDetail[q.id] = {
          currentQueue: q.currentQueue || null,
          status: q.status || null,
        };
      }
    );
  }

  // 2. INTEGRASI CREATE, UPDATE, DELETE Hooks
  // Hook untuk reset antrian
  const { mutate: resetQueues, status: resetStatus } =
    require("@/services/queue/wrapper.service").useResetQueues();
  const createMutation = useCreateCounter();
  const updateMutation = useUpdateCounter();
  const deleteMutation = useDeleteCounter();

  // Tentukan status loading gabungan untuk form
  const isSubmitting =
    createMutation.status === "pending" || updateMutation.status === "pending";
  const isDeleting = deleteMutation.status === "pending";

  // 3. LOGIKA FORM SUBMIT
  const handleSubmit = (
    data: ICreateCounterRequest | IUpdateCounterRequest
  ) => {
    // Periksa apakah ini mode edit (ada ID)
    if ("id" in data && data.id) {
      // UPDATE
      updateMutation.mutate(data as IUpdateCounterRequest, {
        onSuccess: () => {
          setEditingCounter(null);
        },
      });
    } else {
      // CREATE
      createMutation.mutate(data as ICreateCounterRequest, {
        onSuccess: () => {
          setIsAddingCounter(false);
        },
      });
    }
  };

  const handleCounterClick = (counter: ICounter) => {
    setSelectedCounter((prev) => (prev?.id === counter.id ? null : counter));
  };

  const handleEditCounter = () => {
    if (selectedCounter) {
      setEditingCounter(selectedCounter);
      setSelectedCounter(null); // Deselect saat mulai mengedit
    }
  };

  // 4. LOGIKA DELETE
  const handleDeleteCounter = () => {
    if (selectedCounter) {
      if (
        !window.confirm(
          `Yakin ingin menghapus counter ${selectedCounter.name}?`
        )
      ) {
        return;
      }

      deleteMutation.mutate(selectedCounter.id, {
        onSuccess: () => {
          setSelectedCounter(null); // Hapus seleksi setelah sukses
        },
        onError: (error) => {
          // Notifikasi error sudah ditangani di wrapper.service.ts
        },
      });
    } else {
      toast.error("Pilih counter yang ingin dihapus terlebih dahulu.");
    }
  };

  // 5. Tampilkan Loading State Global
  if (isLoadingCounters) {
    return (
      <Card variant="outline" className="text-center py-8 text-gray-500">
        <p>Memuat data counter...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card variant="outline" className="text-center py-8 text-red-700">
        <p>Gagal memuat data counter. Silakan coba lagi.</p>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Manajemen Counter
            </h2>
            <p className="text-gray-600 mt-1">Kelola counter/loket pelayanan</p>
          </div>
          {!isAddingCounter && !editingCounter && (
            <Button
              onClick={() => setIsAddingCounter(true)}
              leftIcon={<span className="material-symbols-outlined">add</span>}
            >
              Tambah Counter
            </Button>
          )}
        </div>
      </Card>

      {isAddingCounter || editingCounter ? (
        <Card>
          <h3 className="text-lg font-semibold mb-4">
            {editingCounter ? "Edit Counter" : "Tambah Counter Baru"}
          </h3>
          <CounterForm
            counter={editingCounter || undefined}
            onSubmit={handleSubmit}
            isLoading={isSubmitting} // Gunakan state loading dari mutation
            isEditMode={!!editingCounter}
          />
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingCounter(false);
                setEditingCounter(null);
              }}
              disabled={isSubmitting} // Disable saat sedang submit
            >
              Batal
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {selectedCounter && (
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                onClick={handleEditCounter}
                leftIcon={
                  <span className="material-symbols-outlined">edit</span>
                }
                disabled={isDeleting}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCounter}
                isLoading={isDeleting}
                leftIcon={
                  <span className="material-symbols-outlined">delete</span>
                }
              >
                Hapus
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (selectedCounter) {
                    if (
                      window.confirm(
                        `Yakin ingin reset semua antrian di counter ${selectedCounter.name}?`
                      )
                    ) {
                      resetQueues({ counter_id: selectedCounter.id });
                    }
                  }
                }}
                isLoading={resetStatus === "pending"}
                leftIcon={
                  <span className="material-symbols-outlined">restart_alt</span>
                }
              >
                Reset Antrian
              </Button>
            </div>
          )}

          {/* Gunakan variabel 'counters' yang sudah terisi dari useGetAllCounters */}
          {counters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {counters.map((counter) => (
                <CounterCard
                  key={counter.id}
                  counter={counter}
                  isSelected={selectedCounter?.id === counter.id}
                  onClick={handleCounterClick}
                  currentQueue={currentQueuesDetail[counter.id]?.currentQueue}
                  queueStatus={currentQueuesDetail[counter.id]?.status}
                />
              ))}
            </div>
          ) : (
            <Card variant="outline" className="text-center py-8 text-gray-500">
              Belum ada counter. Klik 'Tambah Counter' untuk membuat counter
              baru.
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default CounterManager;
