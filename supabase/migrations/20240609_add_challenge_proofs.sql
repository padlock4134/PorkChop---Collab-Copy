-- Create storage bucket for challenge proofs
insert into storage.buckets (id, name, public)
values ('challenge-proofs', 'challenge-proofs', false);

-- Create storage policy for authenticated users to upload
create policy "Users can upload their own challenge proofs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'challenge-proofs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policy for authenticated users to view their own proofs
create policy "Users can view their own challenge proofs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'challenge-proofs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add proof_photo column to weekly_challenge_claims
alter table public.weekly_challenge_claims
add column if not exists proof_photo text;
