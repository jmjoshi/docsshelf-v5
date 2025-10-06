import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: 'light', loading: { global: false, components: {} } },
  reducers: {},
});

export default uiSlice.reducer;