import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import userReducer from './reducers/userSlice.ts';
import { authAPI } from '../api/authAPI';
import { recordAPI } from '../api/recordAPI.ts';
import { statsAPI } from '../api/statsAPI.ts';
import { publAPI } from '../api/publAPI.ts';
import { utilAPI } from '../api/utilAPI.ts';

const rootReducer = combineReducers({
    user: userReducer,
    [authAPI.reducerPath]: authAPI.reducer,
    [recordAPI.reducerPath]: recordAPI.reducer,
    [statsAPI.reducerPath]: statsAPI.reducer,
    [publAPI.reducerPath]: publAPI.reducer,
    [utilAPI.reducerPath]: utilAPI.reducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authAPI.middleware,
            recordAPI.middleware,
            statsAPI.middleware,
            publAPI.middleware,
            utilAPI.middleware,
        ),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = typeof store;

export const useAppDispatch = () => useDispatch<AppStore['dispatch']>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
