-- Create function to recalculate RVUs with MPPR step-down
CREATE OR REPLACE FUNCTION recalculate_case_rvus()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    case_record RECORD;
    code_record RECORD;
    adjusted_total DECIMAL;
    adjusted_value DECIMAL;
    code_counter INTEGER;
    adjustment_factor DECIMAL;
    user_rvu_rate DECIMAL;
BEGIN
    -- Loop through all cases that have codes
    FOR case_record IN 
        SELECT DISTINCT c.id, c.user_id
        FROM public.cases c
        JOIN public.case_codes cc ON c.id = cc.case_id
    LOOP
        adjusted_total := 0;
        code_counter := 0;
        
        -- Get user's RVU rate (default to 65 if not set)
        SELECT COALESCE(default_rvu_rate, 65.00) INTO user_rvu_rate
        FROM public.profiles 
        WHERE user_id = case_record.user_id;
        
        -- Loop through codes for this case, ordered by RVU descending (MPPR logic)
        FOR code_record IN
            SELECT rvu
            FROM public.case_codes
            WHERE case_id = case_record.id
            ORDER BY rvu DESC
        LOOP
            code_counter := code_counter + 1;
            
            -- Apply MPPR adjustment factors
            IF code_counter = 1 THEN
                -- First (highest) code gets 100%
                adjustment_factor := 1.0;
            ELSE
                -- All subsequent codes get 50% under MPPR
                adjustment_factor := 0.5;
            END IF;
            
            adjusted_total := adjusted_total + (code_record.rvu * adjustment_factor);
        END LOOP;
        
        -- Calculate estimated value
        adjusted_value := adjusted_total * user_rvu_rate;
        
        -- Update the case with recalculated values
        UPDATE public.cases 
        SET 
            total_rvu = ROUND(adjusted_total, 2),
            estimated_value = ROUND(adjusted_value, 2),
            updated_at = now()
        WHERE id = case_record.id;
        
    END LOOP;
    
    RAISE NOTICE 'RVU recalculation completed for all cases with MPPR step-down applied';
END;
$$;

-- Execute the recalculation
SELECT recalculate_case_rvus();