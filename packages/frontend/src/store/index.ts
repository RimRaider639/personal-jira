import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import slices
import authReducer from './slices/authSlice';
import boardsReducer from './slices/boardsSlice';
import sectionsReducer from './slices/sectionsSlice';
import tasksReducer from './slices/tasksSlice';
import epicsReducer from './slices/epicsSlice';
import filtersReducer from './slices/filtersSlice';
import syncReducer from './slices/syncSlice';
import uiReducer from './slices/uiSlice';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  boards: boardsReducer,
  sections: sectionsReducer,
  tasks: tasksReducer,
  epics: epicsReducer,
  filters: filtersReducer,
  sync: syncReducer,
  ui: uiReducer,
});

// Persist configuration
const persistConfig = {
  key: 'kanban-root',
  version: 1,
  storage: AsyncStorage,
  // Whitelist slices to persist
  whitelist: ['auth', 'boards', 'sections', 'tasks', 'epics', 'filters', 'ui'],
  // Blacklist slices that shouldn't be persisted
  blacklist: ['sync'],
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions for serializable check
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export { useAppDispatch, useAppSelector } from './hooks';
