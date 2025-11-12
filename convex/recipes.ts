import { v } from 'convex/values';
import {
	mutation,
	query,
	internalMutation,
	internalQuery,
} from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireAdmin } from './_utils';

// Schema for input (from client) - item is a string name
const ingredientInputSchema = v.array(
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

// Helper function to get or create an ingredient by name
async function getOrCreateIngredient(
	ctx: MutationCtx,
	itemName: string
): Promise<Id<'ingredients'>> {
	const trimmedName = itemName.trim();
	if (!trimmedName) {
		throw new Error('Ingredient name cannot be empty');
	}

	// Try to find existing ingredient
	const existing = await ctx.db
		.query('ingredients')
		.filter((q) => q.eq(q.field('item'), trimmedName))
		.first();

	if (existing) {
		return existing._id;
	}

	// Create new ingredient
	return await ctx.db.insert('ingredients', { item: trimmedName });
}

export const list = query({
	args: {},
	handler: async (ctx) => {
		const recipes = await ctx.db.query('recipes').collect();

		// Populate ingredient details
		return await Promise.all(
			recipes.map(async (recipe) => {
				const populatedIngredients = await Promise.all(
					recipe.ingredients.map(async (ing) => {
						const ingredient = await ctx.db.get(ing.item);
						return {
							item: ingredient?.item ?? 'Unknown',
							quantity: ing.quantity,
						};
					})
				);
				return {
					...recipe,
					ingredients: populatedIngredients,
				};
			})
		);
	},
});

export const listUniqueIngredients = query({
	args: {},
	handler: async (ctx) => {
		const allIngredients = await ctx.db.query('ingredients').collect();
		return allIngredients.map((ing) => ing.item).sort();
	},
});

export const getRecipesByIngredient = query({
	args: { item: v.string() },
	handler: async (ctx, args) => {
		// Find the ingredient by name
		const ingredient = await ctx.db
			.query('ingredients')
			.filter((q) => q.eq(q.field('item'), args.item))
			.first();

		if (!ingredient) {
			return [];
		}

		// Find all recipes that reference this ingredient
		const allRecipes = await ctx.db.query('recipes').collect();
		const matchingRecipes = allRecipes.filter((recipe) =>
			recipe.ingredients.some((ing) => ing.item === ingredient._id)
		);

		// Populate ingredient details
		return await Promise.all(
			matchingRecipes.map(async (recipe) => {
				const populatedIngredients = await Promise.all(
					recipe.ingredients.map(async (ing) => {
						const ingEntity = await ctx.db.get(ing.item);
						return {
							item: ingEntity?.item ?? 'Unknown',
							quantity: ing.quantity,
						};
					})
				);
				return {
					...recipe,
					ingredients: populatedIngredients,
				};
			})
		);
	},
});

export const add = mutation({
	args: {
		title: v.string(),
		ingredients: ingredientInputSchema,
		instructions: v.string(),
		adminSecret: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { adminSecret, ingredients, ...recipeData } = args;
		requireAdmin(ctx, adminSecret ?? null);

		// Convert ingredient names to ingredient IDs
		const ingredientRefs = await Promise.all(
			ingredients.map(async (ing) => {
				const ingredientId = await getOrCreateIngredient(ctx, ing.item);
				return {
					item: ingredientId,
					quantity: ing.quantity,
				};
			})
		);

		// Insert recipe with ingredient references
		await ctx.db.insert('recipes', {
			...recipeData,
			ingredients: ingredientRefs,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id('recipes'),
		title: v.optional(v.string()),
		ingredients: v.optional(ingredientInputSchema),
		instructions: v.optional(v.string()),
		adminSecret: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, adminSecret, ingredients, ...updates } = args;
		requireAdmin(ctx, adminSecret ?? null);

		const fields: Record<string, unknown> = Object.fromEntries(
			Object.entries(updates).filter(([, value]) => value !== undefined)
		);

		// If ingredients are being updated, convert names to IDs
		if (ingredients !== undefined) {
			const ingredientRefs = await Promise.all(
				ingredients.map(async (ing) => {
					const ingredientId = await getOrCreateIngredient(
						ctx,
						ing.item
					);
					return {
						item: ingredientId,
						quantity: ing.quantity,
					};
				})
			);
			fields.ingredients = ingredientRefs;
		}

		if (Object.keys(fields).length > 0) {
			await ctx.db.patch(id, fields);
		}
	},
});

export const remove = mutation({
	args: { id: v.id('recipes'), adminSecret: v.optional(v.string()) },
	handler: async (ctx, args) => {
		requireAdmin(ctx, args.adminSecret ?? null);

		// Note: We don't delete ingredients when deleting a recipe
		// because ingredients are shared entities that may be used by other recipes
		// If you want to clean up unused ingredients, that would be a separate operation

		await ctx.db.delete(args.id);
	},
});

// Query to find unused ingredients
export const listUnusedIngredients = query({
	args: {},
	handler: async (ctx) => {
		// Get all ingredients
		const allIngredients = await ctx.db.query('ingredients').collect();

		// Get all recipes and collect all ingredient IDs that are used
		const allRecipes = await ctx.db.query('recipes').collect();
		const usedIngredientIds = new Set<Id<'ingredients'>>();
		for (const recipe of allRecipes) {
			for (const ing of recipe.ingredients) {
				usedIngredientIds.add(ing.item);
			}
		}

		// Filter out ingredients that are used
		const unusedIngredients = allIngredients.filter(
			(ing) => !usedIngredientIds.has(ing._id)
		);

		return unusedIngredients.map((ing) => ({
			_id: ing._id,
			item: ing.item,
		}));
	},
});

// Mutation to delete a single ingredient
export const removeIngredient = mutation({
	args: {
		id: v.id('ingredients'),
		adminSecret: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		requireAdmin(ctx, args.adminSecret ?? null);

		// Check if ingredient is used in any recipe
		const allRecipes = await ctx.db.query('recipes').collect();
		const isUsed = allRecipes.some((recipe) =>
			recipe.ingredients.some((ing) => ing.item === args.id)
		);

		if (isUsed) {
			throw new Error('Cannot delete ingredient that is used in recipes');
		}

		await ctx.db.delete(args.id);
	},
});

// Mutation to delete unused ingredients
export const removeUnusedIngredients = mutation({
	args: { adminSecret: v.optional(v.string()) },
	handler: async (ctx, args) => {
		requireAdmin(ctx, args.adminSecret ?? null);

		// Get all ingredients
		const allIngredients = await ctx.db.query('ingredients').collect();

		// Get all recipes and collect all ingredient IDs that are used
		const allRecipes = await ctx.db.query('recipes').collect();
		const usedIngredientIds = new Set<Id<'ingredients'>>();
		for (const recipe of allRecipes) {
			for (const ing of recipe.ingredients) {
				usedIngredientIds.add(ing.item);
			}
		}

		// Find and delete unused ingredients
		const unusedIngredients = allIngredients.filter(
			(ing) => !usedIngredientIds.has(ing._id)
		);

		let deletedCount = 0;
		for (const ingredient of unusedIngredients) {
			await ctx.db.delete(ingredient._id);
			deletedCount++;
		}

		return { deletedCount };
	},
});

// Internal functions for migration
export const findIngredientByName = internalQuery({
	args: { item: v.string() },
	handler: async (ctx, args) => {
		const ingredient = await ctx.db
			.query('ingredients')
			.filter((q) => q.eq(q.field('item'), args.item.trim()))
			.first();
		return ingredient?._id;
	},
});

export const createIngredient = internalMutation({
	args: { item: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db.insert('ingredients', { item: args.item.trim() });
	},
});

export const createRecipe = internalMutation({
	args: {
		title: v.string(),
		ingredients: v.array(
			v.object({
				item: v.id('ingredients'),
				quantity: v.optional(
					v.object({
						amount: v.optional(v.number()),
						unit: v.optional(v.string()),
					})
				),
			})
		),
		instructions: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('recipes', args);
	},
});
