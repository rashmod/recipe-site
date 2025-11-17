'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Id } from '../../../convex/_generated/dataModel';

type Recipe = {
	_id: Id<'recipes'>;
	title: string;
	ingredients:
		| Array<{
				item: string;
				core?: boolean;
				proteinPer100g?: number | null;
				forms?: string[] | null;
				quantity?: { amount?: number | null; unit?: string | null };
		  }>
		| undefined;
	instructions: string;
};

type RecipeListProps = {
	recipes: Recipe[];
	onEdit: (recipe: Recipe) => void;
	onDelete: (id: Id<'recipes'>) => void;
};

export function RecipeList({ recipes, onEdit, onDelete }: RecipeListProps) {
	const [servings, setServings] = useState<number>(1);

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

	const calculateTotalProtein = (
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
			const unit = ingredient.quantity?.unit?.trim().toLowerCase() ?? '';

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
	};

	if (recipes.length === 0) {
		return <p className='text-sm text-muted-foreground'>No recipes yet.</p>;
	}

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex items-center gap-2'>
				<span className='text-sm text-muted-foreground'>Servings:</span>
				<div className='flex gap-1'>
					{[1, 2, 3, 4, 5, 6].map((num) => (
						<Button
							key={num}
							variant={servings === num ? 'default' : 'outline'}
							size='sm'
							onClick={() => setServings(num)}
							className='min-w-[2.5rem]'>
							{num}
						</Button>
					))}
				</div>
			</div>
			{recipes.map((recipe) => {
				const recipeIngredients = Array.isArray(recipe.ingredients)
					? recipe.ingredients
					: [];
				const scaleFactor = servings;
				const totalProtein = calculateTotalProtein(
					recipeIngredients,
					scaleFactor
				);
				return (
					<Card key={recipe._id}>
						<CardHeader>
							<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
								<div className='flex-1'>
									<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
										<CardTitle className='text-lg'>
											{recipe.title}
										</CardTitle>
										<div className='flex items-center gap-2'>
											<span className='text-sm text-muted-foreground whitespace-nowrap'>
												Servings:
											</span>
											<div className='flex gap-1'>
												{[1, 2, 3, 4, 5, 6].map(
													(num) => (
														<Button
															key={num}
															variant={
																servings === num
																	? 'default'
																	: 'outline'
															}
															size='sm'
															onClick={() =>
																setServings(num)
															}
															className='min-w-[2.5rem]'>
															{num}
														</Button>
													)
												)}
											</div>
										</div>
									</div>
									{totalProtein !== null && (
										<p className='text-sm text-muted-foreground mt-1'>
											Total protein:{' '}
											{totalProtein.toFixed(1)}g
											<span className='text-xs ml-1'>
												(from core ingredients)
											</span>
										</p>
									)}
								</div>
								<div className='flex items-center gap-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={() => onEdit(recipe)}>
										Edit
									</Button>
									<Button
										variant='destructive'
										size='sm'
										onClick={() => onDelete(recipe._id)}>
										Delete
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className='space-y-3'>
							<div className='text-sm'>
								<strong>Ingredients:</strong>
								{recipeIngredients.length > 0 ? (
									<ul className='mt-1 list-disc pl-5 space-y-1'>
										{recipeIngredients.map(
											(ingredient, index) => {
												const amount =
													ingredient.quantity?.amount;
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

												return (
													<li
														key={`${ingredient.item}-${quantityText}-${index}`}>
														{quantityText.length >
															0 && (
															<span className='font-medium'>
																{quantityText}
															</span>
														)}
														{quantityText.length >
															0 && ingredient.item
															? ' — '
															: ' '}
														<span>
															{ingredient.item}
															{ingredient.core && (
																<span className='ml-1 text-xs font-semibold text-primary'>
																	(core)
																</span>
															)}
															{formsText && (
																<span className='text-muted-foreground italic'>
																	{formsText}
																</span>
															)}
															{typeof ingredient.proteinPer100g ===
																'number' && (
																<span className='ml-1 text-muted-foreground text-xs'>
																	(
																	{
																		ingredient.proteinPer100g
																	}{' '}
																	g / 100g)
																</span>
															)}
														</span>
													</li>
												);
											}
										)}
									</ul>
								) : (
									<p className='mt-1 text-muted-foreground'>
										No ingredients listed.
									</p>
								)}
							</div>
							<div className='text-sm'>
								<strong>Instructions:</strong>
								<p className='whitespace-pre-line mt-1'>
									{recipe.instructions}
								</p>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
