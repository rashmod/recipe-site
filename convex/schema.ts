import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  recipes: defineTable({
    title: v.string(),
    ingredients: v.string(), // newline separated
    instructions: v.string(), // newline separated
  }),
});
