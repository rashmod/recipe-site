import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	recipes: defineTable({
		title: v.string(),
		ingredients: v.array(
			v.object({
				item: v.string(),
				quantity: v.string(),
			})
		),
		instructions: v.string(),
	}),
});
