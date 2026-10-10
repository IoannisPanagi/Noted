import axios, { AxiosError } from 'axios';

const api = axios.create({
	// Same origin: the dev server or nginx forwards it to the API
	baseURL: '/api',
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
	timeout: 5000,
});

// Requests that got no answer carry axios' own wording, so each is given one the UI can show as is
const noResponseMessages = {
	[AxiosError.ERR_NETWORK]: 'Server unavailable, please try again later',
	[AxiosError.ECONNABORTED]:
		'The server took too long to answer, please try again',
	[AxiosError.ETIMEDOUT]:
		'The server took too long to answer, please try again',
};

api.interceptors.response.use(
	function onFulfilled(response) {
		return response;
	},
	function onRejected(error) {
		// The server's body keeps its statusCode, which the workspace provider checks
		if (error.response) return Promise.reject(error.response.data);

		// Messages that had no response and axios has to fill for them go through this filter for better messaging. (If one is available of course)
		// The code is kept so callers can tell a dead server from a slow one
		const message = noResponseMessages[error.code];
		return Promise.reject(
			message ? Object.assign(new Error(message), { code: error.code }) : error,
		);
	},
);

export { api };
