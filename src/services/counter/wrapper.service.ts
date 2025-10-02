"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateCounter,
  apiDeleteCounter,
  apiGetCounterById,
  apiGetAllCounters,
  apiUpdateCounter,
} from "./api.service";
import {
  ICreateCounterRequest,
  IUpdateCounterRequest,
} from "@/interfaces/services/counter.interface"; // Asumsi path interface
import toast from "react-hot-toast";

// Kunci Query untuk Caching React Query
const COUNTER_KEYS = {
  all: ["counters"] as const,
  byId: (id: number) => ["counters", id] as const,
};

// --- READ: GET ALL COUNTERS ---
export const useGetAllCounters = () => {
  return useQuery({
    queryKey: COUNTER_KEYS.all,
    queryFn: () => apiGetAllCounters(),
    refetchOnWindowFocus: false,
  });
};

// --- READ: GET COUNTER BY ID ---
export const useGetCounterById = (id: number) => {
  return useQuery({
    queryKey: COUNTER_KEYS.byId(id),
    queryFn: () => apiGetCounterById(id),
    enabled: !!id, // Hanya jalankan jika ID tersedia
    refetchOnWindowFocus: false,
  });
};

// --- CREATE: CREATE COUNTER ---
export const useCreateCounter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateCounterRequest) => apiCreateCounter(data),
    onSuccess: (response) => {
      if (response && response.error) {
        toast.error(response.error.message || "Gagal membuat counter");
        return;
      }

      if (response && response.status === true) {
        toast.success("Counter berhasil dibuat");
        // Invalidasi daftar counter agar UI terupdate
        queryClient.invalidateQueries({ queryKey: COUNTER_KEYS.all }); 
      } else {
        toast.error(response?.message || "Gagal membuat counter");
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Gagal membuat counter");
    },
  });
};

// --- UPDATE: UPDATE COUNTER ---
export const useUpdateCounter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IUpdateCounterRequest) => apiUpdateCounter(data),
    onSuccess: (response, variables) => {
      if (response && response.error) {
        toast.error(response.error.message || "Gagal memperbarui counter");
        return;
      }

      if (response && response.status === true) {
        toast.success("Counter berhasil diperbarui");
        // Invalidasi daftar counter dan detail counter yang diperbarui
        queryClient.invalidateQueries({ queryKey: COUNTER_KEYS.all });
        if (typeof variables.id === "number") {
          queryClient.invalidateQueries({ queryKey: COUNTER_KEYS.byId(variables.id) });
        }
      } else {
        toast.error(response?.message || "Gagal memperbarui counter");
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Gagal memperbarui counter");
    },
  });
};

// --- DELETE: DELETE COUNTER ---
export const useDeleteCounter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiDeleteCounter(id),
    onSuccess: (response) => {
      if (response && response.error) {
        toast.error(response.error.message || "Gagal menghapus counter");
        return;
      }

      if (response && response.status === true) {
        toast.success("Counter berhasil dihapus");
        // Invalidasi daftar counter agar item yang dihapus hilang dari list
        queryClient.invalidateQueries({ queryKey: COUNTER_KEYS.all });
      } else {
        toast.error(response?.message || "Gagal menghapus counter");
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Gagal menghapus counter");
    },
  });
};

// Jika Anda memiliki endpoint lain (misalnya, toggle active status), Anda bisa menambahkannya di sini.