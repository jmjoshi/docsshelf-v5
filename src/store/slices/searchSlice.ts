import { createSlice } from '@reduxjs/toolkit';

const searchSlice = createSlice({
  name: 'search',
  initialState: { query: null, results: null, loading: false, error: null },
  reducers: {},
});

export default searchSlice.reducer;