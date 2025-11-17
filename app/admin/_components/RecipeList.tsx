'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Id } from '../../../convex/_generated/dataModel';

type Recipe = {
	_id: Id<'recipes'>;
	title: string;
	ingredients:
		| Array<{
				item: string;
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
	const formatAmount = (amount: number | null | undefined): string => {
		if (amount === undefined || amount === null) {
			return '';
		}
		if (!Number.isFinite(amount)) {
			return '';
		}
		if (Number.isInteger(amount)) {
			return String(amount);
		}
		return Number(amount.toFixed(2))
			.toString()
			.replace(/\.?0+$/, '');
	};

	if (recipes.length === 0) {
		return <p className='text-sm text-muted-foreground'>No recipes yet.</p>;
	}

	return (
		<div className='flex flex-col gap-4'>
			{recipes.map((recipe) => {
				const recipeIngredients = Array.isArray(recipe.ingredients)
					? recipe.ingredients
					: [];
				return (
					<Card key={recipe._id}>
						<CardHeader>
							<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
								<CardTitle className='text-lg'>
									{recipe.title}
								</CardTitle>
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
													formatAmount(amount);
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
