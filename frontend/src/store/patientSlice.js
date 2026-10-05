import { createSlice } from '@reduxjs/toolkit';

const patientSlice = createSlice({
  name: 'patient',
  initialState: {
    currentPatient: null,
    patientHistory: [],
    vitals: {},
    alerts: [],
    loading: false,
    error: null,
  },
  reducers: {
    fetchPatientStart: (state) => {
      state.loading = true;
    },
    fetchPatientSuccess: (state, action) => {
      state.loading = false;
      state.currentPatient = action.payload;
      state.error = null;
    },
    fetchPatientFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateVitals: (state, action) => {
      state.vitals = action.payload;
    },
    addAlert: (state, action) => {
      state.alerts.unshift(action.payload);
      // Keep only last 10 alerts
      if (state.alerts.length > 10) {
        state.alerts = state.alerts.slice(0, 10);
      }
    },
    clearAlerts: (state) => {
      state.alerts = [];
    },
    fetchPatientHistoryStart: (state) => {
      state.loading = true;
    },
    fetchPatientHistorySuccess: (state, action) => {
      state.loading = false;
      state.patientHistory = action.payload;
      state.error = null;
    },
    fetchPatientHistoryFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchPatientStart,
  fetchPatientSuccess,
  fetchPatientFailure,
  updateVitals,
  addAlert,
  clearAlerts,
  fetchPatientHistoryStart,
  fetchPatientHistorySuccess,
  fetchPatientHistoryFailure,
} = patientSlice.actions;

export default patientSlice.reducer;