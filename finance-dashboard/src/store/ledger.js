import { configureStore, createSlice } from "@reduxjs/toolkit";

const workspace = createSlice({
  name: "workspace",
  initialState: null,
  reducers: { received: (_, action) => action.payload },
});
export const { received } = workspace.actions;
export const store = configureStore({ reducer: { workspace: workspace.reducer } });
