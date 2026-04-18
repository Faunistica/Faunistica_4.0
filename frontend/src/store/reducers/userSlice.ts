import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    auth: false,
    isLoading: false,
    error: null,
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state) => {
            state.auth = true
            console.log("hi")
        },
        logout: (state) => {
            state.auth = false
        },
    },
})

export const { login, logout } = userSlice.actions
export default userSlice.reducer