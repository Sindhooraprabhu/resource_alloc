import { createSlice } from '@reduxjs/toolkit';

const emergencySlice = createSlice({
  name: 'emergency',
  initialState: {
    activeEmergencies: [],
    emergencyHistory: [],
    loading: false,
    error: null,
    sosActive: false,
  },
  reducers: {
    fetchEmergenciesStart: (state) => {
      state.loading = true;
    },
    fetchEmergenciesSuccess: (state, action) => {
      state.loading = false;
      state.activeEmergencies = action.payload;
      state.error = null;
    },
    fetchEmergenciesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addEmergency: (state, action) => {
      state.activeEmergencies.unshift(action.payload);
    },
    updateEmergencyStatus: (state, action) => {
      const { id, status } = action.payload;
      const emergency = state.activeEmergencies.find(e => e.id === id);
      if (emergency) {
        emergency.status = status;
        if (status === 'completed' || status === 'cancelled') {
          // Move to history
          state.emergencyHistory.push(emergency);
          state.activeEmergencies = state.activeEmergencies.filter(e => e.id !== id);
        }
      }
    },
    fetchEmergencyHistoryStart: (state) => {
      state.loading = true;
    },
    fetchEmergencyHistorySuccess: (state, action) => {
      state.loading = false;
      state.emergencyHistory = action.payload;
      state.error = null;
    },
    fetchEmergencyHistoryFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    activateSOS: (state) => {
      state.sosActive = true;
    },
    deactivateSOS: (state) => {
      state.sosActive = false;
    },
  },
});

export const {
  fetchEmergenciesStart,
  fetchEmergenciesSuccess,
  fetchEmergenciesFailure,
  addEmergency,
  updateEmergencyStatus,
  fetchEmergencyHistoryStart,
  fetchEmergencyHistorySuccess,
  fetchEmergencyHistoryFailure,
  activateSOS,
  deactivateSOS,
} = emergencySlice.actions;

export default emergencySlice.reducer;