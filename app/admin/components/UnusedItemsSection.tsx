'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

type UnusedItem = {
	_id: Id<'ingredients'> | Id<'ingredientForm'> | Id<'units'>;
	item?: string;
	form?: string;
	unit?: string;
};

type UnusedItemsSectionProps = {
	title: string;
	description: string;
	items: UnusedItem[];
	onDeleteItem: (id: Id<'ingredients'> | Id<'ingredientForm'> | Id<'units'>) => void;
	onDeleteAll: () => void;
	getItemLabel: (item: UnusedItem) => string;
};

export function UnusedItemsSection({
	title,
	description,
	items,
	onDeleteItem,
	onDeleteAll,
	getItemLabel,
}: UnusedItemsSectionProps) {
	return (
		<Card>
			<CardHeader>
				<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
					<div>
						<CardTitle>{title}</CardTitle>
						<p className='text-sm text-muted-foreground mt-1'>
							{description}
						</p>
					</div>
					{items.length > 0 && (
						<Button variant='destructive' size='sm' onClick={onDeleteAll}>
							Delete All ({items.length})
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{items.length > 0 ? (
					<div className='flex flex-wrap gap-2'>
						{items.map((item) => (
							<Badge
								key={item._id}
								variant='secondary'
								className='group'>
								{getItemLabel(item)}
								<Button
									variant='ghost'
									size='icon'
									className='ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity'
									onClick={() => onDeleteItem(item._id)}
									title={`Delete ${title.toLowerCase()}`}>
									<X className='h-3 w-3' />
								</Button>
							</Badge>
						))}
					</div>
				) : (
					<p className='text-sm text-muted-foreground'>
						No unused {title.toLowerCase()}. All {title.toLowerCase()} are
						being used in recipes.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

