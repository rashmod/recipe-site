import { action } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

// Public action to import ingredients (for migration script)
export const importIngredients = action({
	args: {
		ingredients: v.array(
			v.object({
				item: v.string(),
			})
		),
	},
	handler: async (ctx, args) => {
		const ingredientMap: Record<string, string> = {};

		// Import each ingredient, creating a name -> ID mapping
		for (const ingredient of args.ingredients) {
			const trimmedName = ingredient.item.trim();
			if (!trimmedName) continue;

			// Check if ingredient already exists
			const existing = await ctx.runQuery(
				internal.recipes.findIngredientByName,
				{
					item: trimmedName,
				}
			);

			if (existing) {
				ingredientMap[trimmedName] = existing;
			} else {
				// Create new ingredient
				const id = await ctx.runMutation(
					internal.recipes.createIngredient,
					{
						item: trimmedName,
					}
				);
				ingredientMap[trimmedName] = id;
			}
		}

		return ingredientMap;
	},
});

// Public action to import recipes (for migration script)
export const importRecipes = action({
	args: {
		recipes: v.array(
			v.object({
				title: v.string(),
				ingredients: v.array(
					v.object({
						item: v.string(),
						quantity: v.optional(
							v.object({
								amount: v.optional(v.number()),
								unit: v.optional(v.string()),
							})
						),
					})
				),
				instructions: v.string(),
			})
		),
		ingredientMap: v.any(), // Map of ingredient name -> ID
	},
	handler: async (ctx, args) => {
		const ingredientMap = args.ingredientMap as Record<string, string>;
		const results: Array<{ title: string; id: string }> = [];

		for (const recipe of args.recipes) {
			// Convert ingredient names to IDs
			const ingredientRefs: Array<{
				item: Id<'ingredients'>;
				quantity?: { amount?: number; unit?: string };
			}> = [];

			for (const ing of recipe.ingredients) {
				const ingredientId = ingredientMap[ing.item];
				if (!ingredientId) {
					console.warn(`Ingredient not found: ${ing.item}`);
					continue;
				}
				ingredientRefs.push({
					item: ingredientId as Id<'ingredients'>,
					quantity: ing.quantity,
				});
			}

			if (ingredientRefs.length === 0) {
				console.warn(
					`Recipe "${recipe.title}" has no valid ingredients, skipping`
				);
				continue;
			}

			// Import recipe using the internal mutation
			const recipeId = await ctx.runMutation(
				internal.recipes.createRecipe,
				{
					title: recipe.title,
					ingredients: ingredientRefs,
					instructions: recipe.instructions,
				}
			);

			results.push({ title: recipe.title, id: recipeId });
		}

		return results;
	},
});
