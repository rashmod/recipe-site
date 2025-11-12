import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	recipes: defineTable({
		title: v.string(),
		ingredients: v.array(
			v.object({
				item: v.id('ingredients'),
				forms: v.optional(v.array(v.id('ingredientForm'))),
				quantity: v.optional(
					v.object({
						amount: v.optional(v.number()),
						unit: v.optional(v.string()),
					})
				),
			})
		),
		instructions: v.string(),
	}),

	ingredients: defineTable({
		item: v.string(),
	}),

	ingredientForm: defineTable({
		form: v.string(),
	}),
});
