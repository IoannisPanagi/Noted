import jwt from 'jsonwebtoken';

// 256+ bit secret and expiry in milliseconds
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiry = parseInt(process.env.JWT_EXPIRY);

if(!jwtExpiry || !jwtSecret) {
	throw new Error("JWT Credentials missing!")
}

export function generateJws(workspace) {
	return jwt.sign(
		{
			expiresIn: jwtExpiry,
			data: {
				passphrase: workspace.passphrase,
			},
			iss: 'Noted',
		},
		jwtSecret,
	);
}

export function extractPayload(token) {
	if (!token) return null;

	try {
		return jwt.verify(token, jwtSecret, {
			issuer: 'Noted',
		});
	} catch (err) {
		console.error(err);
		return null;
	}
}
