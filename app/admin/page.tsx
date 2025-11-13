'use client';

import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

type IngredientInput = {
	item: string;
	amount: string;
	unit: string;
	forms: string[]; // Array of form names
};

const createEmptyIngredient = (): IngredientInput => ({
	item: '',
	amount: '',
	unit: '',
	forms: [],
});

const isIngredientRowEmpty = (ingredient: IngredientInput) => {
	return (
		ingredient.item.trim().length === 0 &&
		ingredient.amount.trim().length === 0 &&
		ingredient.unit.trim().length === 0 &&
		ingredient.forms.every((form) => form.trim().length === 0)
	);
};

// Ingredient Suggestions Component
function IngredientSuggestions({
	searchTerm,
	allIngredients,
	onSelect,
}: {
	searchTerm: string;
	allIngredients: string[];
	onSelect: (item: string) => void;
}) {
	const suggestions = useMemo(() => {
		if (!searchTerm.trim()) {
			return allIngredients;
		}
		const searchLower = searchTerm.toLowerCase().trim();
		return allIngredients.filter((ing) =>
			ing.toLowerCase().includes(searchLower)
		);
	}, [allIngredients, searchTerm]);

	if (suggestions.length === 0) {
		return null;
	}

	return (
		<div className='absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-hidden'>
			<ScrollArea className='h-full'>
				<ul>
					{suggestions.map((suggestion, idx) => (
						<li
							key={idx}
							className='px-3 py-2 hover:bg-accent cursor-pointer text-sm'
							onMouseDown={(e) => {
								e.preventDefault(); // Prevent input blur
								onSelect(suggestion);
							}}>
							{suggestion}
						</li>
					))}
				</ul>
			</ScrollArea>
		</div>
	);
}

// Unit Suggestions Component
function UnitSuggestions({
	searchTerm,
	allUnits,
	onSelect,
}: {
	searchTerm: string;
	allUnits: string[];
	onSelect: (unit: string) => void;
}) {
	const suggestions = useMemo(() => {
		if (!searchTerm.trim()) {
			return allUnits;
		}
		const searchLower = searchTerm.toLowerCase().trim();
		return allUnits.filter((unit) =>
			unit.toLowerCase().includes(searchLower)
		);
	}, [allUnits, searchTerm]);

	if (suggestions.length === 0) {
		return null;
	}

	return (
		<div className='absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-hidden'>
			<ScrollArea className='h-full'>
				<ul>
					{suggestions.map((suggestion, idx) => (
						<li
							key={idx}
							className='px-3 py-2 hover:bg-accent cursor-pointer text-sm'
							onMouseDown={(e) => {
								e.preventDefault(); // Prevent input blur
								onSelect(suggestion);
							}}>
							{suggestion}
						</li>
					))}
				</ul>
			</ScrollArea>
		</div>
	);
}

// Form Suggestions Component
function FormSuggestions({
	searchTerm,
	allForms,
	currentForms,
	onSelect,
}: {
	searchTerm: string;
	allForms: string[];
	currentForms: string[];
	onSelect: (form: string) => void;
}) {
	const suggestions = useMemo(() => {
		// Filter out forms that are already in the current list
		const availableForms = allForms.filter(
			(form) => !currentForms.includes(form)
		);
		if (!searchTerm.trim()) {
			return availableForms;
		}
		const searchLower = searchTerm.toLowerCase().trim();
		return availableForms.filter((form) =>
			form.toLowerCase().includes(searchLower)
		);
	}, [allForms, searchTerm, currentForms]);

	if (suggestions.length === 0) {
		return null;
	}

	return (
		<div className='absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-hidden'>
			<ScrollArea className='h-full'>
				<ul>
					{suggestions.map((suggestion, idx) => (
						<li
							key={idx}
							className='px-3 py-2 hover:bg-accent cursor-pointer text-sm'
							onMouseDown={(e) => {
								e.preventDefault(); // Prevent input blur
								onSelect(suggestion);
							}}>
							{suggestion}
						</li>
					))}
				</ul>
			</ScrollArea>
		</div>
	);
}

