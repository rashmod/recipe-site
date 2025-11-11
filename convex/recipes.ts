import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./_utils";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("recipes").collect();
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    ingredients: v.string(),
    instructions: v.string(),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireAdmin(ctx, args.adminSecret ?? null);
    await ctx.db.insert("recipes", args);
  },
});

export const remove = mutation({
  args: { id: v.id("recipes"), adminSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    requireAdmin(ctx, args.adminSecret ?? null);
    await ctx.db.delete(args.id);
  },
});
