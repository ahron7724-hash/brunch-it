-- The written recipe itself (ingredients and method, exactly as the admin bakes it),
-- kept apart from the raw-material list that only drives stock deduction.

alter table public.recipe_notes alter column notes drop not null;
alter table public.recipe_notes drop constraint recipe_notes_notes_check;
alter table public.recipe_notes add constraint recipe_notes_notes_check check (char_length(notes) between 1 and 2000);

alter table public.recipe_notes
  add column recipe text check (char_length(recipe) between 1 and 6000),
  add constraint recipe_notes_not_empty check (notes is not null or recipe is not null);
