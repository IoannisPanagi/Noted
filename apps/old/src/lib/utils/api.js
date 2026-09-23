import axios from 'axios';

const BASE_API_URL = '/api';

const api = axios.create({
	baseURL: BASE_API_URL,
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
		return Promise.reject(error.response.data);
	},
);

export { api };
