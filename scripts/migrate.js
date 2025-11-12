#!/usr/bin/env node
/**
 * Migration script to import ingredients and recipes from JSONL files
 *
 * Usage:
 *   node scripts/migrate.js
 *
 * Make sure CONVEX_URL is set in your environment
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { ConvexHttpClient } = require('convex/browser');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
	const envPath = path.join(process.cwd(), '.env.local');
	const envPathFallback = path.join(process.cwd(), '.env');

	// Try to use dotenv if available
	try {
		const dotenv = require('dotenv');
		if (fs.existsSync(envPath)) {
			dotenv.config({ path: envPath });
			return;
		}
		if (fs.existsSync(envPathFallback)) {
			dotenv.config({ path: envPathFallback });
			return;
		}
	} catch {
		// dotenv not available, try manual parsing
	}

	// Manual parsing fallback
	const fileToLoad = fs.existsSync(envPath) ? envPath : envPathFallback;
	if (fs.existsSync(fileToLoad)) {
		const content = fs.readFileSync(fileToLoad, 'utf-8');
		const lines = content.split('\n');
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#')) {
				const match = trimmed.match(/^([^=]+)=(.*)$/);
				if (match) {
					const key = match[1].trim();
					let value = match[2].trim();
					// Remove quotes if present
					if (
						(value.startsWith('"') && value.endsWith('"')) ||
						(value.startsWith("'") && value.endsWith("'"))
					) {
						value = value.slice(1, -1);
					}
					if (!process.env[key]) {
						process.env[key] = value;
					}
				}
			}
		}
	}
}

loadEnvFile();

// Get Convex URL from environment
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
	console.error('Error: CONVEX_URL environment variable is not set');
	console.error('Please set it to your Convex deployment URL');
	console.error(
		'You can find it in your .env.local file or Convex dashboard'
	);
	process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Read JSONL file and parse each line
function readJSONL(filePath) {
	const content = fs.readFileSync(filePath, 'utf-8');
	return content
		.split('\n')
		.filter((line) => line.trim().length > 0)
		.map((line) => JSON.parse(line));
}

async function main() {
	console.log('🚀 Starting migration...\n');

	try {
		// Step 1: Import ingredients
		console.log('📦 Step 1: Importing ingredients...');
		const ingredientsPath = path.join(__dirname, '..', 'ingredients.jsonl');
		if (!fs.existsSync(ingredientsPath)) {
			throw new Error(`Ingredients file not found: ${ingredientsPath}`);
		}

		const ingredients = readJSONL(ingredientsPath);
		console.log(`   Found ${ingredients.length} ingredients`);

		const ingredientMap = await client.action('migrate:importIngredients', {
			ingredients,
		});

		console.log(
			`   ✅ Imported ${Object.keys(ingredientMap).length} ingredients\n`
		);

		// Step 2: Import recipes
		console.log('📝 Step 2: Importing recipes...');
		const recipesPath = path.join(__dirname, '..', 'recipes.jsonl');
		if (!fs.existsSync(recipesPath)) {
			throw new Error(`Recipes file not found: ${recipesPath}`);
		}

		const recipes = readJSONL(recipesPath);
		console.log(`   Found ${recipes.length} recipes`);

		const results = await client.action('migrate:importRecipes', {
			recipes,
			ingredientMap,
		});

		console.log(`   ✅ Imported ${results.length} recipes\n`);

		// Summary
		console.log('✨ Migration completed successfully!');
		console.log(`   - Ingredients: ${Object.keys(ingredientMap).length}`);
		console.log(`   - Recipes: ${results.length}`);
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

main();
