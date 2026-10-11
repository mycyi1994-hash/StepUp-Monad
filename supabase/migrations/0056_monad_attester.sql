-- Monad deployment service account. No human account has settlement privileges.
UPDATE public.economy_settings SET value=to_jsonb('ddccfa65-12b6-44d9-857e-1a861c3df544'::text) WHERE key='attester_user_id';
