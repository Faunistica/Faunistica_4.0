import type { UserInfo } from '@/types/api.dto';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearUserPhotoCache } from '@/hooks/useUserPhoto';

interface UserState {
    auth: boolean | null;
    username: string | null;
    name: string | null;
    user_id: number | null;
}

const getInitialAuth = (): boolean | null => {
    const cached = localStorage.getItem('auth');
    if (cached === 'true') return true;
    if (cached === 'false') return false;
    return null;
};

const initialState: UserState = {
    auth: getInitialAuth(),
    username: localStorage.getItem('username'),
    name: localStorage.getItem('name'),
    user_id: localStorage.getItem('user_id') ? Number(localStorage.getItem('user_id')) : null,
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<UserInfo | undefined>) => {
            state.auth = true;
            localStorage.setItem('auth', 'true');

            if (action.payload) {
                state.username = action.payload.username;
                state.name = action.payload.name;
                state.user_id = action.payload.user_id;
                localStorage.setItem('username', action.payload.username);
                localStorage.setItem('name', action.payload.name);
                localStorage.setItem('user_id', String(action.payload.user_id));
            }
        },
        logout: (state) => {
            state.auth = false;
            state.username = null;
            state.name = null;
            state.user_id = null;
            localStorage.removeItem('auth');
            localStorage.removeItem('username');
            localStorage.removeItem('name');
            localStorage.removeItem('user_id');
            clearUserPhotoCache();
        },
    },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
