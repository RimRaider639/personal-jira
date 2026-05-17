import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed useDispatch hook for the app
 * Use this instead of plain `useDispatch` for type safety
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed useSelector hook for the app
 * Use this instead of plain `useSelector` for type safety
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
