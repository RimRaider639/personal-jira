import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { UserStreak, CheckInResponse, StreakMilestone } from '@kanban/shared';
import { apiClient } from '@/services/api';

/**
 * Streak state interface
 */
export interface StreakState {
  streak: UserStreak | null;
  pendingMilestone: StreakMilestone | null;
  isLoading: boolean;
  error: string | null;
  lastCheckInResult: CheckInResponse | null;
}

/**
 * Initial streak state
 */
const initialState: StreakState = {
  streak: null,
  pendingMilestone: null,
  isLoading: false,
  error: null,
  lastCheckInResult: null,
};

/**
 * Get timezone offset header for streak API calls
 * Returns the user's local timezone offset in minutes
 * Note: getTimezoneOffset() returns minutes, negative for east of UTC
 */
const getTimezoneHeader = (): Record<string, string> => {
  const offset = new Date().getTimezoneOffset();
  return { 'x-timezone-offset': String(offset) };
};

/**
 * Async thunk for fetching user's streak
 */
export const fetchStreak = createAsyncThunk<
  UserStreak,
  void,
  { rejectValue: string }
>('streak/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: UserStreak }>('/streak', {
      headers: getTimezoneHeader(),
    });
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch streak';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for daily check-in
 */
export const checkIn = createAsyncThunk<
  CheckInResponse,
  void,
  { rejectValue: string }
>('streak/checkIn', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: CheckInResponse }>('/streak/checkin', undefined, {
      headers: getTimezoneHeader(),
    });
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check in';
    return rejectWithValue(message);
  }
});

/**
 * Streak slice
 */
const streakSlice = createSlice({
  name: 'streak',
  initialState,
  reducers: {
    /**
     * Clear any streak errors
     */
    clearStreakError: (state) => {
      state.error = null;
    },
    /**
     * Clear pending milestone (after showing achievement toast)
     */
    clearPendingMilestone: (state) => {
      state.pendingMilestone = null;
    },
    /**
     * Clear last check-in result
     */
    clearLastCheckInResult: (state) => {
      state.lastCheckInResult = null;
    },
    /**
     * Reset streak state
     */
    resetStreak: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch streak
    builder
      .addCase(fetchStreak.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStreak.fulfilled, (state, action) => {
        state.isLoading = false;
        state.streak = action.payload;
      })
      .addCase(fetchStreak.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch streak';
      });

    // Check-in
    builder
      .addCase(checkIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.streak = action.payload.streak;
        state.lastCheckInResult = action.payload;
        // Set pending milestone if there is one
        if (action.payload.milestone) {
          state.pendingMilestone = action.payload.milestone;
        }
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to check in';
      });
  },
});

export const {
  clearStreakError,
  clearPendingMilestone,
  clearLastCheckInResult,
  resetStreak,
} = streakSlice.actions;

export default streakSlice.reducer;
