'use client';

import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

export default function AdminPage() {
	const recipes = useQuery(api.recipes.list) ?? [];

	const adminSecret = useMemo(
		() => localStorage.getItem('adminSecret') ?? '',
		[]
	);

	const addRecipe = useMutation(api.recipes.add);
	const updateRecipe = useMutation(api.recipes.update);
	const removeRecipe = useMutation(api.recipes.remove);

	const [title, setTitle] = useState('');
	const [ingredients, setIngredients] = useState('');
	const [instructions, setInstructions] = useState('');
	const [editingId, setEditingId] = useState<Id<'recipes'> | null>(null);

	const isEditing = useMemo(() => editingId !== null, [editingId]);

	const resetForm = () => {
		setTitle('');
		setIngredients('');
		setInstructions('');
		setEditingId(null);
	};

	const apiPayload = {
		title,
		ingredients,
		instructions,
	};

	const submit = async () => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		if (isEditing && editingId) {
			await updateRecipe({
				id: editingId,
				...apiPayload,
				adminSecret,
			});
			alert('Recipe updated');
		} else {
			await addRecipe({ ...apiPayload, adminSecret });
			alert('Recipe added');
		}
		resetForm();
	};

	const handleEdit = (recipe: {
		_id: Id<'recipes'>;
		title: string;
		ingredients: string;
		instructions: string;
	}) => {
		setEditingId(recipe._id);
		setTitle(recipe.title);
		setIngredients(recipe.ingredients);
		setInstructions(recipe.instructions);
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

	return (
		<main className='flex flex-col gap-6 p-6'>
			<header className='flex items-center justify-between'>
				<h1 className='text-3xl font-bold text-gray-900'>Admin</h1>
				<nav className='flex items-center gap-3 text-sm font-medium'>
					<Link
						className='text-blue-600 underline-offset-2 hover:underline'
						href='/'>
						View recipes
					</Link>
					<Link
						className='text-blue-600 underline-offset-2 hover:underline'
						href='/admin/login'>
						Admin login
					</Link>
				</nav>
			</header>
			<section className='flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium text-gray-800'>
						Title
					</label>
					<input
						className='rounded border border-gray-300 p-2'
						placeholder='Title'
						value={title}
						onChange={(event) => setTitle(event.target.value)}
					/>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium text-gray-800'>
						Ingredients
					</label>
					<textarea
						className='rounded border border-gray-300 p-2'
						placeholder='Ingredients'
						rows={4}
						value={ingredients}
						onChange={(event) => setIngredients(event.target.value)}
					/>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium text-gray-800'>
						Instructions
					</label>
					<textarea
						className='rounded border border-gray-300 p-2'
						placeholder='Instructions'
						rows={6}
						value={instructions}
						onChange={(event) =>
							setInstructions(event.target.value)
						}
					/>
				</div>
				<div className='flex items-center gap-2'>
					<button
						className='rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700'
						onClick={submit}>
						{isEditing ? 'Update recipe' : 'Add recipe'}
					</button>
					{isEditing && (
						<button
							className='rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
							onClick={resetForm}>
							Cancel
						</button>
					)}
				</div>
			</section>
			<section className='flex flex-col gap-4'>
				<h2 className='text-2xl font-semibold text-gray-900'>
					Existing recipes
				</h2>
				{recipes.length === 0 ? (
					<p className='text-sm text-gray-600'>No recipes yet.</p>
				) : (
					<ul className='flex flex-col gap-4'>
						{recipes.map((recipe) => (
							<li
								key={recipe._id}
								className='flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-medium text-gray-900'>
										{recipe.title}
									</h3>
									<div className='flex items-center gap-2'>
										<button
											className='rounded border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50'
											onClick={() => handleEdit(recipe)}>
											Edit
										</button>
										<button
											className='rounded border border-red-600 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50'
											onClick={() =>
												handleDelete(recipe._id)
											}>
											Delete
										</button>
									</div>
								</div>
								<div className='text-sm text-gray-600'>
									<strong>Ingredients:</strong>
									<p className='whitespace-pre-line'>
										{recipe.ingredients}
									</p>
								</div>
								<div className='text-sm text-gray-600'>
									<strong>Instructions:</strong>
									<p className='whitespace-pre-line'>
										{recipe.instructions}
									</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
}
