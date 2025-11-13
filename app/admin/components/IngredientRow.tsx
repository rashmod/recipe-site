'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Suggestions } from './Suggestions';
import type { IngredientInput } from '../types';

type IngredientRowProps = {
	ingredient: IngredientInput;
	index: number;
	allIngredients: string[];
	allUnits: string[];
	allForms: string[];
	onUpdate: <Key extends keyof IngredientInput>(
		index: number,
		field: Key,
		value: IngredientInput[Key]
	) => void;
	onRemove: (index: number) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	isEmpty: boolean;
};

export function IngredientRow({
	ingredient,
	index,
	allIngredients,
	allUnits,
	allForms,
	onUpdate,
	onRemove,
	onFocus,
	onBlur,
	isEmpty,
}: IngredientRowProps) {
	const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<
		'item' | 'unit' | 'form' | null
	>(null);
	const [suggestionSearchTerms, setSuggestionSearchTerms] = useState({
		item: ingredient.item,
		unit: ingredient.unit,
		form: '',
	});
	const [formInputValue, setFormInputValue] = useState<string>(
		ingredient.forms.join(', ')
	);

	const handleItemChange = (value: string) => {
		onUpdate(index, 'item', value);
		setSuggestionSearchTerms((prev) => ({ ...prev, item: value }));
		setActiveSuggestionIndex('item');
	};

	const handleItemSelect = (selectedItem: string) => {
		onUpdate(index, 'item', selectedItem);
		setSuggestionSearchTerms((prev) => ({ ...prev, item: selectedItem }));
		setActiveSuggestionIndex(null);
	};

	const handleUnitChange = (value: string) => {
		onUpdate(index, 'unit', value);
		setSuggestionSearchTerms((prev) => ({ ...prev, unit: value }));
		setActiveSuggestionIndex('unit');
	};

	const handleUnitSelect = (selectedUnit: string) => {
		onUpdate(index, 'unit', selectedUnit);
		setSuggestionSearchTerms((prev) => ({ ...prev, unit: selectedUnit }));
		setActiveSuggestionIndex(null);
	};

	const handleFormChange = (value: string) => {
		setFormInputValue(value);

		const lastCommaIndex = value.lastIndexOf(',');
		const currentFormInput =
			lastCommaIndex >= 0
				? value.substring(lastCommaIndex + 1).trim()
				: value.trim();

		const completedForms =
			lastCommaIndex >= 0
				? value
						.substring(0, lastCommaIndex)
						.split(',')
						.map((f) => f.trim())
						.filter((f) => f.length > 0)
				: [];

		const forms =
			currentFormInput.length > 0
				? [...completedForms, currentFormInput]
				: completedForms;

		onUpdate(index, 'forms', forms);
		setSuggestionSearchTerms((prev) => ({
			...prev,
			form: currentFormInput,
		}));
		setActiveSuggestionIndex('form');
	};

	const handleFormSelect = (selectedForm: string) => {
		const lastCommaIndex = formInputValue.lastIndexOf(',');

		let newValue: string;
		if (lastCommaIndex >= 0) {
			const beforeComma = formInputValue
				.substring(0, lastCommaIndex + 1)
				.trim();
			newValue = `${beforeComma} ${selectedForm}`;
		} else {
			newValue = selectedForm;
		}

		setFormInputValue(newValue);

		const updatedForms = newValue
			.split(',')
			.map((f) => f.trim())
			.filter((f) => f.length > 0);

		onUpdate(index, 'forms', updatedForms);
		setSuggestionSearchTerms((prev) => ({ ...prev, form: '' }));
		setActiveSuggestionIndex(null);
	};

	const handleFormBlur = () => {
		const finalForms = formInputValue
			.split(',')
			.map((f) => f.trim())
			.filter((f) => f.length > 0);
		onUpdate(index, 'forms', finalForms);
		setFormInputValue(finalForms.join(', '));
		setActiveSuggestionIndex(null);
	};

	const availableForms = allForms.filter(
		(form) => !ingredient.forms.includes(form)
	);

	return (
		<Card className='p-3'>
			<div className='flex flex-col gap-2'>
				<div className='flex flex-wrap items-center gap-2'>
					<Input
						className='w-24'
						inputMode='decimal'
						placeholder='Amount'
						value={ingredient.amount}
						onChange={(event) =>
							onUpdate(index, 'amount', event.target.value)
						}
						onFocus={onFocus}
						onBlur={onBlur}
					/>
					<div className='w-28 relative'>
						<Input
							className='w-full'
							placeholder='Unit'
							value={ingredient.unit}
							onChange={(event) =>
								handleUnitChange(event.target.value)
							}
							onFocus={() => {
								setActiveSuggestionIndex('unit');
								setSuggestionSearchTerms((prev) => ({
									...prev,
									unit: ingredient.unit,
								}));
								onFocus?.();
							}}
							onBlur={() => {
								setTimeout(() => {
									setActiveSuggestionIndex((current) =>
										current === 'unit' ? null : current
									);
								}, 200);
								onBlur?.();
							}}
						/>
						{activeSuggestionIndex === 'unit' && (
							<Suggestions
								searchTerm={
									suggestionSearchTerms.unit ??
									ingredient.unit
								}
								items={allUnits}
								onSelect={handleUnitSelect}
							/>
						)}
					</div>
					<div className='flex-1 relative'>
						<Input
							className='w-full'
							placeholder='Ingredient name'
							value={ingredient.item}
							onChange={(event) =>
								handleItemChange(event.target.value)
							}
							onFocus={() => {
								setActiveSuggestionIndex('item');
								setSuggestionSearchTerms((prev) => ({
									...prev,
									item: ingredient.item,
								}));
								onFocus?.();
							}}
							onBlur={() => {
								setTimeout(() => {
									setActiveSuggestionIndex((current) =>
										current === 'item' ? null : current
									);
								}, 200);
								onBlur?.();
							}}
						/>
						{activeSuggestionIndex === 'item' && (
							<Suggestions
								searchTerm={
									suggestionSearchTerms.item ??
									ingredient.item
								}
								items={allIngredients}
								onSelect={handleItemSelect}
							/>
						)}
					</div>
					{!isEmpty && (
						<Button
							variant='outline'
							size='sm'
							onClick={() => onRemove(index)}
							type='button'>
							Remove
						</Button>
					)}
				</div>
				<div className='w-full relative'>
					<Input
						className='w-full text-sm'
						placeholder='Forms (comma-separated, e.g., diced, chopped, minced)'
						value={formInputValue}
						onChange={(event) =>
							handleFormChange(event.target.value)
						}
						onFocus={() => {
							const lastCommaIndex =
								formInputValue.lastIndexOf(',');
							const currentFormInput =
								lastCommaIndex >= 0
									? formInputValue
											.substring(lastCommaIndex + 1)
											.trim()
									: formInputValue.trim();
							setSuggestionSearchTerms((prev) => ({
								...prev,
								form: currentFormInput,
							}));
							setActiveSuggestionIndex('form');
							onFocus?.();
						}}
						onBlur={() => {
							handleFormBlur();
							setTimeout(() => {
								setActiveSuggestionIndex((current) =>
									current === 'form' ? null : current
								);
							}, 200);
							onBlur?.();
						}}
					/>
					{activeSuggestionIndex === 'form' && (
						<Suggestions
							searchTerm={suggestionSearchTerms.form ?? ''}
							items={availableForms}
							onSelect={handleFormSelect}
						/>
					)}
				</div>
			</div>
		</Card>
	);
}
