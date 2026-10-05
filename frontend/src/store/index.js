import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import emergencyReducer from './emergencySlice';
import patientReducer from './patientSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    emergency: emergencyReducer,
    patient: patientReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;