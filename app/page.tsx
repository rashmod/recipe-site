'use client';

import Link from 'next/link';
import { api } from '../convex/_generated/api';
import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';

export default function Home() {
	const allRecipesQuery = useQuery(api.recipes.list);
	const uniqueIngredientsQuery = useQuery(api.recipes.listUniqueIngredients);
	const [selectedIngredients, setSelectedIngredients] = useState<string[]>(
		[]
	);
	const [searchQuery, setSearchQuery] = useState('');

	// Filter ingredients based on search query
	const filteredIngredients = useMemo(() => {
		const uniqueIngredients = uniqueIngredientsQuery ?? [];
		if (!searchQuery.trim()) {
			return uniqueIngredients;
		}
		const query = searchQuery.toLowerCase();
		return uniqueIngredients.filter((ingredient) =>
			ingredient.toLowerCase().includes(query)
		);
	}, [uniqueIngredientsQuery, searchQuery]);

	// Filter recipes based on selected ingredients
	const recipes = useMemo(() => {
		const allRecipes = allRecipesQuery ?? [];
		if (selectedIngredients.length === 0) {
			return allRecipes;
		}
		return allRecipes.filter((recipe) => {
			const recipeIngredientNames = recipe.ingredients.map(
				(ing) => ing.item
			);
			return selectedIngredients.every((selected) =>
				recipeIngredientNames.includes(selected)
			);
		});
	}, [allRecipesQuery, selectedIngredients]);

	const toggleIngredient = (ingredient: string) => {
		setSelectedIngredients((prev) =>
			prev.includes(ingredient)
				? prev.filter((ing) => ing !== ingredient)
				: [...prev, ingredient]
		);
	};

	const clearFilters = () => {
		setSelectedIngredients([]);
		setSearchQuery('');
	};

	return (
		<div className='flex min-h-screen bg-gray-50'>
			{/* Left Sidebar */}
			<aside className='w-80 border-r border-gray-200 bg-white p-6 overflow-y-auto sticky top-0 h-screen'>
				<div className='flex items-center justify-between mb-4'>
					<h2 className='text-lg font-semibold text-gray-900'>
						Filter Ingredients
					</h2>
					{selectedIngredients.length > 0 && (
						<button
							onClick={clearFilters}
							className='text-xs text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline'>
							Clear
						</button>
					)}
				</div>

				{/* Search Input */}
				<div className='mb-4'>
					<input
						type='text'
						placeholder='Search ingredients...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
				</div>

				{/* Selected Count */}
				{selectedIngredients.length > 0 && (
					<div className='mb-3 text-sm text-gray-600'>
						{selectedIngredients.length} selected
					</div>
				)}

				{/* Ingredients List */}
				<div className='space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto'>
					{filteredIngredients.length > 0 ? (
						filteredIngredients.map((ingredient) => {
							const isSelected =
								selectedIngredients.includes(ingredient);
							return (
								<label
									key={ingredient}
									className='flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer group'>
									<input
										type='checkbox'
										checked={isSelected}
										onChange={() =>
											toggleIngredient(ingredient)
										}
										className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
									/>
									<span
										className={`ml-3 text-sm ${
											isSelected
												? 'text-blue-600 font-medium'
												: 'text-gray-700'
										}`}>
										{ingredient}
									</span>
								</label>
							);
						})
					) : (
						<p className='text-sm text-gray-500 py-4'>
							{searchQuery
								? 'No ingredients found'
								: 'No ingredients available'}
						</p>
					)}
				</div>
			</aside>

			{/* Main Content */}
			<main className='flex-1 flex flex-col'>
				<header className='border-b border-gray-200 bg-white px-6 py-4'>
					<div className='flex items-center justify-between'>
						<div>
							<h1 className='text-2xl font-bold text-gray-900'>
								Recipes
							</h1>
							{selectedIngredients.length > 0 && (
								<p className='mt-1 text-sm text-gray-600'>
									Showing {recipes.length} recipe
									{recipes.length !== 1 ? 's' : ''} with
									selected ingredients
								</p>
							)}
						</div>
						<nav className='flex items-center gap-3 text-sm font-medium'>
							<Link
								className='text-blue-600 underline-offset-2 hover:underline'
								href='/admin/login'>
								Admin login
							</Link>
							<Link
								className='text-blue-600 underline-offset-2 hover:underline'
								href='/admin'>
								Admin panel
							</Link>
						</nav>
					</div>
				</header>

				<div className='flex-1 overflow-y-auto p-6'>
					{/* Recipes List */}
					{recipes.length === 0 ? (
						<div className='rounded-lg border border-gray-200 bg-white p-8 text-center'>
							<p className='text-gray-600'>
								{selectedIngredients.length > 0
									? 'No recipes found with the selected ingredients.'
									: 'No recipes available.'}
							</p>
						</div>
					) : (
						<div className='flex flex-col gap-6'>
							{recipes.map((recipe) => {
								const ingredientItems = Array.isArray(
									recipe.ingredients
								)
									? recipe.ingredients
									: [];
								const instructionSteps = recipe.instructions
									.split('\n')
									.map((line) => line.trim())
									.filter(Boolean);
								return (
									<article
										key={recipe._id}
										className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
										<h2 className='text-2xl font-semibold text-gray-900'>
											{recipe.title}
										</h2>
										{ingredientItems.length > 0 && (
											<section className='mt-4'>
												<h3 className='text-lg font-medium text-gray-800'>
													Ingredients
												</h3>
												<ul className='mt-2 list-disc pl-5 text-gray-700'>
													{ingredientItems.map(
														(ingredient, index) => {
															const amount =
																ingredient
																	.quantity
																	?.amount ??
																undefined;
															const unit =
																ingredient.quantity?.unit?.trim() ??
																'';
															const hasAmount =
																typeof amount ===
																'number';
															const formattedAmount =
																hasAmount &&
																Number.isFinite(
																	amount
																)
																	? Number.isInteger(
																			amount
																	  )
																		? String(
																				amount
																		  )
																		: Number(
																				amount.toFixed(
																					2
																				)
																		  )
																				.toString()
																				.replace(
																					/\.?0+$/,
																					''
																				)
																	: '';
															const quantityText =
																[
																	formattedAmount,
																	unit,
																]
																	.filter(
																		(
																			value
																		) =>
																			value &&
																			value.length >
																				0
																	)
																	.join(' ');

															const formsText =
																ingredient.forms &&
																ingredient.forms
																	.length > 0
																	? ` (${ingredient.forms.join(
																			', '
																	  )})`
																	: '';

															return (
																<li
																	key={`${ingredient.item}-${quantityText}-${index}`}>
																	{quantityText.length >
																		0 && (
																		<span className='font-medium text-gray-900'>
																			{
																				quantityText
																			}
																		</span>
																	)}
																	{quantityText.length >
																		0 &&
																	ingredient.item
																		? ' — '
																		: ' '}
																	<span>
																		{
																			ingredient.item
																		}
																		{formsText && (
																			<span className='text-gray-500 italic'>
																				{
																					formsText
																				}
																			</span>
																		)}
																	</span>
																</li>
															);
														}
													)}
												</ul>
											</section>
										)}
										{instructionSteps.length > 0 && (
											<section className='mt-4'>
												<h3 className='text-lg font-medium text-gray-800'>
													Instructions
												</h3>
												<ol className='mt-2 list-decimal pl-5 text-gray-700'>
													{instructionSteps.map(
														(step) => (
															<li key={step}>
																{step}
															</li>
														)
													)}
												</ol>
											</section>
										)}
									</article>
								);
							})}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
