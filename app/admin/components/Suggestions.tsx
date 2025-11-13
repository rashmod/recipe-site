'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

type SuggestionsProps = {
	searchTerm: string;
	items: string[];
	onSelect: (item: string) => void;
	filterFn?: (item: string, searchTerm: string) => boolean;
};

export function Suggestions({
	searchTerm,
	items,
	onSelect,
	filterFn,
}: SuggestionsProps) {
	const suggestions = useMemo(() => {
		const filtered = filterFn
			? items.filter((item) => filterFn(item, searchTerm))
			: items.filter((item) =>
					item.toLowerCase().includes(searchTerm.toLowerCase().trim())
			  );

		return filtered;
	}, [items, searchTerm, filterFn]);

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
