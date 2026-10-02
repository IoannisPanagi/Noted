import axios from 'axios';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
	timeout: 5000,
});

api.interceptors.response.use(
	function onFulfilled(response) {
		return response;
	},
	function onRejected(error) {
		// No response (offline, timed out) has no body, so the error itself goes on
		return Promise.reject(error.response?.data ?? error);
	},
);

export { api };
