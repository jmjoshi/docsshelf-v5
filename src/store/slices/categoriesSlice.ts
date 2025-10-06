import { createSlice } from '@reduxjs/toolkit';

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: { categories: {}, folders: {}, loading: false, error: null },
  reducers: {},
});

export default categoriesSlice.reducer;