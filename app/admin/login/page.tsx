'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
		<main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 lg:p-6">
			<nav className="mb-6 flex items-center gap-3 text-sm font-medium">
				<Button variant="link" asChild className="p-0 h-auto">
					<Link href="/">View recipes</Link>
				</Button>
				<Button variant="link" asChild className="p-0 h-auto">
					<Link href="/admin">Admin panel</Link>
				</Button>
			</nav>
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Admin Login</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div className="flex flex-col gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								placeholder="Enter admin password"
								required
							/>
						</div>
						<Button type="submit">Save password</Button>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
