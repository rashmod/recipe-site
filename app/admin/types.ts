export type IngredientInput = {
	item: string;
	amount: string;
	unit: string;
	forms: string[]; // Array of form names
};

export const createEmptyIngredient = (): IngredientInput => ({
	item: '',
	amount: '',
	unit: '',
	forms: [],
});

export const isIngredientRowEmpty = (ingredient: IngredientInput) => {
	return (
		ingredient.item.trim().length === 0 &&
		ingredient.amount.trim().length === 0 &&
		ingredient.unit.trim().length === 0 &&
		ingredient.forms.every((form) => form.trim().length === 0)
	);
};

