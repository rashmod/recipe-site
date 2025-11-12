import { action } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

// Public action to clear all data (for seeding)
export const clearAllData = action({
	args: {},
	handler: async (
		ctx
	): Promise<{
		recipes: number;
		ingredients: number;
		forms: number;
	}> => {
		console.log('🗑️  Clearing all existing data...');

		// Delete in order: recipes first (they reference ingredients and forms),
		// then ingredients, then forms
		const recipesResult = (await ctx.runMutation(
			internal.recipes.deleteAllRecipes,
			{}
		)) as { deletedCount: number };
		console.log(`   Deleted ${recipesResult.deletedCount} recipes`);

		const ingredientsResult = (await ctx.runMutation(
			internal.recipes.deleteAllIngredients,
			{}
		)) as { deletedCount: number };
		console.log(`   Deleted ${ingredientsResult.deletedCount} ingredients`);

		const formsResult = (await ctx.runMutation(
			internal.recipes.deleteAllIngredientForms,
			{}
		)) as { deletedCount: number };
		console.log(`   Deleted ${formsResult.deletedCount} ingredient forms`);

		return {
			recipes: recipesResult.deletedCount,
			ingredients: ingredientsResult.deletedCount,
			forms: formsResult.deletedCount,
		};
	},
});

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

			// Since we cleared the database, we can just create new ingredients
			const id = await ctx.runMutation(
				internal.recipes.createIngredient,
				{
					item: trimmedName,
				}
			);
			ingredientMap[trimmedName] = id;
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
						forms: v.optional(v.array(v.string())), // Array of form names (strings)
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
			// Convert ingredient names to IDs and form names to form IDs
			const ingredientRefs: Array<{
				item: Id<'ingredients'>;
				forms?: Id<'ingredientForm'>[];
				quantity?: { amount?: number; unit?: string };
			}> = [];

			for (const ing of recipe.ingredients) {
				const ingredientId = ingredientMap[ing.item];
				if (!ingredientId) {
					console.warn(`Ingredient not found: ${ing.item}`);
					continue;
				}

				// Convert form names to form IDs
				let formIds: Id<'ingredientForm'>[] | undefined;
				if (ing.forms && ing.forms.length > 0) {
					formIds = await Promise.all(
						ing.forms.map(async (formName) => {
							// Check if form exists
							const existingForm = await ctx.runQuery(
								internal.recipes.findIngredientFormByName,
								{
									form: formName.trim(),
								}
							);

							if (existingForm) {
								return existingForm;
							}

							// Create new form
							return await ctx.runMutation(
								internal.recipes.createIngredientForm,
								{
									form: formName.trim(),
								}
							);
						})
					);
				}

				ingredientRefs.push({
					item: ingredientId as Id<'ingredients'>,
					forms: formIds,
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
