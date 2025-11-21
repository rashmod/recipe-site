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
		units: number;
		pairings: number;
	}> => {
		console.log('🗑️  Clearing all existing data...');

		// Delete in order: recipes first (they reference ingredients and forms),
		// then ingredients, then forms, then pairings (they reference recipes)
		const pairingsResult = (await ctx.runMutation(
			internal.recipes.deleteAllRecipePairings,
			{}
		)) as { deletedCount: number };
		console.log(
			`   Deleted ${pairingsResult.deletedCount} recipe pairings`
		);

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

		const unitsResult = (await ctx.runMutation(
			internal.recipes.deleteAllUnits,
			{}
		)) as { deletedCount: number };
		console.log(`   Deleted ${unitsResult.deletedCount} units`);

		return {
			recipes: recipesResult.deletedCount,
			ingredients: ingredientsResult.deletedCount,
			forms: formsResult.deletedCount,
			units: unitsResult.deletedCount,
			pairings: pairingsResult.deletedCount,
		};
	},
});

// Public action to import units (for migration script)
export const importUnits = action({
	args: {
		units: v.array(
			v.object({
				unit: v.string(),
			})
		),
	},
	handler: async (ctx, args) => {
		const unitMap: Record<string, string> = {};

		// Import each unit, creating a name -> ID mapping
		for (const unit of args.units) {
			const trimmedName = unit.unit.trim();
			if (!trimmedName) continue;

			// Since we cleared the database, we can just create new units
			const id = await ctx.runMutation(internal.recipes.createUnit, {
				unit: trimmedName,
			});
			unitMap[trimmedName] = id;
		}

		return unitMap;
	},
});

// Public action to import ingredients (for migration script)
export const importIngredients = action({
	args: {
		ingredients: v.array(
			v.object({
				item: v.string(),
				proteinPer100g: v.optional(v.number()),
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
					proteinPer100g: ingredient.proteinPer100g,
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
						core: v.optional(v.boolean()),
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
		ingredientMap: v.record(v.string(), v.string()), // Map of ingredient name -> ID
	},
	handler: async (ctx, args) => {
		const ingredientMap = args.ingredientMap;
		const results: Array<{ title: string; id: string }> = [];

		for (const recipe of args.recipes) {
			// Convert ingredient names to IDs and form names to form IDs
			const ingredientRefs: Array<{
				item: Id<'ingredients'>;
				core?: boolean;
				forms?: Id<'ingredientForm'>[];
				quantity?: { amount?: number; unit?: Id<'units'> };
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

				// Convert unit name to unit ID
				let unitId: Id<'units'> | undefined;
				if (ing.quantity?.unit) {
					// Check if unit exists
					const existingUnit = await ctx.runQuery(
						internal.recipes.findUnitByName,
						{
							unit: ing.quantity.unit.trim(),
						}
					);

					if (existingUnit) {
						unitId = existingUnit;
					} else {
						// Create new unit
						unitId = await ctx.runMutation(
							internal.recipes.createUnit,
							{
								unit: ing.quantity.unit.trim(),
							}
						);
					}
				}

				ingredientRefs.push({
					item: ingredientId as Id<'ingredients'>,
					core: ing.core,
					forms: formIds,
					quantity: ing.quantity
						? {
								amount: ing.quantity.amount,
								unit: unitId,
						  }
						: undefined,
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

// Public action to import recipe pairings (for migration script)
export const importPairings = action({
	args: {
		pairings: v.array(
			v.object({
				recipeTitles: v.array(v.string()), // Array of recipe titles
			})
		),
		recipeMap: v.record(v.string(), v.string()), // Map of recipe title -> ID
	},
	handler: async (ctx, args) => {
		const recipeMap = args.recipeMap;
		const results: Array<{ recipeTitles: string[]; id: string }> = [];

		for (const pairing of args.pairings) {
			// Convert recipe titles to IDs
			const recipeIds: Id<'recipes'>[] = [];

			for (const title of pairing.recipeTitles) {
				const recipeId = recipeMap[title];
				if (!recipeId) {
					console.warn(`Recipe not found: ${title}`);
					continue;
				}
				recipeIds.push(recipeId as Id<'recipes'>);
			}

			if (recipeIds.length === 0) {
				console.warn(
					`Pairing with recipes [${pairing.recipeTitles.join(
						', '
					)}] has no valid recipes, skipping`
				);
				continue;
			}

			// Import pairing using the internal mutation
			const pairingId = await ctx.runMutation(
				internal.recipes.createPairing,
				{
					recipeIds: recipeIds,
				}
			);

			results.push({
				recipeTitles: pairing.recipeTitles,
				id: pairingId,
			});
		}

		return results;
	},
});
