'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_SECRET_KEY = 'adminSecret';

export default function AdminLoginPage() {
	const router = useRouter();
	const [password, setPassword] = useState<string>(() =>
		typeof window !== 'undefined'
			? localStorage.getItem(ADMIN_SECRET_KEY) ?? ''
			: ''
	);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		localStorage.setItem(ADMIN_SECRET_KEY, password);
		router.push('/admin');
	};

	return (
		<main className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6'>
			<nav className='mb-6 flex items-center gap-3 text-sm font-medium text-blue-600 underline-offset-2'>
				<Link className='hover:underline' href='/'>
					View recipes
				</Link>
				<Link className='hover:underline' href='/admin'>
					Admin panel
				</Link>
			</nav>
			<form
				className='flex w-full max-w-sm flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm'
				onSubmit={handleSubmit}>
				<h1 className='text-2xl font-semibold text-gray-900'>
					Admin Login
				</h1>
				<label className='flex flex-col gap-2 text-sm font-medium text-gray-800'>
					Password
					<input
						className='rounded border border-gray-300 p-2 text-base font-normal text-gray-900'
						type='password'
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						placeholder='Enter admin password'
						required
					/>
				</label>
				<button
					className='rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
					type='submit'>
					Save password
				</button>
				{status === 'saved' && (
					<p className='text-sm text-green-600'>
						Password saved locally.
					</p>
				)}
			</form>
		</main>
	);
}
