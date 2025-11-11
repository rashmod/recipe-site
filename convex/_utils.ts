import { MutationCtx } from './_generated/server';

export function requireAdmin(ctx: MutationCtx, adminSecret: string | null) {
	if (adminSecret !== process.env.ADMIN_SECRET) {
		throw new Error('Not authorized');
	}
}
