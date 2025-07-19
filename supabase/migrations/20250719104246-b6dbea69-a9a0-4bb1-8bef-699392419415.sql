-- Create a default admin user for testing
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Insert a test admin user into auth.users (this is just for demonstration)
  -- In practice, you'll create this user through the auth signup flow
  -- and then run the following to make them admin:
  
  -- First, let's create a function to easily promote users to admin
  -- You can use this function later when you create the actual admin user
END $$;

-- Create a function to promote a user to admin (useful for testing)
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user by email
  SELECT au.id INTO target_user_id 
  FROM auth.users au 
  WHERE au.email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Add admin role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Create a function to reset any user's password (admin function)
CREATE OR REPLACE FUNCTION admin_reset_password(user_email text, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can reset passwords';
  END IF;
  
  -- This function would need to be implemented with Supabase admin functions
  -- For now, return true to indicate function exists
  RETURN true;
END;
$$;