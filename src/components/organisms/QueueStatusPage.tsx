"use client";
import { IQueue } from "@/interfaces/services/queue.interface";
import React, { useState } from "react";
import {
  useSearchQueue,
  useReleaseQueue,
} from "@/services/queue/wrapper.service";
import Button from "../atoms/Button";
import Card from "../atoms/Card";
import QueueCard from "../molecules/QueueCard";
import ReleaseQueueForm from "../molecules/ReleaseQueueForm";

interface QueueStatusCheckerProps {
  className?: string;
}

const QueueStatusChecker: React.FC<QueueStatusCheckerProps> = ({
  className,
}) => {
  const [queueNumber, setQueueNumber] = useState("");
  const [queueDetails, setQueueDetails] = useState<IQueue | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Hook pencarian antrian
  const {
    data: searchResult,
    isLoading: isSearching,
    refetch,
  } = useSearchQueue(queueNumber);
  // Hook release antrian
  const releaseMutation = useReleaseQueue();

  // Submit form pencarian
  const handleSubmit = (data: { queueNumber: string }) => {
    setQueueNumber(data.queueNumber);
    setQueueDetails(null);
    setNotFound(false);
    refetch().then((res) => {
      const result = res.data?.data;
      if (Array.isArray(result) && result.length > 0) {
        setQueueDetails(result[0]);
        setNotFound(false);
      } else {
        setQueueDetails(null);
        setNotFound(true);
      }
    });
  };

  // Lepaskan antrian
  const handleReleaseQueue = () => {
    if (!queueDetails) return;
    releaseMutation.mutate(
      {
        queue_number: queueDetails.queueNumber,
        counter_id: queueDetails.counter?.id ?? 0,
      },
      {
        onSuccess: () => {
          setQueueDetails(null);
          setQueueNumber("");
          setNotFound(false);
        },
      }
    );
  };

  return (
    <div className={className}>
      <Card className="mb-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Cek Status Antrian
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Masukkan nomor antrian Anda untuk memeriksa status
        </p>

        <ReleaseQueueForm
          onSubmit={handleSubmit}
          isLoading={isSearching || releaseMutation.status === "pending"}
        />
      </Card>

      {queueDetails ? (
        <div className="space-y-4">
          <QueueCard queue={queueDetails} />

          {queueDetails.status === "CLAIMED" && (
            <Button
              variant="danger"
              fullWidth
              onClick={handleReleaseQueue}
              leftIcon={
                <span className="material-symbols-outlined">exit_to_app</span>
              }
            >
              Lepaskan Nomor Antrian
            </Button>
          )}
        </div>
      ) : (
        notFound &&
        queueNumber && (
          <Card variant="outline" className="text-center py-6 text-gray-500">
            Nomor antrian <strong>{queueNumber}</strong> tidak ditemukan.
          </Card>
        )
      )}
    </div>
  );
};

export default QueueStatusChecker;
