-- Plays a custom "car horn" sound for push notifications instead of the
-- (previously unset) silent default. The sound file itself is bundled into
-- the native app via the expo-notifications config plugin
-- (expo/assets/sounds/car_horn.wav, app.json) and only takes effect in a
-- native build — Expo Go and web can't play custom notification sounds.
create or replace function public.notify_user(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_action_route text default null,
  p_action_params jsonb default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_token record;
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.notifications (user_id, type, title, message, action_route, action_params)
  values (p_user_id, p_type, p_title, p_message, p_action_route, p_action_params);

  for v_token in select token from public.push_tokens where user_id = p_user_id loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      body := jsonb_build_object(
        'to', v_token.token,
        'title', p_title,
        'body', p_message,
        'sound', 'car_horn.wav',
        'data', jsonb_build_object('route', p_action_route, 'params', p_action_params)
      )
    );
  end loop;
end;
$$;
