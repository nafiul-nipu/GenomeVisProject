import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  workerToClientMessageType,
  DataInfoType,
  DataState,
} from "../types/data_types_interfaces";

import type { RootState } from "./store";
import { requestData } from "../worker/workerService";

const initialState: DataState = {
  data: null,
  status: "idle",
};

export const fetchWorkerData = createAsyncThunk<
  workerToClientMessageType,
  { data_info: DataInfoType; species: string; chromosome: string },
  { state: RootState }
>("data/fetchWorkerData", async ({ data_info, species, chromosome }) => {
  // post a request to the worker and await a response
  // via a promise
  const result = await requestData(data_info, species, chromosome);
  // console.log("[workerService] Received response:", result);

  return result;
});

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    workerDataArrived(state, action: PayloadAction<workerToClientMessageType>) {
      state.data = action.payload;
      state.status = "success";
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkerData.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchWorkerData.fulfilled, (state, action) => {
        state.status = "success";
        state.data = action.payload;
      })
      .addCase(fetchWorkerData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error?.message || "Worker request failed";
        // console.error("[redux] Worker rejected:", action.error);
      });
  },
});

export const { workerDataArrived } = dataSlice.actions;
export default dataSlice.reducer;
