'use client';

import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

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
		<ul className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto'>
			{suggestions.map((suggestion, idx) => (
				<li
					key={idx}
					className='px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm'
					onMouseDown={(e) => {
						e.preventDefault(); // Prevent input blur
						onSelect(suggestion);
					}}>
					{suggestion}
				</li>
			))}
		</ul>
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
		<ul className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto'>
			{suggestions.map((suggestion, idx) => (
				<li
					key={idx}
					className='px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm'
					onMouseDown={(e) => {
						e.preventDefault(); // Prevent input blur
						onSelect(suggestion);
					}}>
					{suggestion}
				</li>
			))}
		</ul>
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
		<ul className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto'>
			{suggestions.map((suggestion, idx) => (
				<li
					key={idx}
					className='px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm'
					onMouseDown={(e) => {
						e.preventDefault(); // Prevent input blur
						onSelect(suggestion);
					}}>
					{suggestion}
				</li>
			))}
		</ul>
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

	const isEditing = useMemo(() => editingId !== null, [editingId]);

	const resetForm = () => {
		setTitle('');
		setIngredients([createEmptyIngredient()]);
		setInstructions('');
		setEditingId(null);
		setFormInputValues({});
		setFormSuggestionSearchTerms({});
	};

	const updateIngredientField = <Key extends keyof IngredientInput>(
		index: number,
		field: Key,
		value: IngredientInput[Key]
	) => {
		setIngredients((current) =>
			current.map((ingredient, idx) =>
				idx === index ? { ...ingredient, [field]: value } : ingredient
			)
		);
	};

	const addIngredientRow = () => {
		setIngredients((current) => [...current, createEmptyIngredient()]);
	};

	const removeIngredientRow = (index: number) => {
		setIngredients((current) => {
			const next = current.filter((_, idx) => idx !== index);
			return next.length > 0 ? next : [createEmptyIngredient()];
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
		setIngredients(
			ingredientList.length > 0
				? ingredientList.map((ingredient) => ({
						item: ingredient.item ?? '',
						amount:
							ingredient.quantity?.amount !== undefined &&
							ingredient.quantity?.amount !== null
								? String(ingredient.quantity.amount)
								: '',
						unit: ingredient.quantity?.unit ?? '',
						forms: ingredient.forms ?? [],
				  }))
				: [createEmptyIngredient()]
		);
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
		<main className='flex flex-col gap-6 p-6'>
			<header className='flex items-center justify-between'>
				<h1 className='text-3xl font-bold text-gray-900'>Admin</h1>
				<nav className='flex items-center gap-3 text-sm font-medium'>
					<Link
						className='text-blue-600 underline-offset-2 hover:underline'
						href='/'>
						View recipes
					</Link>
					<Link
						className='text-blue-600 underline-offset-2 hover:underline'
						href='/admin/login'>
						Admin login
					</Link>
				</nav>
			</header>
			<section className='flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium text-gray-800'>
						Title
					</label>
					<input
						className='rounded border border-gray-300 p-2'
						placeholder='Title'
						value={title}
						onChange={(event) => setTitle(event.target.value)}
					/>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium text-gray-800'>
						Ingredients
					</label>
					<div className='flex flex-col gap-3'>
						{ingredients.map((ingredient, index) => (
							<div
								key={`ingredient-${index}`}
								className='flex flex-col gap-2 p-3 border border-gray-200 rounded-md'>
								<div className='flex flex-wrap items-center gap-2'>
									<input
										className='w-24 rounded border border-gray-300 p-2'
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
									/>
									<div className='w-28 relative'>
										<input
											className='w-full rounded border border-gray-300 p-2'
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
											}}
											onBlur={() => {
												// Delay to allow click on suggestion
												setTimeout(() => {
													setActiveUnitSuggestionIndex(
														null
													);
												}, 200);
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
												onSelect={(selectedUnit) => {
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
										<input
											className='w-full rounded border border-gray-300 p-2'
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
												setActiveSuggestionIndex(index);
											}}
											onFocus={() => {
												setActiveSuggestionIndex(index);
												setSuggestionSearchTerms(
													(prev) => ({
														...prev,
														[index]:
															ingredient.item,
													})
												);
											}}
											onBlur={() => {
												// Delay to allow click on suggestion
												setTimeout(() => {
													setActiveSuggestionIndex(
														null
													);
												}, 200);
											}}
										/>
										{activeSuggestionIndex === index && (
											<IngredientSuggestions
												searchTerm={
													suggestionSearchTerms[
														index
													] ?? ingredient.item
												}
												allIngredients={allIngredients}
												onSelect={(selectedItem) => {
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
									<button
										className='rounded border border-gray-300 px-2 text-sm text-gray-600 hover:bg-gray-100'
										onClick={() =>
											removeIngredientRow(index)
										}
										type='button'>
										Remove
									</button>
								</div>
								<div className='w-full relative'>
									<input
										className='w-full rounded border border-gray-300 p-2 text-sm'
										placeholder='Forms (comma-separated, e.g., diced, chopped, minced)'
										value={
											formInputValues[index] ??
											ingredient.forms.join(', ')
										}
										onChange={(event) => {
											const value = event.target.value;

											// Store the raw input value to allow free typing
											setFormInputValues((prev) => ({
												...prev,
												[index]: value,
											}));

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
																	f.length > 0
															)
													: [];

											// Only add currentFormInput to forms if it's not empty
											const forms =
												currentFormInput.length > 0
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
													[index]: currentFormInput,
												})
											);
											setActiveFormSuggestionIndex(index);
										}}
										onFocus={() => {
											setActiveFormSuggestionIndex(index);
											const currentValue =
												formInputValues[index] ??
												ingredient.forms.join(', ');
											const lastCommaIndex =
												currentValue.lastIndexOf(',');
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
													[index]: currentFormInput,
												})
											);
										}}
										onBlur={() => {
											// When blurring, sync the input value with the forms array
											const currentValue =
												formInputValues[index];
											if (currentValue !== undefined) {
												// Parse the final value and update forms
												const finalForms = currentValue
													.split(',')
													.map((f) => f.trim())
													.filter(
														(f) => f.length > 0
													);
												updateIngredientField(
													index,
													'forms',
													finalForms
												);
												// Clear the temporary input value
												setFormInputValues((prev) => {
													const next = { ...prev };
													delete next[index];
													return next;
												});
											}
											// Delay to allow click on suggestion
											setTimeout(() => {
												setActiveFormSuggestionIndex(
													null
												);
											}, 200);
										}}
									/>
									{activeFormSuggestionIndex === index && (
										<FormSuggestions
											searchTerm={
												formSuggestionSearchTerms[
													index
												] ?? ''
											}
											allForms={allForms}
											currentForms={ingredient.forms}
											onSelect={(selectedForm) => {
												const currentValue =
													formInputValues[index] ??
													ingredient.forms.join(', ');
												const lastCommaIndex =
													currentValue.lastIndexOf(
														','
													);

												// Build the new value: completed forms + selected form
												let newValue: string;
												if (lastCommaIndex >= 0) {
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
														newValue = selectedForm;
													} else {
														newValue = selectedForm;
													}
												}

												// Update the input value
												setFormInputValues((prev) => ({
													...prev,
													[index]: newValue,
												}));

												// Update forms array - parse the new value
												const updatedForms = newValue
													.split(',')
													.map((f) => f.trim())
													.filter(
														(f) => f.length > 0
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
						))}
						<button
							className='self-start rounded border border-blue-600 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50'
							onClick={addIngredientRow}
							type='button'>
							Add ingredient
						</button>
					</div>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-medium text-gray-800'>
						Instructions
					</label>
					<textarea
						className='rounded border border-gray-300 p-2'
						placeholder='Instructions'
						rows={6}
						value={instructions}
						onChange={(event) =>
							setInstructions(event.target.value)
						}
					/>
				</div>
				<div className='flex items-center gap-2'>
					<button
						className='rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700'
						onClick={submit}
						type='button'>
						{isEditing ? 'Update recipe' : 'Add recipe'}
					</button>
					{isEditing && (
						<button
							className='rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
							onClick={resetForm}
							type='button'>
							Cancel
						</button>
					)}
				</div>
			</section>
			<section className='flex flex-col gap-4'>
				<h2 className='text-2xl font-semibold text-gray-900'>
					Existing recipes
				</h2>
				{recipes.length === 0 ? (
					<p className='text-sm text-gray-600'>No recipes yet.</p>
				) : (
					<ul className='flex flex-col gap-4'>
						{recipes.map((recipe) => {
							const recipeIngredients = Array.isArray(
								recipe.ingredients
							)
								? recipe.ingredients
								: [];
							return (
								<li
									key={recipe._id}
									className='flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
									<div className='flex items-center justify-between'>
										<h3 className='text-lg font-medium text-gray-900'>
											{recipe.title}
										</h3>
										<div className='flex items-center gap-2'>
											<button
												className='rounded border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50'
												onClick={() =>
													handleEdit(recipe)
												}>
												Edit
											</button>
											<button
												className='rounded border border-red-600 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50'
												onClick={() =>
													handleDelete(recipe._id)
												}>
												Delete
											</button>
										</div>
									</div>
									<div className='text-sm text-gray-600'>
										<strong>Ingredients:</strong>
										{recipeIngredients.length > 0 ? (
											<ul className='mt-1 list-disc pl-5'>
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
															ingredient.quantity
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
														const quantityText = [
															formattedAmount,
															unit,
														]
															.filter(
																(value) =>
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
																	<span className='font-medium text-gray-900'>
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
																		<span className='text-gray-500 italic'>
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
											<p className='mt-1 text-gray-500'>
												No ingredients listed.
											</p>
										)}
									</div>
									<div className='text-sm text-gray-600'>
										<strong>Instructions:</strong>
										<p className='whitespace-pre-line'>
											{recipe.instructions}
										</p>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</section>

			{/* Unused Ingredients Section */}
			<section className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
				<div className='flex items-center justify-between mb-4'>
					<div>
						<h2 className='text-xl font-semibold text-gray-900'>
							Unused Ingredients
						</h2>
						<p className='text-sm text-gray-600 mt-1'>
							Ingredients that are not used in any recipe
						</p>
					</div>
					{unusedIngredients.length > 0 && (
						<button
							onClick={handleRemoveUnusedIngredients}
							className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium'>
							Delete All ({unusedIngredients.length})
						</button>
					)}
				</div>

				{unusedIngredients.length > 0 ? (
					<div className='space-y-2'>
						<ul className='flex flex-wrap gap-2'>
							{unusedIngredients.map((ingredient) => (
								<li
									key={ingredient._id}
									className='flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm group'>
									<span>{ingredient.item}</span>
									<button
										onClick={() =>
											handleRemoveIngredient(
												ingredient._id
											)
										}
										className='opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 font-medium'
										title='Delete ingredient'>
										×
									</button>
								</li>
							))}
						</ul>
					</div>
				) : (
					<p className='text-sm text-gray-500'>
						No unused ingredients. All ingredients are being used in
						recipes.
					</p>
				)}
			</section>

			{/* Unused Ingredient Forms Section */}
			<section className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
				<div className='flex items-center justify-between mb-4'>
					<div>
						<h2 className='text-xl font-semibold text-gray-900'>
							Unused Ingredient Forms
						</h2>
						<p className='text-sm text-gray-600 mt-1'>
							Forms that are not used in any recipe
						</p>
					</div>
					{unusedIngredientForms.length > 0 && (
						<button
							onClick={handleRemoveUnusedIngredientForms}
							className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium'>
							Delete All ({unusedIngredientForms.length})
						</button>
					)}
				</div>

				{unusedIngredientForms.length > 0 ? (
					<div className='space-y-2'>
						<ul className='flex flex-wrap gap-2'>
							{unusedIngredientForms.map((form) => (
								<li
									key={form._id}
									className='flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm group'>
									<span>{form.form}</span>
									<button
										onClick={() =>
											handleRemoveIngredientForm(form._id)
										}
										className='opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 font-medium'
										title='Delete form'>
										×
									</button>
								</li>
							))}
						</ul>
					</div>
				) : (
					<p className='text-sm text-gray-500'>
						No unused ingredient forms. All forms are being used in
						recipes.
					</p>
				)}
			</section>

			{/* Unused Units Section */}
			<section className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
				<div className='flex items-center justify-between mb-4'>
					<div>
						<h2 className='text-xl font-semibold text-gray-900'>
							Unused Units
						</h2>
						<p className='text-sm text-gray-600 mt-1'>
							Units that are not used in any recipe
						</p>
					</div>
					{unusedUnits.length > 0 && (
						<button
							onClick={handleRemoveUnusedUnits}
							className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium'>
							Delete All ({unusedUnits.length})
						</button>
					)}
				</div>

				{unusedUnits.length > 0 ? (
					<div className='space-y-2'>
						<ul className='flex flex-wrap gap-2'>
							{unusedUnits.map((unit) => (
								<li
									key={unit._id}
									className='flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm group'>
									<span>{unit.unit}</span>
									<button
										onClick={() =>
											handleRemoveUnit(unit._id)
										}
										className='opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 font-medium'
										title='Delete unit'>
										×
									</button>
								</li>
							))}
						</ul>
					</div>
				) : (
					<p className='text-sm text-gray-500'>
						No unused units. All units are being used in recipes.
					</p>
				)}
			</section>
		</main>
	);
}
