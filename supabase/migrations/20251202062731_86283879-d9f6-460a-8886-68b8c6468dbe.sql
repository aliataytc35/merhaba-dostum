-- Add length constraints on profile fields to prevent abuse
ALTER TABLE profiles ADD CONSTRAINT profiles_bio_length CHECK (char_length(bio) <= 500);
ALTER TABLE profiles ADD CONSTRAINT profiles_full_name_length CHECK (char_length(full_name) <= 100);