import { useEffect, useState, useMemo } from 'react';
import type { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type IngredientRecord = {
	_id: Id<'ingredients'>;
	item: string;
	proteinPer100g: number | null;
};

type IngredientManagerProps = {
	ingredients: IngredientRecord[];
	onSave: (payload: {
		id?: Id<'ingredients'>;
		item: string;
		proteinPer100g?: number;
	}) => Promise<void>;
	onDelete: (id: Id<'ingredients'>) => Promise<void>;
};

export function IngredientManager({
	ingredients,
	onSave,
	onDelete,
}: IngredientManagerProps) {
	const [proteinValues, setProteinValues] = useState<Record<string, string>>(
		{}
	);
	const [savingId, setSavingId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		setProteinValues(
			Object.fromEntries(
				ingredients.map((ingredient) => [
					ingredient._id,
					ingredient.proteinPer100g !== null &&
					ingredient.proteinPer100g !== undefined
						? String(ingredient.proteinPer100g)
						: '',
				])
			)
		);
	}, [ingredients]);

	const filteredIngredients = useMemo(() => {
		if (!searchQuery.trim()) {
			return ingredients;
		}
		const query = searchQuery.toLowerCase();
		return ingredients.filter((ingredient) =>
			ingredient.item.toLowerCase().includes(query)
		);
	}, [ingredients, searchQuery]);

	const parseProteinInput = (value: string): number | undefined => {
		const trimmed = value.trim();
		if (!trimmed) {
			return undefined;
		}
		const parsed = Number(trimmed);
		if (Number.isNaN(parsed) || parsed < 0) {
			throw new Error('Protein per 100g must be a non-negative number');
		}
		return parsed;
	};

	const handleSaveExisting = async (ingredient: IngredientRecord) => {
		let proteinPer100g: number | undefined;
		try {
			proteinPer100g = parseProteinInput(
				proteinValues[ingredient._id] ?? ''
			);
		} catch (error) {
			alert(error instanceof Error ? error.message : String(error));
			return;
		}

		try {
			setSavingId(ingredient._id);
			await onSave({
				id: ingredient._id,
				item: ingredient.item,
				proteinPer100g,
			});
		} finally {
			setSavingId(null);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Manage Ingredient Protein</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				<div className='space-y-2'>
					<Label htmlFor='ingredient-search' className='text-sm'>
						Search ingredients
					</Label>
					<Input
						id='ingredient-search'
						type='text'
						placeholder='Search by ingredient name...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				{filteredIngredients.length > 0 ? (
					<div className='space-y-4'>
						{filteredIngredients.map((ingredient) => (
							<div
								key={ingredient._id}
								className='flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-end sm:gap-4'>
								<div className='flex-1 space-y-1'>
									<Label className='text-xs uppercase text-muted-foreground'>
										Name
									</Label>
									<p className='text-sm font-medium'>
										{ingredient.item}
									</p>
								</div>
								<div className='sm:w-40 space-y-1'>
									<Label className='text-xs uppercase text-muted-foreground'>
										Protein / 100g
									</Label>
									<Input
										inputMode='decimal'
										value={
											proteinValues[ingredient._id] ?? ''
										}
										onChange={(event) =>
											setProteinValues((current) => ({
												...current,
												[ingredient._id]:
													event.target.value,
											}))
										}
									/>
								</div>
								<div className='flex gap-2'>
									<Button
										size='sm'
										onClick={() =>
											handleSaveExisting(ingredient)
										}
										disabled={savingId === ingredient._id}>
										Save
									</Button>
									<Button
										variant='outline'
										size='sm'
										onClick={() => onDelete(ingredient._id)}
										type='button'>
										Delete
									</Button>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className='text-sm text-muted-foreground'>
						{searchQuery.trim()
							? 'No ingredients found matching your search.'
							: 'No ingredients found.'}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
