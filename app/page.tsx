'use client';

import Link from 'next/link';
import { api } from '../convex/_generated/api';
import { useQuery } from 'convex/react';

export default function Home() {
	const recipes = useQuery(api.recipes.list) ?? [];
	return (
		<main className='flex flex-col gap-6 p-6'>
			<header className='flex items-center justify-between'>
				<h1 className='text-3xl font-bold text-gray-900'>Recipes</h1>
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
			</header>
			{recipes.map((recipe) => {
				const ingredientItems = Array.isArray(recipe.ingredients)
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
										(ingredient, index) => (
											<li
												key={`${ingredient.item}-${ingredient.quantity}-${index}`}>
												<span className='font-medium text-gray-900'>
													{ingredient.quantity}
												</span>
												{ingredient.quantity &&
												ingredient.item
													? ' — '
													: ' '}
												<span>{ingredient.item}</span>
											</li>
										)
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
									{instructionSteps.map((step) => (
										<li key={step}>{step}</li>
									))}
								</ol>
							</section>
						)}
					</article>
				);
			})}
		</main>
	);
}
