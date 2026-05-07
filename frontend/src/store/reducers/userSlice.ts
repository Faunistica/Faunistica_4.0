import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UserState {
    auth: boolean | null;
    username: string | null;
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
    user_id: localStorage.getItem('user_id') ? Number(localStorage.getItem('user_id')) : null,
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<{ username: string; user_id: number }>) => {
            state.auth = true;
            state.username = action.payload.username;
            state.user_id = action.payload.user_id;
            localStorage.setItem('auth', 'true');
            localStorage.setItem('username', action.payload.username);
            localStorage.setItem('user_id', String(action.payload.user_id));
        },
        logout: (state) => {
            state.auth = false;
            state.username = null;
            state.user_id = null;
            localStorage.removeItem('auth');
            localStorage.removeItem('username');
            localStorage.removeItem('user_id');
        },
    },
})

export const { login, logout } = userSlice.actions
export default userSlice.reducer