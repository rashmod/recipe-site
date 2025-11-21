'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../convex/_generated/api';
import { useQuery } from 'convex/react';
import type { Id } from '../../../convex/_generated/dataModel';
import { useMemo, useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function RecipePage() {
	const params = useParams();
	const recipeId = params.id as Id<'recipes'>;
	const recipe = useQuery(api.recipes.get, { id: recipeId });
	const [servings, setServings] = useState<number>(1);
	const [customQuantities, setCustomQuantities] = useState<
		Record<number, number>
	>({});

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

	if (!recipe) {
		return (
			<div className='flex min-h-screen bg-background items-center justify-center'>
				<Card>
					<CardContent className='py-8 text-center'>
						<p className='text-muted-foreground'>
							Recipe not found.
						</p>
						<Button variant='link' asChild className='mt-4'>
							<Link href='/'>Back to recipes</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const ingredientItems = Array.isArray(recipe.ingredients)
		? recipe.ingredients
		: [];

	// Check if there's a custom quantity set
	const hasCustomQuantity = Object.keys(customQuantities).length > 0;

	// Find first core ingredient with custom quantity to calculate scale
	let customScaleFactor: number | null = null;
	if (hasCustomQuantity) {
		for (let i = 0; i < ingredientItems.length; i++) {
			const ingredient = ingredientItems[i];
			if (ingredient.core && customQuantities[i] !== undefined) {
				const originalAmount = ingredient.quantity?.amount;
				const customAmount = customQuantities[i];
				if (
					typeof originalAmount === 'number' &&
					originalAmount > 0 &&
					customAmount > 0
				) {
					customScaleFactor = customAmount / originalAmount;
					break;
				}
			}
		}
	}

	const scaleFactor = customScaleFactor ?? servings;
	const totalProtein = calculateTotalProtein(ingredientItems, scaleFactor);
	const instructionSteps = recipe.instructions
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	return (
		<div className='flex min-h-screen bg-background'>
			<main className='flex-1 flex flex-col min-w-0'>
				<header className='border-b bg-card px-4 py-4 lg:px-6'>
					<div className='flex items-center gap-4'>
						<Button variant='ghost' size='icon' asChild>
							<Link href='/'>
								<ArrowLeft className='h-5 w-5' />
								<span className='sr-only'>Back to recipes</span>
							</Link>
						</Button>
						<h1 className='text-2xl font-bold'>{recipe.title}</h1>
					</div>
				</header>

				<div className='flex-1 overflow-y-auto p-4 lg:p-6'>
					<Card>
						<CardHeader>
							<div>
								<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
									<CardTitle className='text-2xl'>
										{recipe.title}
									</CardTitle>
									<div className='flex items-center gap-2'>
										<span className='text-sm text-muted-foreground whitespace-nowrap'>
											Servings:
										</span>
										<div className='flex gap-1'>
											{[1, 2, 3, 4, 5, 6].map((num) => (
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
														setCustomQuantities({});
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
										Total protein: {totalProtein.toFixed(1)}
										g
										<span className='text-xs ml-1'>
											(from core ingredients)
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
											(ingredient, index) => {
												const amount =
													ingredient.quantity
														?.amount ?? undefined;
												const unit =
													ingredient.quantity?.unit?.trim() ??
													'';
												const formattedAmount =
													formatAmount(
														amount,
														scaleFactor
													);
												const quantityText = [
													formattedAmount,
													unit,
												]
													.filter(
														(value) =>
															value &&
															value.length > 0
													)
													.join(' ');

												const formsText =
													ingredient.forms &&
													ingredient.forms.length > 0
														? ` (${ingredient.forms.join(
																', '
														  )})`
														: '';

												const customAmount =
													customQuantities[index];
												const showCustomInput =
													ingredient.core &&
													typeof amount === 'number';

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
																	{unit}:
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
																				{
																					[index]:
																						value,
																				}
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
																					delete next[
																						index
																					];
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
											{instructionSteps.map((step) => (
												<li key={step}>{step}</li>
											))}
										</ol>
									</section>
								</>
							)}
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
