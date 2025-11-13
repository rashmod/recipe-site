'use client';

import Link from 'next/link';
import { api } from '../convex/_generated/api';
import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import { Filter, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

function FilterSidebar({
	uniqueIngredients,
	selectedIngredients,
	searchQuery,
	onSearchChange,
	onToggleIngredient,
	onClearFilters,
}: {
	uniqueIngredients: string[];
	selectedIngredients: string[];
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onToggleIngredient: (ingredient: string) => void;
	onClearFilters: () => void;
}) {
	const filteredIngredients = useMemo(() => {
		if (!searchQuery.trim()) {
			return uniqueIngredients;
		}
		const query = searchQuery.toLowerCase();
		return uniqueIngredients.filter((ingredient) =>
			ingredient.toLowerCase().includes(query)
		);
	}, [uniqueIngredients, searchQuery]);

	return (
		<div className='flex h-full flex-col'>
			<div className='flex items-center justify-between p-4 lg:p-6'>
				<h2 className='text-lg font-semibold'>Filter Ingredients</h2>
				{selectedIngredients.length > 0 && (
					<Button
						variant='ghost'
						size='sm'
						onClick={onClearFilters}
						className='text-xs'>
						Clear
					</Button>
				)}
			</div>

			<div className='px-4 lg:px-6 pb-4'>
				<Input
					type='text'
					placeholder='Search ingredients...'
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
			</div>

			{selectedIngredients.length > 0 && (
				<div className='px-4 lg:px-6 pb-3'>
					<div className='text-sm text-muted-foreground'>
						{selectedIngredients.length} selected
					</div>
				</div>
			)}

			<ScrollArea className='flex-1 px-4 lg:px-6'>
				<div className='space-y-1 pb-4'>
					{filteredIngredients.length > 0 ? (
						filteredIngredients.map((ingredient) => {
							const isSelected =
								selectedIngredients.includes(ingredient);
							return (
								<label
									key={ingredient}
									className='flex items-center gap-3 rounded-md p-2 hover:bg-accent cursor-pointer'>
									<Checkbox
										checked={isSelected}
										onCheckedChange={() =>
											onToggleIngredient(ingredient)
										}
									/>
									<span
										className={`text-sm ${
											isSelected
												? 'font-medium text-primary'
												: 'text-foreground'
										}`}>
										{ingredient}
									</span>
								</label>
							);
						})
					) : (
						<p className='text-sm text-muted-foreground py-4'>
							{searchQuery
								? 'No ingredients found'
								: 'No ingredients available'}
						</p>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

export default function Home() {
	const allRecipesQuery = useQuery(api.recipes.list);
	const uniqueIngredientsQuery = useQuery(api.recipes.listUniqueIngredients);
	const [selectedIngredients, setSelectedIngredients] = useState<string[]>(
		[]
	);
	const [searchQuery, setSearchQuery] = useState('');

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

	const uniqueIngredients = uniqueIngredientsQuery ?? [];

	return (
		<div className='flex min-h-screen bg-background'>
			{/* Mobile Sheet Sidebar */}
			<Sheet>
				<SheetTrigger asChild>
					<Button
						variant='ghost'
						size='icon'
						className='lg:hidden fixed top-4 left-4 z-10'>
						<Filter className='h-5 w-5' />
						<span className='sr-only'>Open filters</span>
					</Button>
				</SheetTrigger>
				<SheetContent
					side='left'
					className='w-[320px] sm:w-[380px] p-0'>
					<SheetHeader className='sr-only'>
						<SheetTitle>Filter Ingredients</SheetTitle>
					</SheetHeader>
					<FilterSidebar
						uniqueIngredients={uniqueIngredients}
						selectedIngredients={selectedIngredients}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						onToggleIngredient={toggleIngredient}
						onClearFilters={clearFilters}
					/>
				</SheetContent>
			</Sheet>

			{/* Desktop Fixed Sidebar */}
			<aside className='hidden lg:block w-80 border-r bg-card sticky top-0 h-screen'>
				<FilterSidebar
					uniqueIngredients={uniqueIngredients}
					selectedIngredients={selectedIngredients}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onToggleIngredient={toggleIngredient}
					onClearFilters={clearFilters}
				/>
			</aside>

			{/* Main Content */}
			<main className='flex-1 flex flex-col min-w-0'>
				<header className='border-b bg-card px-4 py-4 lg:px-6'>
					<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<h1 className='text-2xl font-bold'>Recipes</h1>
							{selectedIngredients.length > 0 && (
								<p className='mt-1 text-sm text-muted-foreground'>
									Showing {recipes.length} recipe
									{recipes.length !== 1 ? 's' : ''} with
									selected ingredients
								</p>
							)}
						</div>
						<nav className='flex items-center gap-3 text-sm font-medium'>
							<Button
								variant='link'
								asChild
								className='p-0 h-auto'>
								<Link href='/admin/login'>Admin login</Link>
							</Button>
							<Button
								variant='link'
								asChild
								className='p-0 h-auto'>
								<Link href='/admin'>Admin panel</Link>
							</Button>
						</nav>
					</div>

					{/* Selected Ingredients Badges - Mobile */}
					{selectedIngredients.length > 0 && (
						<div className='mt-3 flex flex-wrap gap-2'>
							{selectedIngredients.map((ingredient) => (
								<Badge
									key={ingredient}
									variant='secondary'
									className='text-xs'>
									{ingredient}
								</Badge>
							))}
						</div>
					)}
				</header>

				<div className='flex-1 overflow-y-auto p-4 lg:p-6'>
					{recipes.length === 0 ? (
						<Card>
							<CardContent className='py-8 text-center'>
								<p className='text-muted-foreground'>
									{selectedIngredients.length > 0
										? 'No recipes found with the selected ingredients.'
										: 'No recipes available.'}
								</p>
							</CardContent>
						</Card>
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
									<Card key={recipe._id}>
										<CardHeader>
											<CardTitle className='text-2xl'>
												{recipe.title}
											</CardTitle>
										</CardHeader>
										<CardContent className='space-y-4'>
											{ingredientItems.length > 0 && (
												<section>
													<h3 className='text-lg font-medium mb-2'>
														Ingredients
													</h3>
													<ul className='list-disc pl-5 space-y-1 text-sm'>
														{ingredientItems.map(
															(
																ingredient,
																index
															) => {
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
																		.join(
																			' '
																		);

																const formsText =
																	ingredient.forms &&
																	ingredient
																		.forms
																		.length >
																		0
																		? ` (${ingredient.forms.join(
																				', '
																		  )})`
																		: '';

																return (
																	<li
																		key={`${ingredient.item}-${quantityText}-${index}`}>
																		{quantityText.length >
																			0 && (
																			<span className='font-medium'>
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
																				<span className='text-muted-foreground italic'>
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
												<>
													<Separator />
													<section>
														<h3 className='text-lg font-medium mb-2'>
															Instructions
														</h3>
														<ol className='list-decimal pl-5 space-y-1 text-sm'>
															{instructionSteps.map(
																(step) => (
																	<li
																		key={
																			step
																		}>
																		{step}
																	</li>
																)
															)}
														</ol>
													</section>
												</>
											)}
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
