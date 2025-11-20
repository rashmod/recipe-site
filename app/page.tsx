'use client';

import Link from 'next/link';
import { api } from '../convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import type { Id } from '../convex/_generated/dataModel';
import { useMemo, useState, useCallback } from 'react';
import { Filter } from 'lucide-react';
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

type SelectedForms = Record<string, string[]>;

function FilterSidebar({
	uniqueIngredients,
	selectedIngredients,
	selectedForms,
	ingredientFormsMap,
	searchQuery,
	onSearchChange,
	onToggleIngredient,
	onToggleForm,
	onClearFilters,
}: {
	uniqueIngredients: string[];
	selectedIngredients: string[];
	selectedForms: SelectedForms;
	ingredientFormsMap: Record<string, string[]>;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onToggleIngredient: (ingredient: string) => void;
	onToggleForm: (ingredient: string, form: string) => void;
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
							const formsForIngredient =
								ingredientFormsMap[ingredient] ?? [];
							const isFormFilterActive =
								(selectedForms[ingredient]?.length ?? 0) > 0;
							return (
								<div key={ingredient}>
									<label className='flex items-center gap-3 rounded-md p-2 hover:bg-accent cursor-pointer'>
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
											{isSelected &&
												isFormFilterActive &&
												' • form filter'}
										</span>
									</label>

									{isSelected &&
										formsForIngredient.length > 0 && (
											<div className='pl-10 pb-2'>
												<div className='text-xs text-muted-foreground mb-1'>
													Filter by form
												</div>
												<div className='space-y-1'>
													{formsForIngredient.map(
														(form) => {
															const isFormSelected =
																selectedForms[
																	ingredient
																]?.includes(
																	form
																) ?? false;
															return (
																<label
																	key={`${ingredient}-${form}`}
																	className='flex items-center gap-2 rounded-md py-1 px-2 hover:bg-muted cursor-pointer'>
																	<Checkbox
																		checked={
																			isFormSelected
																		}
																		onCheckedChange={() =>
																			onToggleForm(
																				ingredient,
																				form
																			)
																		}
																	/>
																	<span className='text-xs'>
																		{form}
																	</span>
																</label>
															);
														}
													)}
												</div>
											</div>
										)}
								</div>
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
	const [selectedForms, setSelectedForms] = useState<SelectedForms>({});
	const [searchQuery, setSearchQuery] = useState('');
	const [servings, setServings] = useState<number>(1);
	const [customQuantities, setCustomQuantities] = useState<
		Record<string, Record<number, number>>
	>({});
	const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
		new Set()
	);

	const savedPairingsQuery = useQuery(api.recipes.listPairings);
	const savePairingMutation = useMutation(api.recipes.savePairing);
	const deletePairingMutation = useMutation(api.recipes.deletePairing);

	const ingredientFormsMap = useMemo(() => {
		const map: Record<string, string[]> = {};
		const allRecipes = allRecipesQuery ?? [];
		for (const recipe of allRecipes) {
			const recipeIngredients = Array.isArray(recipe.ingredients)
				? recipe.ingredients
				: [];
			for (const ingredient of recipeIngredients) {
				if (!ingredient.item) {
					continue;
				}
				if (!map[ingredient.item]) {
					map[ingredient.item] = [];
				}
				for (const form of ingredient.forms ?? []) {
					if (!map[ingredient.item].includes(form)) {
						map[ingredient.item].push(form);
					}
				}
				map[ingredient.item].sort((a, b) =>
					a.localeCompare(b, undefined, { sensitivity: 'base' })
				);
			}
		}
		return map;
	}, [allRecipesQuery]);

	// Filter recipes based on selected ingredients and exclude paired recipes
	const recipes = useMemo(() => {
		const allRecipes = allRecipesQuery ?? [];
		let filtered = allRecipes;

		// Filter by ingredients if any are selected
		if (selectedIngredients.length > 0) {
			filtered = filtered.filter((recipe) => {
				const recipeIngredients = Array.isArray(recipe.ingredients)
					? recipe.ingredients
					: [];
				const recipeIngredientNames = recipeIngredients.map(
					(ing) => ing.item
				);
				return selectedIngredients.every((selected) => {
					if (!recipeIngredientNames.includes(selected)) {
						return false;
					}
					const requiredForms = selectedForms[selected] ?? [];
					if (requiredForms.length === 0) {
						return true;
					}
					const recipeIngredient = recipeIngredients.find(
						(ing) => ing.item === selected
					);
					const recipeForms = recipeIngredient?.forms ?? [];
					return requiredForms.every((form) =>
						recipeForms.includes(form)
					);
				});
			});
		}

		// Exclude paired recipes from main list
		return filtered.filter((recipe) => !selectedRecipes.has(recipe._id));
	}, [allRecipesQuery, selectedIngredients, selectedForms, selectedRecipes]);

	const toggleIngredient = (ingredient: string) => {
		setSelectedIngredients((prev) => {
			const exists = prev.includes(ingredient);
			if (exists) {
				setSelectedForms((prevForms) => {
					const rest = { ...prevForms };
					delete rest[ingredient];
					return rest;
				});
				return prev.filter((ing) => ing !== ingredient);
			}
			return [...prev, ingredient];
		});
	};

	const toggleForm = (ingredient: string, form: string) => {
		setSelectedForms((prev) => {
			const currentForms = prev[ingredient] ?? [];
			const exists = currentForms.includes(form);
			const nextForms = exists
				? currentForms.filter((f) => f !== form)
				: [...currentForms, form];
			if (nextForms.length === 0) {
				const rest = { ...prev };
				delete rest[ingredient];
				return rest;
			}
			return {
				...prev,
				[ingredient]: nextForms,
			};
		});
	};

	const clearFilters = () => {
		setSelectedIngredients([]);
		setSelectedForms({});
		setSearchQuery('');
	};

	const toggleRecipeSelection = (recipeId: string) => {
		setSelectedRecipes((prev) => {
			const next = new Set(prev);
			if (next.has(recipeId)) {
				next.delete(recipeId);
			} else {
				next.add(recipeId);
			}
			return next;
		});
	};

	const clearSelectedRecipes = () => {
		setSelectedRecipes(new Set());
	};

	const handleSavePairing = async () => {
		if (selectedRecipes.size === 0) {
			return;
		}

		try {
			await savePairingMutation({
				recipeIds: Array.from(selectedRecipes) as Id<'recipes'>[],
			});
		} catch (error) {
			console.error('Failed to save pairing:', error);
			alert('Failed to save pairing. Please try again.');
		}
	};

	const handleLoadPairing = (recipeIds: string[]) => {
		setSelectedRecipes(new Set(recipeIds));
	};

	const handleDeletePairing = async (id: string) => {
		if (
			!confirm(
				'Are you sure you want to delete this pairing? This action cannot be undone.'
			)
		) {
			return;
		}

		try {
			await deletePairingMutation({ id: id as Id<'recipePairings'> });
		} catch (error) {
			console.error('Failed to delete pairing:', error);
			alert('Failed to delete pairing. Please try again.');
		}
	};

	const uniqueIngredients = uniqueIngredientsQuery ?? [];

	const calculateTotalProtein = useCallback(
		(
			ingredients: Array<{
				core?: boolean;
				proteinPer100g?: number | null;
				quantity?: { amount?: number | null; unit?: string | null };
			}>,
			scaleFactor: number = 1
		): number | null => {
			let total = 0;
			let hasCoreIngredients = false;

			for (const ingredient of ingredients) {
				if (!ingredient.core) continue;

				hasCoreIngredients = true;
				const proteinPer100g = ingredient.proteinPer100g;
				const amount = ingredient.quantity?.amount;
				const unit =
					ingredient.quantity?.unit?.trim().toLowerCase() ?? '';

				// Only calculate if we have protein data, amount, and unit is gram
				if (
					typeof proteinPer100g === 'number' &&
					typeof amount === 'number' &&
					Number.isFinite(amount) &&
					Number.isFinite(proteinPer100g) &&
					(unit === 'gram' || unit === 'grams' || unit === 'g')
				) {
					total += ((amount * scaleFactor) / 100) * proteinPer100g;
				}
			}

			return hasCoreIngredients ? total : null;
		},
		[]
	);

	const formatAmount = (
		amount: number | null | undefined,
		scaleFactor: number = 1
	): string => {
		if (amount === undefined || amount === null) {
			return '';
		}
		if (!Number.isFinite(amount)) {
			return '';
		}
		const scaled = amount * scaleFactor;
		if (Number.isInteger(scaled)) {
			return String(scaled);
		}
		return Number(scaled.toFixed(2))
			.toString()
			.replace(/\.?0+$/, '');
	};

	// Get selected recipes for pairing
	const pairedRecipes = useMemo(() => {
		if (selectedRecipes.size === 0) {
			return [];
		}

		const allRecipes = allRecipesQuery ?? [];
		return allRecipes.filter((recipe) => selectedRecipes.has(recipe._id));
	}, [selectedRecipes, allRecipesQuery]);

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
						selectedForms={selectedForms}
						ingredientFormsMap={ingredientFormsMap}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						onToggleIngredient={toggleIngredient}
						onToggleForm={toggleForm}
						onClearFilters={clearFilters}
					/>
				</SheetContent>
			</Sheet>

			{/* Desktop Fixed Sidebar */}
			<aside className='hidden lg:block w-80 border-r bg-card sticky top-0 h-screen'>
				<FilterSidebar
					uniqueIngredients={uniqueIngredients}
					selectedIngredients={selectedIngredients}
					selectedForms={selectedForms}
					ingredientFormsMap={ingredientFormsMap}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onToggleIngredient={toggleIngredient}
					onToggleForm={toggleForm}
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
									{selectedForms[ingredient]?.length ? (
										<>
											{': '}
											{selectedForms[ingredient].join(
												', '
											)}
										</>
									) : null}
								</Badge>
							))}
						</div>
					)}
				</header>

				<div className='flex-1 overflow-y-auto p-4 lg:p-6'>
					{/* Saved Pairings Section */}
					{savedPairingsQuery && savedPairingsQuery.length > 0 && (
						<div className='mb-6'>
							<h2 className='text-xl font-semibold mb-4'>
								Saved Pairings
							</h2>
							<div className='flex flex-col gap-2'>
								{savedPairingsQuery.map((pairing) => (
									<Card key={pairing._id}>
										<CardContent className='p-4'>
											<div className='flex items-center justify-between'>
												<div className='flex-1'>
													<h3 className='font-medium'>
														{pairing.name}
													</h3>
													<p className='text-sm text-muted-foreground'>
														{
															pairing.recipeIds
																.length
														}{' '}
														{pairing.recipeIds
															.length === 1
															? 'recipe'
															: 'recipes'}
													</p>
												</div>
												<div className='flex items-center gap-2'>
													<Button
														variant='outline'
														size='sm'
														onClick={() =>
															handleLoadPairing(
																pairing.recipeIds.map(
																	(id) =>
																		id as string
																)
															)
														}>
														Load
													</Button>
													<Button
														variant='ghost'
														size='sm'
														onClick={() =>
															handleDeletePairing(
																pairing._id as string
															)
														}>
														Delete
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					)}

					{/* Paired Recipes Section */}
					{pairedRecipes.length > 0 && (
						<div className='mb-6'>
							<div className='flex items-center justify-between mb-4'>
								<h2 className='text-xl font-semibold'>
									Paired Recipes
								</h2>
								<div className='flex items-center gap-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={handleSavePairing}
										disabled={selectedRecipes.size === 0}>
										Save Pairing
									</Button>
									<Button
										variant='ghost'
										size='sm'
										onClick={clearSelectedRecipes}>
										Clear Pairing
									</Button>
								</div>
							</div>
							<div className='flex flex-col gap-6'>
								{pairedRecipes.map((recipe) => {
									const ingredientItems = Array.isArray(
										recipe.ingredients
									)
										? recipe.ingredients
										: [];

									const recipeCustomQuantities =
										customQuantities[recipe._id] ?? {};
									const hasCustomQuantity =
										Object.keys(recipeCustomQuantities)
											.length > 0;

									let customScaleFactor: number | null = null;
									if (hasCustomQuantity) {
										for (
											let i = 0;
											i < ingredientItems.length;
											i++
										) {
											const ingredient =
												ingredientItems[i];
											if (
												ingredient.core &&
												recipeCustomQuantities[i] !==
													undefined
											) {
												const originalAmount =
													ingredient.quantity?.amount;
												const customAmount =
													recipeCustomQuantities[i];
												if (
													typeof originalAmount ===
														'number' &&
													originalAmount > 0 &&
													customAmount > 0
												) {
													customScaleFactor =
														customAmount /
														originalAmount;
													break;
												}
											}
										}
									}

									const scaleFactor =
										customScaleFactor ?? servings;
									const totalProtein = calculateTotalProtein(
										ingredientItems,
										scaleFactor
									);
									const instructionSteps = recipe.instructions
										.split('\n')
										.map((line) => line.trim())
										.filter(Boolean);

									return (
										<Card
											key={recipe._id}
											className='border-primary border-2'>
											<CardHeader>
												<div>
													<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
														<div className='flex items-center gap-3'>
															<Checkbox
																checked={true}
																onCheckedChange={() =>
																	toggleRecipeSelection(
																		recipe._id
																	)
																}
																className='shrink-0'
															/>
															<CardTitle className='text-2xl'>
																{recipe.title}
															</CardTitle>
														</div>
														<div className='flex items-center gap-2'>
															<span className='text-sm text-muted-foreground whitespace-nowrap'>
																Servings:
															</span>
															<div className='flex gap-1'>
																{[
																	1, 2, 3, 4,
																	5, 6,
																].map((num) => (
																	<Button
																		key={
																			num
																		}
																		variant={
																			servings ===
																			num
																				? 'default'
																				: 'outline'
																		}
																		size='sm'
																		onClick={() => {
																			setServings(
																				num
																			);
																			setCustomQuantities(
																				{}
																			);
																		}}
																		className={`min-w-10 ${
																			hasCustomQuantity
																				? 'opacity-50 cursor-pointer'
																				: ''
																		}`}
																		title={
																			hasCustomQuantity
																				? 'Click to clear custom quantity and use serving size'
																				: undefined
																		}>
																		{num}
																	</Button>
																))}
															</div>
														</div>
													</div>
													{totalProtein !== null && (
														<p className='text-sm text-muted-foreground mt-1'>
															Total protein:{' '}
															{totalProtein.toFixed(
																1
															)}
															g
															<span className='text-xs ml-1'>
																(from core
																ingredients)
															</span>
														</p>
													)}
												</div>
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
																	const formattedAmount =
																		formatAmount(
																			amount,
																			scaleFactor
																		);
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

																	const customAmount =
																		recipeCustomQuantities[
																			index
																		];
																	const showCustomInput =
																		ingredient.core &&
																		typeof amount ===
																			'number';

																	return (
																		<li
																			key={`${recipe._id}-${index}-${ingredient.item}`}
																			className='space-y-1'>
																			<div className='flex items-start gap-2'>
																				<span className='flex-1'>
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
																						{ingredient.core && (
																							<span className='ml-1 text-xs font-semibold text-primary'>
																								(core)
																							</span>
																						)}
																						{formsText && (
																							<span className='text-muted-foreground italic'>
																								{
																									formsText
																								}
																							</span>
																						)}
																					</span>
																				</span>
																			</div>
																			{showCustomInput && (
																				<div className='flex items-center gap-2 pl-5'>
																					<label
																						htmlFor={`custom-${recipe._id}-${index}`}
																						className='text-xs text-muted-foreground whitespace-nowrap'>
																						Custom{' '}
																						{
																							unit
																						}

																						:
																					</label>
																					<Input
																						id={`custom-${recipe._id}-${index}`}
																						type='number'
																						min='0'
																						step='0.1'
																						value={
																							customAmount ??
																							''
																						}
																						onChange={(
																							e
																						) => {
																							const value =
																								parseFloat(
																									e
																										.target
																										.value
																								);
																							if (
																								!Number.isNaN(
																									value
																								) &&
																								value >
																									0
																							) {
																								setCustomQuantities(
																									(
																										prev
																									) => ({
																										...prev,
																										[recipe._id]:
																											{
																												[index]:
																													value,
																											},
																									})
																								);
																								setServings(
																									1
																								);
																							} else if (
																								e
																									.target
																									.value ===
																								''
																							) {
																								setCustomQuantities(
																									(
																										prev
																									) => {
																										const next =
																											{
																												...prev,
																											};
																										if (
																											next[
																												recipe
																													._id
																											]
																										) {
																											const recipeQuantities =
																												{
																													...next[
																														recipe
																															._id
																													],
																												};
																											delete recipeQuantities[
																												index
																											];
																											if (
																												Object.keys(
																													recipeQuantities
																												)
																													.length ===
																												0
																											) {
																												delete next[
																													recipe
																														._id
																												];
																											} else {
																												next[
																													recipe._id
																												] =
																													recipeQuantities;
																											}
																										}
																										return next;
																									}
																								);
																							}
																						}}
																						placeholder={String(
																							amount
																						)}
																						className='w-24 text-xs'
																						inputMode='decimal'
																					/>
																				</div>
																			)}
																		</li>
																	);
																}
															)}
														</ul>
													</section>
												)}
												{instructionSteps.length >
													0 && (
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
																			{
																				step
																			}
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
						</div>
					)}

					{recipes.length > 0 && (
						<div className='mb-4 flex items-center gap-2'>
							<span className='text-sm text-muted-foreground'>
								Servings:
							</span>
							<div className='flex gap-1'>
								{[1, 2, 3, 4, 5, 6].map((num) => {
									const hasAnyCustomQuantity =
										Object.keys(customQuantities).length >
										0;
									return (
										<Button
											key={num}
											variant={
												servings === num
													? 'default'
													: 'outline'
											}
											size='sm'
											onClick={() => {
												setServings(num);
												// Clear all custom quantities when servings is selected
												setCustomQuantities({});
											}}
											className={`min-w-10 ${
												hasAnyCustomQuantity
													? 'opacity-50 cursor-pointer'
													: ''
											}`}
											title={
												hasAnyCustomQuantity
													? 'Click to clear all custom quantities and use serving size'
													: undefined
											}>
											{num}
										</Button>
									);
								})}
							</div>
						</div>
					)}
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

								// Check if there's a custom quantity set for this recipe
								const recipeCustomQuantities =
									customQuantities[recipe._id] ?? {};
								const hasCustomQuantity =
									Object.keys(recipeCustomQuantities).length >
									0;

								// Find first core ingredient with custom quantity to calculate scale
								let customScaleFactor: number | null = null;
								if (hasCustomQuantity) {
									for (
										let i = 0;
										i < ingredientItems.length;
										i++
									) {
										const ingredient = ingredientItems[i];
										if (
											ingredient.core &&
											recipeCustomQuantities[i] !==
												undefined
										) {
											const originalAmount =
												ingredient.quantity?.amount;
											const customAmount =
												recipeCustomQuantities[i];
											if (
												typeof originalAmount ===
													'number' &&
												originalAmount > 0 &&
												customAmount > 0
											) {
												customScaleFactor =
													customAmount /
													originalAmount;
												break;
											}
										}
									}
								}

								const scaleFactor =
									customScaleFactor ?? servings;
								const totalProtein = calculateTotalProtein(
									ingredientItems,
									scaleFactor
								);
								const instructionSteps = recipe.instructions
									.split('\n')
									.map((line) => line.trim())
									.filter(Boolean);
								const isSelected = selectedRecipes.has(
									recipe._id
								);
								return (
									<Card
										key={recipe._id}
										className={
											isSelected
												? 'border-primary border-2'
												: ''
										}>
										<CardHeader>
											<div>
												<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
													<div className='flex items-center gap-3'>
														<Checkbox
															checked={isSelected}
															onCheckedChange={() =>
																toggleRecipeSelection(
																	recipe._id
																)
															}
															className='shrink-0'
														/>
														<CardTitle className='text-2xl'>
															{recipe.title}
														</CardTitle>
													</div>
													<div className='flex items-center gap-2'>
														<span className='text-sm text-muted-foreground whitespace-nowrap'>
															Servings:
														</span>
														<div className='flex gap-1'>
															{[
																1, 2, 3, 4, 5,
																6,
															].map((num) => (
																<Button
																	key={num}
																	variant={
																		servings ===
																		num
																			? 'default'
																			: 'outline'
																	}
																	size='sm'
																	onClick={() => {
																		setServings(
																			num
																		);
																		// Clear all custom quantities when servings is selected
																		setCustomQuantities(
																			{}
																		);
																	}}
																	className={`min-w-10 ${
																		hasCustomQuantity
																			? 'opacity-50 cursor-pointer'
																			: ''
																	}`}
																	title={
																		hasCustomQuantity
																			? 'Click to clear custom quantity and use serving size'
																			: undefined
																	}>
																	{num}
																</Button>
															))}
														</div>
													</div>
												</div>
												{totalProtein !== null && (
													<p className='text-sm text-muted-foreground mt-1'>
														Total protein:{' '}
														{totalProtein.toFixed(
															1
														)}
														g
														<span className='text-xs ml-1'>
															(from core
															ingredients)
														</span>
													</p>
												)}
											</div>
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
																const formattedAmount =
																	formatAmount(
																		amount,
																		scaleFactor
																	);
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

																const customAmount =
																	recipeCustomQuantities[
																		index
																	];
																const showCustomInput =
																	ingredient.core &&
																	typeof amount ===
																		'number';

																return (
																	<li
																		key={`${recipe._id}-${index}-${ingredient.item}`}
																		className='space-y-1'>
																		<div className='flex items-start gap-2'>
																			<span className='flex-1'>
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
																					{ingredient.core && (
																						<span className='ml-1 text-xs font-semibold text-primary'>
																							(core)
																						</span>
																					)}
																					{formsText && (
																						<span className='text-muted-foreground italic'>
																							{
																								formsText
																							}
																						</span>
																					)}
																				</span>
																			</span>
																		</div>
																		{showCustomInput && (
																			<div className='flex items-center gap-2 pl-5'>
																				<label
																					htmlFor={`custom-${recipe._id}-${index}`}
																					className='text-xs text-muted-foreground whitespace-nowrap'>
																					Custom{' '}
																					{
																						unit
																					}

																					:
																				</label>
																				<Input
																					id={`custom-${recipe._id}-${index}`}
																					type='number'
																					min='0'
																					step='0.1'
																					value={
																						customAmount ??
																						''
																					}
																					onChange={(
																						e
																					) => {
																						const value =
																							parseFloat(
																								e
																									.target
																									.value
																							);
																						if (
																							!Number.isNaN(
																								value
																							) &&
																							value >
																								0
																						) {
																							// Only allow one core ingredient to have custom quantity at a time
																							setCustomQuantities(
																								(
																									prev
																								) => ({
																									...prev,
																									[recipe._id]:
																										{
																											// Clear all other custom quantities, only keep this one
																											[index]:
																												value,
																										},
																								})
																							);
																							// Reset servings when custom quantity is set
																							setServings(
																								1
																							);
																						} else if (
																							e
																								.target
																								.value ===
																							''
																						) {
																							setCustomQuantities(
																								(
																									prev
																								) => {
																									const next =
																										{
																											...prev,
																										};
																									if (
																										next[
																											recipe
																												._id
																										]
																									) {
																										const recipeQuantities =
																											{
																												...next[
																													recipe
																														._id
																												],
																											};
																										delete recipeQuantities[
																											index
																										];
																										if (
																											Object.keys(
																												recipeQuantities
																											)
																												.length ===
																											0
																										) {
																											delete next[
																												recipe
																													._id
																											];
																										} else {
																											next[
																												recipe._id
																											] =
																												recipeQuantities;
																										}
																									}
																									return next;
																								}
																							);
																						}
																					}}
																					placeholder={String(
																						amount
																					)}
																					className='w-24 text-xs'
																					inputMode='decimal'
																				/>
																			</div>
																		)}
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
