"use server";

import { satellite } from "@/config/api.config";
import { APIBaseResponse } from "@/interfaces/api.interface";
// ASUMSI: Anda membuat file interfaces/services/counter.interface.ts
import { 
  ICounter, 
  ICreateCounterRequest, 
  IUpdateCounterRequest 
} from "@/interfaces/services/counter.interface"; 
import { errorMessage } from "@/utils/error.util";
// Kita asumsikan API_BASE_PATH di backend Express adalah /api/v1/counters
// Catatan: router Anda tadi hanya punya POST /create. Saya asumsikan base path-nya adalah /api/v1/counters
const API_BASE_PATH = "/api/v1/counters"; 

// --- 1. GET ALL COUNTERS (router.get("/")) ---
export const apiGetAllCounters = async () => {
  try {
    const res = await satellite.get<APIBaseResponse<ICounter[]>>(
      `${API_BASE_PATH}/`
    );
    return res.data;
  } catch (error) {
    return errorMessage<ICounter[]>(error);
  }
};

// --- 2. GET COUNTER BY ID (router.get("/:id")) ---
export const apiGetCounterById = async (id: number) => {
  try {
    const res = await satellite.get<APIBaseResponse<ICounter>>(
      `${API_BASE_PATH}/${id}`
    );
    return res.data;
  } catch (error) {
    return errorMessage<ICounter>(error);
  }
};

// --- 3. CREATE COUNTER (router.post("/create")) ---
export const apiCreateCounter = async (data: ICreateCounterRequest) => {
  try {
    const res = await satellite.post<APIBaseResponse<ICounter>>(
      `${API_BASE_PATH}/create`,
      data
    );
    return res.data;
  } catch (error) {
    return errorMessage<ICounter>(error);
  }
};

// --- 4. UPDATE COUNTER (router.put("/:id")) ---
export const apiUpdateCounter = async (data: IUpdateCounterRequest) => {
  try {
    const id = data.id;
    // Mirip dengan pola auth, hapus 'id' dari body sebelum dikirim jika diperlukan
    delete data.id; 
    
    const res = await satellite.put<APIBaseResponse<ICounter>>(
      `${API_BASE_PATH}/${id}`,
      data
    );
    return res.data;
  } catch (error) {
    return errorMessage<ICounter>(error);
  }
};

// --- 5. DELETE COUNTER (router.delete("/:id")) ---
export const apiDeleteCounter = async (id: number) => {
  try {
    const res = await satellite.delete<APIBaseResponse<{ success: boolean }>>(
      `${API_BASE_PATH}/${id}`
    );
    return res.data;
  } catch (error) {
    return errorMessage<{ success: boolean }>(error);
  }
};