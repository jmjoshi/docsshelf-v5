import { createSlice } from '@reduxjs/toolkit';

const documentsSlice = createSlice({
  name: 'documents',
  initialState: { documents: {}, loading: false, error: null },
  reducers: {},
});

export default documentsSlice.reducer;