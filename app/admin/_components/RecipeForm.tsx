'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IngredientRow } from './IngredientRow';
import type { IngredientInput } from '../types';
import { createEmptyIngredient, isIngredientRowEmpty } from '../types';
import type { Id } from '../../../convex/_generated/dataModel';

type RecipeFormProps = {
	allIngredients: string[];
	allUnits: string[];
	allForms: string[];
	onSubmit: (data: {
		title: string;
		ingredients: Array<{
			item: string;
			forms?: string[];
			quantity?: { amount?: number; unit?: string };
		}>;
		instructions: string;
	}) => Promise<void>;
	editingId: Id<'recipes'> | null;
	initialData?: {
		title: string;
		ingredients: Array<{
			item: string;
			forms?: string[] | null;
			quantity?: { amount?: number | null; unit?: string | null };
		}>;
		instructions: string;
	};
};

export function RecipeForm({
	allIngredients,
	allUnits,
	allForms,
	onSubmit,
	editingId,
	initialData,
}: RecipeFormProps) {
	const [title, setTitle] = useState(initialData?.title ?? '');
	const [ingredients, setIngredients] = useState<IngredientInput[]>(() => {
		if (initialData?.ingredients && initialData.ingredients.length > 0) {
			const mapped = initialData.ingredients.map((ingredient) => ({
				item: ingredient.item ?? '',
				amount:
					ingredient.quantity?.amount !== undefined &&
					ingredient.quantity?.amount !== null
						? String(ingredient.quantity.amount)
						: '',
				unit: ingredient.quantity?.unit ?? '',
				forms: (ingredient.forms ?? [])
					.map((form) => form?.trim() ?? '')
					.filter((form) => form.length > 0),
				core: (ingredient as { core?: boolean }).core ?? false,
			}));
			const lastRow = mapped[mapped.length - 1];
			return isIngredientRowEmpty(lastRow)
				? mapped
				: [...mapped, createEmptyIngredient()];
		}
		return [createEmptyIngredient()];
	});
	const [instructions, setInstructions] = useState(
		initialData?.instructions ?? ''
	);

	const isEditing = useMemo(() => editingId !== null, [editingId]);

	// Reset form when editing is canceled or initialData changes
	useEffect(() => {
		if (editingId === null) {
			setTitle('');
			setIngredients([createEmptyIngredient()]);
			setInstructions('');
		} else if (initialData) {
			setTitle(initialData.title);
			const mapped = initialData.ingredients.map((ingredient) => ({
				item: ingredient.item ?? '',
				amount:
					ingredient.quantity?.amount !== undefined &&
					ingredient.quantity?.amount !== null
						? String(ingredient.quantity.amount)
						: '',
				unit: ingredient.quantity?.unit ?? '',
				forms: (ingredient.forms ?? [])
					.map((form) => form?.trim() ?? '')
					.filter((form) => form.length > 0),
				core: (ingredient as { core?: boolean }).core ?? false,
			}));
			const lastRow = mapped[mapped.length - 1];
			setIngredients(
				isIngredientRowEmpty(lastRow)
					? mapped
					: [...mapped, createEmptyIngredient()]
			);
			setInstructions(initialData.instructions);
		}
	}, [editingId, initialData]);

	const updateIngredientField = <Key extends keyof IngredientInput>(
		index: number,
		field: Key,
		value: IngredientInput[Key]
	) => {
		setIngredients((current) => {
			const updated = current.map((ingredient, idx) =>
				idx === index ? { ...ingredient, [field]: value } : ingredient
			);

			if (index === current.length - 1) {
				const updatedRow = updated[index];
				if (updatedRow && !isIngredientRowEmpty(updatedRow)) {
					return [...updated, createEmptyIngredient()];
				}
			}

			return updated.length > 0 ? updated : [createEmptyIngredient()];
		});
	};

	const cleanupEmptyRows = () => {
		setIngredients((current) => {
			const nonEmptyRows = current.filter(
				(ing, idx) =>
					!isIngredientRowEmpty(ing) || idx === current.length - 1
			);

			if (nonEmptyRows.length === 0) {
				return [createEmptyIngredient()];
			}

			const last = nonEmptyRows[nonEmptyRows.length - 1];
			if (last && !isIngredientRowEmpty(last)) {
				return [...nonEmptyRows, createEmptyIngredient()];
			}

			return nonEmptyRows;
		});
	};

	const removeIngredientRow = (index: number) => {
		setIngredients((current) => {
			const next = current.filter((_, idx) => idx !== index);
			const ensured = next.length > 0 ? next : [createEmptyIngredient()];
			const last = ensured[ensured.length - 1];
			if (last && !isIngredientRowEmpty(last)) {
				return [...ensured, createEmptyIngredient()];
			}
			return ensured;
		});
	};

	const buildIngredientPayload = () =>
		ingredients.reduce<
			Array<{
				item: string;
				forms?: string[];
				quantity?: { amount?: number; unit?: string };
			}>
		>((acc, ingredient, index) => {
			const trimmedItem = ingredient.item.trim();
			const trimmedUnit = ingredient.unit.trim();
			const trimmedAmount = ingredient.amount.trim();

			const isRowEmpty =
				trimmedItem.length === 0 &&
				trimmedUnit.length === 0 &&
				trimmedAmount.length === 0 &&
				ingredient.forms.length === 0;

			if (isRowEmpty) {
				return acc;
			}

			if (trimmedItem.length === 0) {
				throw new Error(`Ingredient ${index + 1}: name is required`);
			}

			// Validate: core ingredients must use "gram" as unit
			if (ingredient.core && trimmedUnit.length > 0) {
				const unitLower = trimmedUnit.toLowerCase();
				if (
					unitLower !== 'gram' &&
					unitLower !== 'grams' &&
					unitLower !== 'g'
				) {
					throw new Error(
						`Ingredient ${
							index + 1
						}: core ingredients must use "gram" as the unit, but got "${trimmedUnit}"`
					);
				}
			}

			let quantity: { amount?: number; unit?: string } | undefined;

			if (trimmedAmount.length > 0) {
				const parsedAmount = Number(trimmedAmount);
				if (Number.isNaN(parsedAmount)) {
					throw new Error(
						`Ingredient ${index + 1}: amount must be a number`
					);
				}
				quantity = { amount: parsedAmount };
			}

			if (trimmedUnit.length > 0) {
				quantity = { ...(quantity ?? {}), unit: trimmedUnit };
			}

			const trimmedForms = ingredient.forms
				.map((f) => f.trim())
				.filter((f) => f.length > 0);

			acc.push({
				item: trimmedItem,
				...(ingredient.core ? { core: true } : {}),
				...(trimmedForms.length > 0 ? { forms: trimmedForms } : {}),
				...(quantity ? { quantity } : {}),
			});

			return acc;
		}, []);

	const handleSubmit = async () => {
		let ingredientPayload;
		try {
			ingredientPayload = buildIngredientPayload();
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			} else {
				alert('Please check the ingredient list for errors.');
			}
			return;
		}

		if (ingredientPayload.length === 0) {
			alert('Please add at least one ingredient.');
			return;
		}

		await onSubmit({
			title,
			ingredients: ingredientPayload,
			instructions,
		});
	};

	const handleReset = () => {
		setTitle('');
		setIngredients([createEmptyIngredient()]);
		setInstructions('');
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{isEditing ? 'Edit Recipe' : 'Add New Recipe'}
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='flex flex-col gap-2'>
					<Label htmlFor='title'>Title</Label>
					<Input
						id='title'
						placeholder='Title'
						value={title}
						onChange={(event) => setTitle(event.target.value)}
					/>
				</div>
				<div className='flex flex-col gap-2'>
					<Label>Ingredients</Label>
					<div className='flex flex-col gap-3'>
						{ingredients.map((ingredient, index) => (
							<IngredientRow
								key={`ingredient-${index}`}
								ingredient={ingredient}
								index={index}
								allIngredients={allIngredients}
								allUnits={allUnits}
								allForms={allForms}
								onUpdate={updateIngredientField}
								onRemove={removeIngredientRow}
								onBlur={() => {
									setTimeout(() => cleanupEmptyRows(), 200);
								}}
								isEmpty={isIngredientRowEmpty(ingredient)}
							/>
						))}
					</div>
				</div>
				<div className='flex flex-col gap-2'>
					<Label htmlFor='instructions'>Instructions</Label>
					<Textarea
						id='instructions'
						placeholder='Instructions'
						rows={6}
						value={instructions}
						onChange={(event) =>
							setInstructions(event.target.value)
						}
					/>
				</div>
				<div className='flex items-center gap-2'>
					<Button onClick={handleSubmit} type='button'>
						{isEditing ? 'Update recipe' : 'Add recipe'}
					</Button>
					{isEditing && (
						<Button
							variant='outline'
							onClick={handleReset}
							type='button'>
							Cancel
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
