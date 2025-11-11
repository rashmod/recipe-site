'use client';

import Link from 'next/link';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '../../convex/_generated/api';

export default function AdminPage() {
	const [adminSecret, setAdminSecret] = useState(
		typeof window !== 'undefined'
			? (localStorage.getItem('adminSecret') ?? '')
			: '',
	);
	const saveSecret = () => localStorage.setItem('adminSecret', adminSecret);

	const addRecipe = useMutation(api.recipes.add);

	const [title, setTitle] = useState('');
	const [ingredients, setIngredients] = useState('');
	const [instructions, setInstructions] = useState('');

	const submit = async () => {
		await addRecipe({ title, ingredients, instructions, adminSecret });
		alert('Saved');
	};

	return (
		<main className='flex flex-col gap-6 p-6'>
			<header className='flex items-center justify-between'>
				<h1 className='text-3xl font-bold text-gray-900'>Admin</h1>
				<Link
					className='text-sm font-medium text-blue-600 underline-offset-2 hover:underline'
					href='/'>
					Back to recipes
				</Link>
			</header>
			<section className='flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium text-gray-800'>
						Admin password
					</label>
					<div className='flex items-center gap-2'>
						<input
							className='flex-1 rounded border border-gray-300 p-2'
							placeholder='Admin password'
							value={adminSecret}
							onChange={(e) => setAdminSecret(e.target.value)}
						/>
						<button
							className='rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700'
							onClick={saveSecret}>
							Use this password
						</button>
					</div>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium text-gray-800'>Title</label>
					<input
						className='rounded border border-gray-300 p-2'
						placeholder='Title'
						value={title}
						onChange={(e) => setTitle(e.target.value)}
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
						onChange={(e) => setIngredients(e.target.value)}
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
						onChange={(e) => setInstructions(e.target.value)}
					/>
				</div>
				<button
					className='self-start rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700'
					onClick={submit}>
					Add recipe
				</button>
			</section>
		</main>
	);
}
