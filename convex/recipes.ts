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
		forms: v.optional(v.array(v.string())), // Array of form names (strings)
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

// Helper function to get or create an ingredient form by name
async function getOrCreateIngredientForm(
	ctx: MutationCtx,
	formName: string
): Promise<Id<'ingredientForm'>> {
	const trimmedName = formName.trim();
	if (!trimmedName) {
		throw new Error('Form name cannot be empty');
	}

	// Try to find existing form
	const existing = await ctx.db
		.query('ingredientForm')
		.filter((q) => q.eq(q.field('form'), trimmedName))
		.first();

	if (existing) {
		return existing._id;
	}

	// Create new form
	return await ctx.db.insert('ingredientForm', { form: trimmedName });
}

// Helper function to get or create a unit by name
async function getOrCreateUnit(
	ctx: MutationCtx,
	unitName: string
): Promise<Id<'units'>> {
	const trimmedName = unitName.trim();
	if (!trimmedName) {
		throw new Error('Unit name cannot be empty');
	}

	// Try to find existing unit
	const existing = await ctx.db
		.query('units')
		.filter((q) => q.eq(q.field('unit'), trimmedName))
		.first();

	if (existing) {
		return existing._id;
	}

	// Create new unit
	return await ctx.db.insert('units', { unit: trimmedName });
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
						const forms = ing.forms
							? await Promise.all(
									ing.forms.map(async (formId) => {
										const form = await ctx.db.get(formId);
										return form?.form ?? 'Unknown';
									})
							  )
							: undefined;
						const unit = ing.quantity?.unit
							? (await ctx.db.get(ing.quantity.unit))?.unit ??
							  null
							: null;
						return {
							item: ingredient?.item ?? 'Unknown',
							forms: forms,
							quantity: ing.quantity
								? {
										amount: ing.quantity.amount,
										unit: unit,
								  }
								: undefined,
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

export const listUniqueUnits = query({
	args: {},
	handler: async (ctx) => {
		const allUnits = await ctx.db.query('units').collect();
		return allUnits.map((unit) => unit.unit).sort();
	},
});

export const listUniqueIngredientForms = query({
	args: {},
	handler: async (ctx) => {
		const allForms = await ctx.db.query('ingredientForm').collect();
		return allForms.map((form) => form.form).sort();
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
						const forms = ing.forms
							? await Promise.all(
									ing.forms.map(async (formId) => {
										const form = await ctx.db.get(formId);
										return form?.form ?? 'Unknown';
									})
							  )
							: undefined;
						const unit = ing.quantity?.unit
							? (await ctx.db.get(ing.quantity.unit))?.unit ??
							  null
							: null;
						return {
							item: ingEntity?.item ?? 'Unknown',
							forms: forms,
							quantity: ing.quantity
								? {
										amount: ing.quantity.amount,
										unit: unit,
								  }
								: undefined,
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
				const formIds = ing.forms
					? await Promise.all(
							ing.forms.map((formName) =>
								getOrCreateIngredientForm(ctx, formName)
							)
					  )
					: undefined;
				const unitId = ing.quantity?.unit
					? await getOrCreateUnit(ctx, ing.quantity.unit)
					: undefined;
				return {
					item: ingredientId,
					forms: formIds,
					quantity: ing.quantity
						? {
								amount: ing.quantity.amount,
								unit: unitId,
						  }
						: undefined,
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
					const formIds = ing.forms
						? await Promise.all(
								ing.forms.map((formName) =>
									getOrCreateIngredientForm(ctx, formName)
								)
						  )
						: undefined;
					const unitId = ing.quantity?.unit
						? await getOrCreateUnit(ctx, ing.quantity.unit)
						: undefined;
					return {
						item: ingredientId,
						forms: formIds,
						quantity: ing.quantity
							? {
									amount: ing.quantity.amount,
									unit: unitId,
							  }
							: undefined,
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

// Query to find unused ingredient forms
export const listUnusedIngredientForms = query({
	args: {},
	handler: async (ctx) => {
		// Get all forms
		const allForms = await ctx.db.query('ingredientForm').collect();

		// Get all recipes and collect all form IDs that are used
		const allRecipes = await ctx.db.query('recipes').collect();
		const usedFormIds = new Set<Id<'ingredientForm'>>();
		for (const recipe of allRecipes) {
			for (const ing of recipe.ingredients) {
				if (ing.forms) {
					for (const formId of ing.forms) {
						usedFormIds.add(formId);
					}
				}
			}
		}

		// Filter out forms that are used
		const unusedForms = allForms.filter(
			(form) => !usedFormIds.has(form._id)
		);

		return unusedForms.map((form) => ({
			_id: form._id,
			form: form.form,
		}));
	},
});

// Mutation to delete a single ingredient form
export const removeIngredientForm = mutation({
	args: {
		id: v.id('ingredientForm'),
		adminSecret: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		requireAdmin(ctx, args.adminSecret ?? null);

		// Check if form is used in any recipe
		const allRecipes = await ctx.db.query('recipes').collect();
		const isUsed = allRecipes.some((recipe) =>
			recipe.ingredients.some(
				(ing) => ing.forms && ing.forms.includes(args.id)
			)
		);

		if (isUsed) {
			throw new Error('Cannot delete form that is used in recipes');
		}

		await ctx.db.delete(args.id);
	},
});

// Mutation to delete unused ingredient forms
export const removeUnusedIngredientForms = mutation({
	args: { adminSecret: v.optional(v.string()) },
	handler: async (ctx, args) => {
		requireAdmin(ctx, args.adminSecret ?? null);

		// Get all forms
		const allForms = await ctx.db.query('ingredientForm').collect();

		// Get all recipes and collect all form IDs that are used
		const allRecipes = await ctx.db.query('recipes').collect();
		const usedFormIds = new Set<Id<'ingredientForm'>>();
		for (const recipe of allRecipes) {
			for (const ing of recipe.ingredients) {
				if (ing.forms) {
					for (const formId of ing.forms) {
						usedFormIds.add(formId);
					}
				}
			}
		}

		// Find and delete unused forms
		const unusedForms = allForms.filter(
			(form) => !usedFormIds.has(form._id)
		);

		let deletedCount = 0;
		for (const form of unusedForms) {
			await ctx.db.delete(form._id);
			deletedCount++;
		}

		return { deletedCount };
	},
});

// Query to find unused units
export const listUnusedUnits = query({
	args: {},
	handler: async (ctx) => {
		// Get all units
		const allUnits = await ctx.db.query('units').collect();

		// Get all recipes and collect all unit IDs that are used
		const allRecipes = await ctx.db.query('recipes').collect();
		const usedUnitIds = new Set<Id<'units'>>();
		for (const recipe of allRecipes) {
			for (const ing of recipe.ingredients) {
				if (ing.quantity?.unit) {
					usedUnitIds.add(ing.quantity.unit);
				}
			}
		}

		// Filter out units that are used
		const unusedUnits = allUnits.filter(
			(unit) => !usedUnitIds.has(unit._id)
		);

		return unusedUnits.map((unit) => ({
			_id: unit._id,
			unit: unit.unit,
		}));
	},
});

// Mutation to delete a single unit
export const removeUnit = mutation({
	args: {
		id: v.id('units'),
		adminSecret: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		requireAdmin(ctx, args.adminSecret ?? null);

		// Check if unit is used in any recipe
		const allRecipes = await ctx.db.query('recipes').collect();
		const isUsed = allRecipes.some((recipe) =>
			recipe.ingredients.some((ing) => ing.quantity?.unit === args.id)
		);

		if (isUsed) {
			throw new Error('Cannot delete unit that is used in recipes');
		}

		await ctx.db.delete(args.id);
	},
});

// Mutation to delete unused units
export const removeUnusedUnits = mutation({
	args: { adminSecret: v.optional(v.string()) },
	handler: async (ctx, args) => {
		requireAdmin(ctx, args.adminSecret ?? null);

		// Get all units
		const allUnits = await ctx.db.query('units').collect();

		// Get all recipes and collect all unit IDs that are used
		const allRecipes = await ctx.db.query('recipes').collect();
		const usedUnitIds = new Set<Id<'units'>>();
		for (const recipe of allRecipes) {
			for (const ing of recipe.ingredients) {
				if (ing.quantity?.unit) {
					usedUnitIds.add(ing.quantity.unit);
				}
			}
		}

		// Find and delete unused units
		const unusedUnits = allUnits.filter(
			(unit) => !usedUnitIds.has(unit._id)
		);

		let deletedCount = 0;
		for (const unit of unusedUnits) {
			await ctx.db.delete(unit._id);
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

export const findIngredientFormByName = internalQuery({
	args: { form: v.string() },
	handler: async (ctx, args) => {
		const ingredientForm = await ctx.db
			.query('ingredientForm')
			.filter((q) => q.eq(q.field('form'), args.form.trim()))
			.first();
		return ingredientForm?._id;
	},
});

export const createIngredientForm = internalMutation({
	args: { form: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db.insert('ingredientForm', {
			form: args.form.trim(),
		});
	},
});

export const createRecipe = internalMutation({
	args: {
		title: v.string(),
		ingredients: v.array(
			v.object({
				item: v.id('ingredients'),
				forms: v.optional(v.array(v.id('ingredientForm'))),
				quantity: v.optional(
					v.object({
						amount: v.optional(v.number()),
						unit: v.optional(v.id('units')),
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

// Internal mutations for clearing database (for seeding)
export const deleteAllRecipes = internalMutation({
	args: {},
	handler: async (ctx) => {
		const recipes = await ctx.db.query('recipes').collect();
		for (const recipe of recipes) {
			await ctx.db.delete(recipe._id);
		}
		return { deletedCount: recipes.length };
	},
});

export const deleteAllIngredients = internalMutation({
	args: {},
	handler: async (ctx) => {
		const ingredients = await ctx.db.query('ingredients').collect();
		for (const ingredient of ingredients) {
			await ctx.db.delete(ingredient._id);
		}
		return { deletedCount: ingredients.length };
	},
});

export const deleteAllIngredientForms = internalMutation({
	args: {},
	handler: async (ctx) => {
		const forms = await ctx.db.query('ingredientForm').collect();
		for (const form of forms) {
			await ctx.db.delete(form._id);
		}
		return { deletedCount: forms.length };
	},
});

export const deleteAllUnits = internalMutation({
	args: {},
	handler: async (ctx) => {
		const units = await ctx.db.query('units').collect();
		for (const unit of units) {
			await ctx.db.delete(unit._id);
		}
		return { deletedCount: units.length };
	},
});

export const findUnitByName = internalQuery({
	args: { unit: v.string() },
	handler: async (ctx, args) => {
		const unit = await ctx.db
			.query('units')
			.filter((q) => q.eq(q.field('unit'), args.unit.trim()))
			.first();
		return unit?._id;
	},
});

export const createUnit = internalMutation({
	args: { unit: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db.insert('units', { unit: args.unit.trim() });
	},
});
