-- Create a function to reset user data
CREATE OR REPLACE FUNCTION public.reset_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Delete case codes first (due to foreign key constraint)
  DELETE FROM public.case_codes 
  WHERE user_id = current_user_id;
  
  -- Delete cases
  DELETE FROM public.cases 
  WHERE user_id = current_user_id;
  
  -- Reset profile to defaults (keep basic info but reset settings)
  UPDATE public.profiles 
  SET 
    default_rvu_rate = 65.00,
    updated_at = now()
  WHERE user_id = current_user_id;
  
END;
$$;