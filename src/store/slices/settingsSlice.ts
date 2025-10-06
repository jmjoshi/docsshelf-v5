import { createSlice } from '@reduxjs/toolkit';

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { preferences: {}, securitySettings: {}, loading: false, error: null },
  reducers: {},
});

export default settingsSlice.reducer;