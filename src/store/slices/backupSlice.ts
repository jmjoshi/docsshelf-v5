import { createSlice } from '@reduxjs/toolkit';

const backupSlice = createSlice({
  name: 'backup',
  initialState: { configs: [], loading: false, error: null },
  reducers: {},
});

export default backupSlice.reducer;