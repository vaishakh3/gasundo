CREATE TABLE IF NOT EXISTS public.rate_limits (
    ip_address text PRIMARY KEY,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now()
);

-- Note: We must enable RLS and create policies or just use service_role,
-- but since we're calling this from an Edge Function with service_role, we can bypass RLS.
-- However, we still need the function to be accessible to the Edge Function.
-- The function below will atomically check and increment the rate limit.

CREATE OR REPLACE FUNCTION public.check_rate_limit(client_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    limit_window interval := '1 minute';
    max_requests integer := 5;
    current_count integer;
    window_time timestamp with time zone;
BEGIN
    -- Try to find the existing record for this IP
    SELECT request_count, window_start 
    INTO current_count, window_time
    FROM public.rate_limits 
    WHERE ip_address = client_ip;

    IF FOUND THEN
        -- Check if the window has expired
        IF now() > (window_time + limit_window) THEN
            -- Window expired, reset
            UPDATE public.rate_limits 
            SET request_count = 1, window_start = now() 
            WHERE ip_address = client_ip;
            RETURN true;
        ELSE
            -- Within window, check limit
            IF current_count >= max_requests THEN
                RETURN false; -- Rate limit exceeded
            ELSE
                -- Increment count
                UPDATE public.rate_limits 
                SET request_count = request_count + 1 
                WHERE ip_address = client_ip;
                RETURN true;
            END IF;
        END IF;
    ELSE
        -- No record found, insert a new one
        INSERT INTO public.rate_limits (ip_address, request_count, window_start) 
        VALUES (client_ip, 1, now());
        RETURN true;
    END IF;
END;
$$;