export default function AdminPage() {
	const recipes = useQuery(api.recipes.list) ?? [];

	const adminSecret = useMemo(() => {
		return typeof window !== 'undefined'
			? localStorage.getItem('adminSecret') ?? ''
			: '';
	}, []);

	const addRecipe = useMutation(api.recipes.add);
	const updateRecipe = useMutation(api.recipes.update);
	const removeRecipe = useMutation(api.recipes.remove);
	const removeIngredient = useMutation(api.recipes.removeIngredient);
	const removeUnusedIngredients = useMutation(
		api.recipes.removeUnusedIngredients
	);
	const removeIngredientForm = useMutation(api.recipes.removeIngredientForm);
	const removeUnusedIngredientForms = useMutation(
		api.recipes.removeUnusedIngredientForms
	);
	const removeUnit = useMutation(api.recipes.removeUnit);
	const removeUnusedUnits = useMutation(api.recipes.removeUnusedUnits);

	const unusedIngredients = useQuery(api.recipes.listUnusedIngredients) ?? [];
	const unusedIngredientForms =
		useQuery(api.recipes.listUnusedIngredientForms) ?? [];
	const unusedUnits = useQuery(api.recipes.listUnusedUnits) ?? [];

	// Fetch all ingredients, units, and forms once for autocomplete
	const allIngredients = useQuery(api.recipes.listUniqueIngredients) ?? [];
	const allUnits = useQuery(api.recipes.listUniqueUnits) ?? [];
	const allForms = useQuery(api.recipes.listUniqueIngredientForms) ?? [];

	const [title, setTitle] = useState('');
	const [ingredients, setIngredients] = useState<IngredientInput[]>([
		createEmptyIngredient(),
	]);
	const [instructions, setInstructions] = useState('');
	const [editingId, setEditingId] = useState<Id<'recipes'> | null>(null);
	const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<
		number | null
	>(null);
	const [suggestionSearchTerms, setSuggestionSearchTerms] = useState<
		Record<number, string>
	>({});
	const [activeUnitSuggestionIndex, setActiveUnitSuggestionIndex] = useState<
		number | null
	>(null);
	const [unitSuggestionSearchTerms, setUnitSuggestionSearchTerms] = useState<
		Record<number, string>
	>({});
	const [activeFormSuggestionIndex, setActiveFormSuggestionIndex] = useState<
		number | null
	>(null);
	const [formSuggestionSearchTerms, setFormSuggestionSearchTerms] = useState<
		Record<number, string>
	>({});
	const [formInputValues, setFormInputValues] = useState<
		Record<number, string>
	>({});
	const [cleanupTimeouts, setCleanupTimeouts] = useState<
		Record<number, NodeJS.Timeout>
	>({});
	const [suggestionTimeouts, setSuggestionTimeouts] = useState<
		Record<number, NodeJS.Timeout>
	>({});
	const [unitSuggestionTimeouts, setUnitSuggestionTimeouts] = useState<
		Record<number, NodeJS.Timeout>
	>({});
	const [formSuggestionTimeouts, setFormSuggestionTimeouts] = useState<
		Record<number, NodeJS.Timeout>
	>({});

	const isEditing = useMemo(() => editingId !== null, [editingId]);

	const resetForm = () => {
		setTitle('');
		setIngredients([createEmptyIngredient()]);
		setInstructions('');
		setEditingId(null);
		setFormInputValues({});
		setFormSuggestionSearchTerms({});
		// Clear all pending timeouts
		Object.values(suggestionTimeouts).forEach((timeout) =>
			clearTimeout(timeout)
		);
		Object.values(unitSuggestionTimeouts).forEach((timeout) =>
			clearTimeout(timeout)
		);
		Object.values(formSuggestionTimeouts).forEach((timeout) =>
			clearTimeout(timeout)
		);
		Object.values(cleanupTimeouts).forEach((timeout) =>
			clearTimeout(timeout)
		);
		setSuggestionTimeouts({});
		setUnitSuggestionTimeouts({});
		setFormSuggestionTimeouts({});
		setCleanupTimeouts({});
	};

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
			// Remove all empty rows except keep the last one if it's empty
			// This ensures we always have exactly one empty row at the end
			const nonEmptyRows = current.filter(
				(ing, idx) =>
					!isIngredientRowEmpty(ing) || idx === current.length - 1
			);

			// If we have no rows, create one empty row
			if (nonEmptyRows.length === 0) {
				return [createEmptyIngredient()];
			}

			// Check the last row
			const last = nonEmptyRows[nonEmptyRows.length - 1];
			if (last && !isIngredientRowEmpty(last)) {
				// Last row is not empty, add an empty row
				return [...nonEmptyRows, createEmptyIngredient()];
			}

			// Last row is empty, we're good - we have exactly one empty row at the end
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

		setFormInputValues((prev) => {
			if (Object.keys(prev).length === 0) {
				return prev;
			}
			const next: Record<number, string> = {};
			for (const key of Object.keys(prev)) {
				const idx = Number(key);
				if (Number.isNaN(idx)) continue;
				if (idx < index) {
					next[idx] = prev[idx];
				} else if (idx > index) {
					next[idx - 1] = prev[idx];
				}
			}
			return next;
		});

		setFormSuggestionSearchTerms((prev) => {
			if (Object.keys(prev).length === 0) {
				return prev;
			}
			const next: Record<number, string> = {};
			for (const key of Object.keys(prev)) {
				const idx = Number(key);
				if (Number.isNaN(idx)) continue;
				if (idx < index) {
					next[idx] = prev[idx];
				} else if (idx > index) {
					next[idx - 1] = prev[idx];
				}
			}
			return next;
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
				...(trimmedForms.length > 0 ? { forms: trimmedForms } : {}),
				...(quantity ? { quantity } : {}),
			});

			return acc;
		}, []);

	const submit = async () => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}

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

		if (isEditing && editingId) {
			await updateRecipe({
				id: editingId,
				title,
				ingredients: ingredientPayload,
				instructions,
				adminSecret,
			});
			alert('Recipe updated');
		} else {
			await addRecipe({
				title,
				ingredients: ingredientPayload,
				instructions,
				adminSecret,
			});
			alert('Recipe added');
		}
		resetForm();
	};

	const handleEdit = (recipe: {
		_id: Id<'recipes'>;
		title: string;
		ingredients:
			| Array<{
					item: string;
					forms?: string[] | null;
					quantity?: { amount?: number | null; unit?: string | null };
			  }>
			| undefined;
		instructions: string;
	}) => {
		setEditingId(recipe._id);
		setTitle(recipe.title);
		const ingredientList = Array.isArray(recipe.ingredients)
			? recipe.ingredients
			: [];
		const mappedIngredients =
			ingredientList.length > 0
				? ingredientList.map((ingredient) => ({
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
				  }))
				: [];
		const baseRows =
			mappedIngredients.length > 0
				? mappedIngredients
				: [createEmptyIngredient()];
		const lastRow = baseRows[baseRows.length - 1];
		const rowsWithBlank =
			lastRow && isIngredientRowEmpty(lastRow)
				? baseRows
				: [...baseRows, createEmptyIngredient()];
		setIngredients(rowsWithBlank);
		setFormInputValues({});
		setFormSuggestionSearchTerms({});
		setInstructions(recipe.instructions);
	};

	const handleDelete = async (id: Id<'recipes'>) => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		const confirmed = window.confirm(
			'Are you sure you want to delete this recipe?'
		);
		if (!confirmed) {
			return;
		}
		await removeRecipe({ id, adminSecret });
	};

	const handleRemoveIngredient = async (id: Id<'ingredients'>) => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		const confirmed = window.confirm(
			'Are you sure you want to delete this ingredient? This action cannot be undone.'
		);
		if (!confirmed) {
			return;
		}
		try {
			await removeIngredient({ id, adminSecret });
		} catch (error) {
			alert(
				error instanceof Error
					? error.message
					: 'Failed to delete ingredient'
			);
		}
	};

	const handleRemoveIngredientForm = async (id: Id<'ingredientForm'>) => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		const confirmed = window.confirm(
			'Are you sure you want to delete this ingredient form? This action cannot be undone.'
		);
		if (!confirmed) {
			return;
		}
		try {
			await removeIngredientForm({ id, adminSecret });
		} catch (error) {
			alert(
				error instanceof Error
					? error.message
					: 'Failed to delete ingredient form'
			);
		}
	};

	const handleRemoveUnusedIngredientForms = async () => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		if (unusedIngredientForms.length === 0) {
			alert('No unused ingredient forms to remove.');
			return;
		}
		const confirmed = window.confirm(
			`Are you sure you want to delete ${
				unusedIngredientForms.length
			} unused ingredient form${
				unusedIngredientForms.length !== 1 ? 's' : ''
			}? This action cannot be undone.`
		);
		if (!confirmed) {
			return;
		}
		await removeUnusedIngredientForms({ adminSecret });
	};

	const handleRemoveUnit = async (id: Id<'units'>) => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		const confirmed = window.confirm(
			'Are you sure you want to delete this unit? This action cannot be undone.'
		);
		if (!confirmed) {
			return;
		}
		try {
			await removeUnit({ id, adminSecret });
		} catch (error) {
			alert(
				error instanceof Error ? error.message : 'Failed to delete unit'
			);
		}
	};

	const handleRemoveUnusedUnits = async () => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		if (unusedUnits.length === 0) {
			alert('No unused units to remove.');
			return;
		}
		const confirmed = window.confirm(
			`Are you sure you want to delete ${unusedUnits.length} unused unit${
				unusedUnits.length !== 1 ? 's' : ''
			}? This action cannot be undone.`
		);
		if (!confirmed) {
			return;
		}
		await removeUnusedUnits({ adminSecret });
	};

	const handleRemoveUnusedIngredients = async () => {
		if (!adminSecret) {
			alert('Please login first.');
			return;
		}
		if (unusedIngredients.length === 0) {
			alert('No unused ingredients to remove.');
			return;
		}
		const confirmed = window.confirm(
			`Are you sure you want to delete ${
				unusedIngredients.length
			} unused ingredient${
				unusedIngredients.length !== 1 ? 's' : ''
			}? This action cannot be undone.`
		);
		if (!confirmed) {
			return;
		}
		await removeUnusedIngredients({ adminSecret });
	};

	return (
		<main className='flex flex-col gap-6 p-4 lg:p-6'>
			<header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<h1 className='text-2xl lg:text-3xl font-bold'>Admin</h1>
				<nav className='flex items-center gap-3 text-sm font-medium'>
					<Button variant='link' asChild className='p-0 h-auto'>
						<Link href='/'>View recipes</Link>
					</Button>
					<Button variant='link' asChild className='p-0 h-auto'>
						<Link href='/admin/login'>Admin login</Link>
					</Button>
				</nav>
			</header>
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
								<Card
									key={`ingredient-${index}`}
									className='p-3'>
									<div className='flex flex-col gap-2'>
										<div className='flex flex-wrap items-center gap-2'>
											<Input
												className='w-24'
												inputMode='decimal'
												placeholder='Amount'
												value={ingredient.amount}
												onChange={(event) =>
													updateIngredientField(
														index,
														'amount',
														event.target.value
													)
												}
												onFocus={() => {
													// Cancel any pending cleanup for this row
													if (
														cleanupTimeouts[index]
													) {
														clearTimeout(
															cleanupTimeouts[
																index
															]
														);
														setCleanupTimeouts(
															(prev) => {
																const next = {
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
												onBlur={() => {
													// Clean up empty rows after blur
													const timeoutId =
														setTimeout(() => {
															cleanupEmptyRows();
															setCleanupTimeouts(
																(prev) => {
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
														}, 200);
													setCleanupTimeouts(
														(prev) => ({
															...prev,
															[index]: timeoutId,
														})
													);
												}}
											/>
											<div className='w-28 relative'>
												<Input
													className='w-full'
													placeholder='Unit'
													value={ingredient.unit}
													onChange={(event) => {
														const value =
															event.target.value;
														updateIngredientField(
															index,
															'unit',
															value
														);
														setUnitSuggestionSearchTerms(
															(prev) => ({
																...prev,
																[index]: value,
															})
														);
														setActiveUnitSuggestionIndex(
															index
														);
													}}
													onFocus={() => {
														// Cancel any pending unit suggestion timeout for this row
														if (
															unitSuggestionTimeouts[
																index
															]
														) {
															clearTimeout(
																unitSuggestionTimeouts[
																	index
																]
															);
															setUnitSuggestionTimeouts(
																(prev) => {
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
														setActiveUnitSuggestionIndex(
															index
														);
														setUnitSuggestionSearchTerms(
															(prev) => ({
																...prev,
																[index]:
																	ingredient.unit,
															})
														);
														// Cancel any pending cleanup for this row
														if (
															cleanupTimeouts[
																index
															]
														) {
															clearTimeout(
																cleanupTimeouts[
																	index
																]
															);
															setCleanupTimeouts(
																(prev) => {
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
													onBlur={() => {
														// Delay to allow click on suggestion
														const unitSuggestionTimeoutId =
															setTimeout(() => {
																setActiveUnitSuggestionIndex(
																	(
																		current
																	) => {
																		// Only close if this is still the active index
																		// (might have changed if user focused another input)
																		return current ===
																			index
																			? null
																			: current;
																	}
																);
																setUnitSuggestionTimeouts(
																	(prev) => {
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
															}, 200);
														setUnitSuggestionTimeouts(
															(prev) => ({
																...prev,
																[index]:
																	unitSuggestionTimeoutId,
															})
														);
														// Clean up empty rows after blur
														const timeoutId =
															setTimeout(() => {
																cleanupEmptyRows();
																setCleanupTimeouts(
																	(prev) => {
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
															}, 200);
														setCleanupTimeouts(
															(prev) => ({
																...prev,
																[index]:
																	timeoutId,
															})
														);
													}}
												/>
												{activeUnitSuggestionIndex ===
													index && (
													<UnitSuggestions
														searchTerm={
															unitSuggestionSearchTerms[
																index
															] ?? ingredient.unit
														}
														allUnits={allUnits}
														onSelect={(
															selectedUnit
														) => {
															// Cancel any pending unit suggestion timeout
															if (
																unitSuggestionTimeouts[
																	index
																]
															) {
																clearTimeout(
																	unitSuggestionTimeouts[
																		index
																	]
																);
																setUnitSuggestionTimeouts(
																	(prev) => {
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
															updateIngredientField(
																index,
																'unit',
																selectedUnit
															);
															setUnitSuggestionSearchTerms(
																(prev) => ({
																	...prev,
																	[index]:
																		selectedUnit,
																})
															);
															setActiveUnitSuggestionIndex(
																null
															);
														}}
													/>
												)}
											</div>
											<div className='flex-1 relative'>
												<Input
													className='w-full'
													placeholder='Ingredient name'
													value={ingredient.item}
													onChange={(event) => {
														const value =
															event.target.value;
														updateIngredientField(
															index,
															'item',
															value
														);
														setSuggestionSearchTerms(
															(prev) => ({
																...prev,
																[index]: value,
															})
														);
														setActiveSuggestionIndex(
															index
														);
													}}
													onFocus={() => {
														// Cancel any pending suggestion timeout for this row
														if (
															suggestionTimeouts[
																index
															]
														) {
															clearTimeout(
																suggestionTimeouts[
																	index
																]
															);
															setSuggestionTimeouts(
																(prev) => {
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
														setActiveSuggestionIndex(
															index
														);
														setSuggestionSearchTerms(
															(prev) => ({
																...prev,
																[index]:
																	ingredient.item,
															})
														);
														// Cancel any pending cleanup for this row
														if (
															cleanupTimeouts[
																index
															]
														) {
															clearTimeout(
																cleanupTimeouts[
																	index
																]
															);
															setCleanupTimeouts(
																(prev) => {
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
													onBlur={() => {
														// Delay to allow click on suggestion
														const suggestionTimeoutId =
															setTimeout(() => {
																setActiveSuggestionIndex(
																	(
																		current
																	) => {
																		// Only close if this is still the active index
																		// (might have changed if user focused another input)
																		return current ===
																			index
																			? null
																			: current;
																	}
																);
																setSuggestionTimeouts(
																	(prev) => {
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
															}, 200);
														setSuggestionTimeouts(
															(prev) => ({
																...prev,
																[index]:
																	suggestionTimeoutId,
															})
														);
														// Clean up empty rows after blur
														const timeoutId =
															setTimeout(() => {
																cleanupEmptyRows();
																setCleanupTimeouts(
																	(prev) => {
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
															}, 200);
														setCleanupTimeouts(
															(prev) => ({
																...prev,
																[index]:
																	timeoutId,
															})
														);
													}}
												/>
												{activeSuggestionIndex ===
													index && (
													<IngredientSuggestions
														searchTerm={
															suggestionSearchTerms[
																index
															] ?? ingredient.item
														}
														allIngredients={
															allIngredients
														}
														onSelect={(
															selectedItem
														) => {
															// Cancel any pending suggestion timeout
															if (
																suggestionTimeouts[
																	index
																]
															) {
																clearTimeout(
																	suggestionTimeouts[
																		index
																	]
																);
																setSuggestionTimeouts(
																	(prev) => {
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
															updateIngredientField(
																index,
																'item',
																selectedItem
															);
															setSuggestionSearchTerms(
																(prev) => ({
																	...prev,
																	[index]:
																		selectedItem,
																})
															);
															setActiveSuggestionIndex(
																null
															);
														}}
													/>
												)}
											</div>
											{!isIngredientRowEmpty(
												ingredient
											) && (
												<Button
													variant='outline'
													size='sm'
													onClick={() =>
														removeIngredientRow(
															index
														)
													}
													type='button'>
													Remove
												</Button>
											)}
										</div>
										<div className='w-full relative'>
											<Input
												className='w-full text-sm'
												placeholder='Forms (comma-separated, e.g., diced, chopped, minced)'
												value={
													formInputValues[index] ??
													ingredient.forms.join(', ')
												}
												onChange={(event) => {
													const value =
														event.target.value;

													// Store the raw input value to allow free typing
													setFormInputValues(
														(prev) => ({
															...prev,
															[index]: value,
														})
													);

													// Extract the last form being typed (after last comma) for suggestions
													const lastCommaIndex =
														value.lastIndexOf(',');
													const currentFormInput =
														lastCommaIndex >= 0
															? value
																	.substring(
																		lastCommaIndex +
																			1
																	)
																	.trim()
															: value.trim();

													// Update forms array - include all completed forms plus the current partial one
													const completedForms =
														lastCommaIndex >= 0
															? value
																	.substring(
																		0,
																		lastCommaIndex
																	)
																	.split(',')
																	.map((f) =>
																		f.trim()
																	)
																	.filter(
																		(f) =>
																			f.length >
																			0
																	)
															: [];

													// Only add currentFormInput to forms if it's not empty
													const forms =
														currentFormInput.length >
														0
															? [
																	...completedForms,
																	currentFormInput,
															  ]
															: completedForms;

													updateIngredientField(
														index,
														'forms',
														forms
													);
													setFormSuggestionSearchTerms(
														(prev) => ({
															...prev,
															[index]:
																currentFormInput,
														})
													);
													setActiveFormSuggestionIndex(
														index
													);
												}}
												onFocus={() => {
													// Cancel any pending form suggestion timeout for this row
													if (
														formSuggestionTimeouts[
															index
														]
													) {
														clearTimeout(
															formSuggestionTimeouts[
																index
															]
														);
														setFormSuggestionTimeouts(
															(prev) => {
																const next = {
																	...prev,
																};
																delete next[
																	index
																];
																return next;
															}
														);
													}
													setActiveFormSuggestionIndex(
														index
													);
													const currentValue =
														formInputValues[
															index
														] ??
														ingredient.forms.join(
															', '
														);
													const lastCommaIndex =
														currentValue.lastIndexOf(
															','
														);
													const currentFormInput =
														lastCommaIndex >= 0
															? currentValue
																	.substring(
																		lastCommaIndex +
																			1
																	)
																	.trim()
															: currentValue.trim();
													setFormSuggestionSearchTerms(
														(prev) => ({
															...prev,
															[index]:
																currentFormInput,
														})
													);
													// Cancel any pending cleanup for this row
													if (
														cleanupTimeouts[index]
													) {
														clearTimeout(
															cleanupTimeouts[
																index
															]
														);
														setCleanupTimeouts(
															(prev) => {
																const next = {
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
												onBlur={() => {
													// When blurring, sync the input value with the forms array
													const currentValue =
														formInputValues[index];
													if (
														currentValue !==
														undefined
													) {
														// Parse the final value and update forms
														const finalForms =
															currentValue
																.split(',')
																.map((f) =>
																	f.trim()
																)
																.filter(
																	(f) =>
																		f.length >
																		0
																);
														updateIngredientField(
															index,
															'forms',
															finalForms
														);
														// Clear the temporary input value
														setFormInputValues(
															(prev) => {
																const next = {
																	...prev,
																};
																delete next[
																	index
																];
																return next;
															}
														);
													}
													// Delay to allow click on suggestion
													const formSuggestionTimeoutId =
														setTimeout(() => {
															setActiveFormSuggestionIndex(
																(current) => {
																	// Only close if this is still the active index
																	// (might have changed if user focused another input)
																	return current ===
																		index
																		? null
																		: current;
																}
															);
															setFormSuggestionTimeouts(
																(prev) => {
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
														}, 200);
													setFormSuggestionTimeouts(
														(prev) => ({
															...prev,
															[index]:
																formSuggestionTimeoutId,
														})
													);
													// Clean up empty rows after blur
													const timeoutId =
														setTimeout(() => {
															cleanupEmptyRows();
															setCleanupTimeouts(
																(prev) => {
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
														}, 200);
													setCleanupTimeouts(
														(prev) => ({
															...prev,
															[index]: timeoutId,
														})
													);
												}}
											/>
											{activeFormSuggestionIndex ===
												index && (
												<FormSuggestions
													searchTerm={
														formSuggestionSearchTerms[
															index
														] ?? ''
													}
													allForms={allForms}
													currentForms={
														ingredient.forms
													}
													onSelect={(
														selectedForm
													) => {
														// Cancel any pending form suggestion timeout
														if (
															formSuggestionTimeouts[
																index
															]
														) {
															clearTimeout(
																formSuggestionTimeouts[
																	index
																]
															);
															setFormSuggestionTimeouts(
																(prev) => {
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
														const currentValue =
															formInputValues[
																index
															] ??
															ingredient.forms.join(
																', '
															);
														const lastCommaIndex =
															currentValue.lastIndexOf(
																','
															);

														// Build the new value: completed forms + selected form
														let newValue: string;
														if (
															lastCommaIndex >= 0
														) {
															// Replace everything after the last comma with the selected form
															const beforeComma =
																currentValue
																	.substring(
																		0,
																		lastCommaIndex +
																			1
																	)
																	.trim();
															newValue = `${beforeComma} ${selectedForm}`;
														} else {
															// No comma, replace the entire value or append
															if (
																currentValue.trim()
																	.length > 0
															) {
																newValue =
																	selectedForm;
															} else {
																newValue =
																	selectedForm;
															}
														}

														// Update the input value
														setFormInputValues(
															(prev) => ({
																...prev,
																[index]:
																	newValue,
															})
														);

														// Update forms array - parse the new value
														const updatedForms =
															newValue
																.split(',')
																.map((f) =>
																	f.trim()
																)
																.filter(
																	(f) =>
																		f.length >
																		0
																);

														updateIngredientField(
															index,
															'forms',
															updatedForms
														);
														setFormSuggestionSearchTerms(
															(prev) => ({
																...prev,
																[index]: '',
															})
														);
														setActiveFormSuggestionIndex(
															null
														);
													}}
												/>
											)}
										</div>
									</div>
								</Card>
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
						<Button onClick={submit} type='button'>
							{isEditing ? 'Update recipe' : 'Add recipe'}
						</Button>
						{isEditing && (
							<Button
								variant='outline'
								onClick={resetForm}
								type='button'>
								Cancel
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
			<section className='flex flex-col gap-4'>
				<h2 className='text-xl lg:text-2xl font-semibold'>
					Existing recipes
				</h2>
				{recipes.length === 0 ? (
					<p className='text-sm text-muted-foreground'>
						No recipes yet.
					</p>
				) : (
					<div className='flex flex-col gap-4'>
						{recipes.map((recipe) => {
							const recipeIngredients = Array.isArray(
								recipe.ingredients
							)
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
													onClick={() =>
														handleEdit(recipe)
													}>
													Edit
												</Button>
												<Button
													variant='destructive'
													size='sm'
													onClick={() =>
														handleDelete(recipe._id)
													}>
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
														(
															ingredient: {
																item: string;
																forms?:
																	| string[]
																	| null;
																quantity?: {
																	amount?:
																		| number
																		| null;
																	unit?:
																		| string
																		| null;
																} | null;
															},
															index: number
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
																	.join(' ');

															const formsText =
																ingredient.forms &&
																ingredient.forms
																	.length > 0
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
				)}
			</section>

			{/* Unused Ingredients Section */}
			<Card>
				<CardHeader>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<CardTitle>Unused Ingredients</CardTitle>
							<p className='text-sm text-muted-foreground mt-1'>
								Ingredients that are not used in any recipe
							</p>
						</div>
						{unusedIngredients.length > 0 && (
							<Button
								variant='destructive'
								size='sm'
								onClick={handleRemoveUnusedIngredients}>
								Delete All ({unusedIngredients.length})
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{unusedIngredients.length > 0 ? (
						<div className='flex flex-wrap gap-2'>
							{unusedIngredients.map((ingredient) => (
								<Badge
									key={ingredient._id}
									variant='secondary'
									className='group'>
									{ingredient.item}
									<Button
										variant='ghost'
										size='icon'
										className='ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity'
										onClick={() =>
											handleRemoveIngredient(
												ingredient._id
											)
										}
										title='Delete ingredient'>
										<X className='h-3 w-3' />
									</Button>
								</Badge>
							))}
						</div>
					) : (
						<p className='text-sm text-muted-foreground'>
							No unused ingredients. All ingredients are being
							used in recipes.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Unused Ingredient Forms Section */}
			<Card>
				<CardHeader>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<CardTitle>Unused Ingredient Forms</CardTitle>
							<p className='text-sm text-muted-foreground mt-1'>
								Forms that are not used in any recipe
							</p>
						</div>
						{unusedIngredientForms.length > 0 && (
							<Button
								variant='destructive'
								size='sm'
								onClick={handleRemoveUnusedIngredientForms}>
								Delete All ({unusedIngredientForms.length})
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{unusedIngredientForms.length > 0 ? (
						<div className='flex flex-wrap gap-2'>
							{unusedIngredientForms.map((form) => (
								<Badge
									key={form._id}
									variant='secondary'
									className='group'>
									{form.form}
									<Button
										variant='ghost'
										size='icon'
										className='ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity'
										onClick={() =>
											handleRemoveIngredientForm(form._id)
										}
										title='Delete form'>
										<X className='h-3 w-3' />
									</Button>
								</Badge>
							))}
						</div>
					) : (
						<p className='text-sm text-muted-foreground'>
							No unused ingredient forms. All forms are being used
							in recipes.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Unused Units Section */}
			<Card>
				<CardHeader>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<CardTitle>Unused Units</CardTitle>
							<p className='text-sm text-muted-foreground mt-1'>
								Units that are not used in any recipe
							</p>
						</div>
						{unusedUnits.length > 0 && (
							<Button
								variant='destructive'
								size='sm'
								onClick={handleRemoveUnusedUnits}>
								Delete All ({unusedUnits.length})
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{unusedUnits.length > 0 ? (
						<div className='flex flex-wrap gap-2'>
							{unusedUnits.map((unit) => (
								<Badge
									key={unit._id}
									variant='secondary'
									className='group'>
									{unit.unit}
									<Button
										variant='ghost'
										size='icon'
										className='ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity'
										onClick={() =>
											handleRemoveUnit(unit._id)
										}
										title='Delete unit'>
										<X className='h-3 w-3' />
									</Button>
								</Badge>
							))}
						</div>
					) : (
						<p className='text-sm text-muted-foreground'>
							No unused units. All units are being used in
							recipes.
						</p>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
