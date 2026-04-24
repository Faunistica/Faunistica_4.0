import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UserState {
    auth: boolean | null;
    username: string | null;
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
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<string>) => {
            state.auth = true;
            state.username = action.payload;
            localStorage.setItem('auth', 'true');
            localStorage.setItem('username', action.payload);
        },
        logout: (state) => {
            state.auth = false;
            state.username = null;
            localStorage.removeItem('auth');
            localStorage.removeItem('username');
        },
    },
})

export const { login, logout } = userSlice.actions
export default userSlice.reducer