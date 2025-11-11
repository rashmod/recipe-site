import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAdmin } from './_utils';

const ingredientSchema = v.array(
	v.object({
		item: v.string(),
		quantity: v.optional(
			v.object({
				amount: v.optional(v.number()),
				unit: v.optional(v.string()),
			})
		),
	})
);

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('recipes').collect();
	},
});

export const add = mutation({
	args: {
		title: v.string(),
		ingredients: ingredientSchema,
		instructions: v.string(),
		adminSecret: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { adminSecret, ...recipe } = args;
		requireAdmin(ctx, adminSecret ?? null);
		await ctx.db.insert('recipes', recipe);
	},
});

export const update = mutation({
	args: {
		id: v.id('recipes'),
		title: v.optional(v.string()),
		ingredients: v.optional(ingredientSchema),
		instructions: v.optional(v.string()),
		adminSecret: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, adminSecret, ...updates } = args;
		requireAdmin(ctx, adminSecret ?? null);
		const fields = Object.fromEntries(
			Object.entries(updates).filter(([, value]) => value !== undefined)
		);
		if (Object.keys(fields).length === 0) {
			return;
		}
		await ctx.db.patch(id, fields);
	},
});

export const remove = mutation({
	args: { id: v.id('recipes'), adminSecret: v.optional(v.string()) },
	handler: async (ctx, args) => {
		requireAdmin(ctx, args.adminSecret ?? null);
		await ctx.db.delete(args.id);
	},
});
