import db from '$lib/server/database/database.js';

export async function GET() {
	db.exec('SELECT 1');
	return new Response('ok');
}
