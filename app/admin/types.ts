export type IngredientInput = {
	item: string;
	amount: string;
	unit: string;
	forms: string[]; // Array of form names
	core: boolean;
};

export const createEmptyIngredient = (): IngredientInput => ({
	item: '',
	amount: '',
	unit: '',
	forms: [],
	core: false,
});

export const isIngredientRowEmpty = (ingredient: IngredientInput) => {
	return (
		ingredient.item.trim().length === 0 &&
		ingredient.amount.trim().length === 0 &&
		ingredient.unit.trim().length === 0 &&
		ingredient.forms.every((form) => form.trim().length === 0)
	);
};
