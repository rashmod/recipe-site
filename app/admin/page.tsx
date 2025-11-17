'use client';

import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { RecipeForm } from './_components/RecipeForm';
import { RecipeList } from './_components/RecipeList';
import { UnusedItemsSection } from './_components/UnusedItemsSection';

export default function AdminPage() {
	const recipes = useQuery(api.recipes.list) ?? [];

	const adminSecret = useMemo(() => {
		return typeof window !== 'undefined'
			? localStorage.getItem('adminSecret') ?? ''
			: '';
	}, []);

	const addRecipe = useMutation(api.recipes.add);
	const updateRecipe = useMutation(api.recipes.update);
	const removeRecipe = useMutation(api.recipes.remove);
	const removeIngredient = useMutation(api.recipes.removeIngredient);
	const removeUnusedIngredients = useMutation(
		api.recipes.removeUnusedIngredients
	);
	const removeIngredientForm = useMutation(api.recipes.removeIngredientForm);
	const removeUnusedIngredientForms = useMutation(
		api.recipes.removeUnusedIngredientForms
	);
	const removeUnit = useMutation(api.recipes.removeUnit);
	const removeUnusedUnits = useMutation(api.recipes.removeUnusedUnits);

	const unusedIngredients = useQuery(api.recipes.listUnusedIngredients) ?? [];
	const unusedIngredientForms =
		useQuery(api.recipes.listUnusedIngredientForms) ?? [];
	const unusedUnits = useQuery(api.recipes.listUnusedUnits) ?? [];

	// Fetch all ingredients, units, and forms once for autocomplete
	const allIngredients = useQuery(api.recipes.listUniqueIngredients) ?? [];
	const allUnits = useQuery(api.recipes.listUniqueUnits) ?? [];
	const allForms = useQuery(api.recipes.listUniqueIngredientForms) ?? [];

	const [editingId, setEditingId] = useState<Id<'recipes'> | null>(null);
	const [editingRecipe, setEditingRecipe] = useState<
		| {
				title: string;
				ingredients: Array<{
					item: string;
					forms?: string[] | null;
					quantity?: { amount?: number | null; unit?: string | null };
				}>;
				instructions: string;
		  }
		| undefined
	>(undefined);

	const handleSubmit = async (data: {
		title: string;
		ingredients: Array<{
			item: string;
			forms?: string[];
			quantity?: { amount?: number; unit?: string };
		}>;
		instructions: string;
	}) => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}

		if (editingId) {
			await updateRecipe({
				id: editingId,
				...data,
				adminSecret,
			});
			alert('Recipe updated');
		} else {
			await addRecipe({
				...data,
				adminSecret,
			});
			alert('Recipe added');
		}
		setEditingId(null);
		setEditingRecipe(undefined);
	};

	const handleEdit = (recipe: {
		_id: Id<'recipes'>;
		title: string;
		ingredients:
			| Array<{
					item: string;
					forms?: string[] | null;
					quantity?: { amount?: number | null; unit?: string | null };
			  }>
			| undefined;
		instructions: string;
	}) => {
		setEditingId(recipe._id);
		setEditingRecipe({
			title: recipe.title,
			ingredients: Array.isArray(recipe.ingredients)
				? recipe.ingredients
				: [],
			instructions: recipe.instructions,
		});
	};

	const handleDelete = async (id: Id<'recipes'>) => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		const confirmed = window.confirm(
			'Are you sure you want to delete this recipe?'
		);
		if (!confirmed) {
			return;
		}
		await removeRecipe({ id, adminSecret });
	};

	const handleRemoveIngredient = async (id: Id<'ingredients'>) => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		const confirmed = window.confirm(
			'Are you sure you want to delete this ingredient? This action cannot be undone.'
		);
		if (!confirmed) {
			return;
		}
		try {
			await removeIngredient({ id, adminSecret });
		} catch (error) {
			alert(
				error instanceof Error
					? error.message
					: 'Failed to delete ingredient'
			);
		}
	};

	const handleRemoveIngredientForm = async (id: Id<'ingredientForm'>) => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		const confirmed = window.confirm(
			'Are you sure you want to delete this ingredient form? This action cannot be undone.'
		);
		if (!confirmed) {
			return;
		}
		try {
			await removeIngredientForm({ id, adminSecret });
		} catch (error) {
			alert(
				error instanceof Error
					? error.message
					: 'Failed to delete ingredient form'
			);
		}
	};

	const handleRemoveUnusedIngredientForms = async () => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		if (unusedIngredientForms.length === 0) {
			alert('No unused ingredient forms to remove.');
			return;
		}
		const confirmed = window.confirm(
			`Are you sure you want to delete ${
				unusedIngredientForms.length
			} unused ingredient form${
				unusedIngredientForms.length !== 1 ? 's' : ''
			}? This action cannot be undone.`
		);
		if (!confirmed) {
			return;
		}
		await removeUnusedIngredientForms({ adminSecret });
	};

	const handleRemoveUnit = async (id: Id<'units'>) => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		const confirmed = window.confirm(
			'Are you sure you want to delete this unit? This action cannot be undone.'
		);
		if (!confirmed) {
			return;
		}
		try {
			await removeUnit({ id, adminSecret });
		} catch (error) {
			alert(
				error instanceof Error ? error.message : 'Failed to delete unit'
			);
		}
	};

	const handleRemoveUnusedUnits = async () => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		if (unusedUnits.length === 0) {
			alert('No unused units to remove.');
			return;
		}
		const confirmed = window.confirm(
			`Are you sure you want to delete ${unusedUnits.length} unused unit${
				unusedUnits.length !== 1 ? 's' : ''
			}? This action cannot be undone.`
		);
		if (!confirmed) {
			return;
		}
		await removeUnusedUnits({ adminSecret });
	};

	const handleRemoveUnusedIngredients = async () => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		if (unusedIngredients.length === 0) {
			alert('No unused ingredients to remove.');
			return;
		}
		const confirmed = window.confirm(
			`Are you sure you want to delete ${
				unusedIngredients.length
			} unused ingredient${
				unusedIngredients.length !== 1 ? 's' : ''
			}? This action cannot be undone.`
		);
		if (!confirmed) {
			return;
		}
		await removeUnusedIngredients({ adminSecret });
	};

	return (
		<main className='flex flex-col gap-6 p-4 lg:p-6'>
			<header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<h1 className='text-2xl lg:text-3xl font-bold'>Admin</h1>
				<nav className='flex items-center gap-3 text-sm font-medium'>
					<Button variant='link' asChild className='p-0 h-auto'>
						<Link href='/'>View recipes</Link>
					</Button>
					<Button variant='link' asChild className='p-0 h-auto'>
						<Link href='/admin/login'>Admin login</Link>
					</Button>
				</nav>
			</header>

			<RecipeForm
				allIngredients={allIngredients}
				allUnits={allUnits}
				allForms={allForms}
				onSubmit={handleSubmit}
				editingId={editingId}
				initialData={editingRecipe}
			/>

			<section className='flex flex-col gap-4'>
				<h2 className='text-xl lg:text-2xl font-semibold'>
					Existing recipes
				</h2>
				<RecipeList
					recipes={recipes}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</section>

			<UnusedItemsSection
				title='Unused Ingredients'
				description='Ingredients that are not used in any recipe'
				items={unusedIngredients}
				onDeleteItem={(id) => {
					handleRemoveIngredient(id as Id<'ingredients'>);
				}}
				onDeleteAll={handleRemoveUnusedIngredients}
				getItemLabel={(item) => item.item ?? ''}
			/>

			<UnusedItemsSection
				title='Unused Ingredient Forms'
				description='Forms that are not used in any recipe'
				items={unusedIngredientForms}
				onDeleteItem={(id) => {
					handleRemoveIngredientForm(id as Id<'ingredientForm'>);
				}}
				onDeleteAll={handleRemoveUnusedIngredientForms}
				getItemLabel={(item) => item.form ?? ''}
			/>

			<UnusedItemsSection
				title='Unused Units'
				description='Units that are not used in any recipe'
				items={unusedUnits}
				onDeleteItem={(id) => {
					handleRemoveUnit(id as Id<'units'>);
				}}
				onDeleteAll={handleRemoveUnusedUnits}
				getItemLabel={(item) => item.unit ?? ''}
			/>
		</main>
	);
}
